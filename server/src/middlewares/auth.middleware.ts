import jwt from "jsonwebtoken";
import type {Request, Response, NextFunction} from "express";
import { config } from "../config/config.js";
import { decodedToken } from "../types/token.js"
import { User } from "../models/user.model.js";

export async function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ status: false, message: "Unauthorized" });

  try {
    const decodedToken = jwt.verify(token, config.accessTokenSecret!) as decodedToken;
    const user = await User.findById(decodedToken?.userId);
    
    if (!user) {
      res.clearCookie("accessToken");
      return res.status(401).json({
        status: false,
        message: "Invalid token. Please login again"
      });
    }
    
    // inject fetched user inside request object
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", (err as Error)?.message)
    return res.status(503).json({success: false, message: "Internal server error, Please try gain later" })
  }
}

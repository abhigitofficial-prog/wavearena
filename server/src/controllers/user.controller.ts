import type { Request, Response } from "express";
import { User } from "../models/user.model.js";
import { cookieOptions } from "../config/config.js"

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    if ([firstName, lastName, email, password].some(
          (value) => !value || typeof value !== "string" || value.trim() === ""
        )) {
      return res.status(400).json({ success: false, message: "Required fields cannot  be empty"})
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: "Another user with this email already exists" });

    const createdUser = await User.create({ firstName, lastName, email, password });
    if (!createdUser) return res.status(503).json({ success: false, message: "Failed to create user, Try again later" });

    const accessToken = await createdUser.generateAccessToken();
    await createdUser.save({ validateBeforeSave: false });

    res.cookie("accessToken", accessToken, cookieOptions);
    return res.status(201).json({ success: true, message: "user created successfully" });
  } catch (err) {
    console.error("Error in user registration controller:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "Internal server error, Please try again later" });
  }
}

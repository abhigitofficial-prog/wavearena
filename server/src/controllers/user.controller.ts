import type { Request, Response } from "express";
import { User } from "../models/user.model.js";
import { cookieOptions } from "../config/config.js"

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body;
    
    if ([firstName, lastName, email, password].some(
          (value) => !value || typeof value !== "string" || value.trim() === ""
        )) {
      return res.status(400).json({ success: false, message: "Required fields cannot  be empty" })
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: "Another user with this email already exists" });

    const createdUser = await User.create({ firstName, lastName, userName, email, password });
    if (!createdUser) return res.status(503).json({ success: false, message: "Failed to create user, Try again later" });

    const accessToken = await createdUser.generateAccessToken();
    await createdUser.save({ validateBeforeSave: false });

    res.cookie("accessToken", accessToken, cookieOptions);
    return res.status(201).json({ success: true, message: "user created successfully" });
  } catch (err) {
    console.error("Error in user registration controller:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "internal server error, Please try again later" });
  }
}

export const loginUser = async (req: Request, res: Response) => {
  const { userName, email, password } = req.body;

  if (
    !password ||
    typeof password !== "string" ||
    password.trim() === "" ||
    (!userName && !email)
  ) {
    return res.status(400).json({
      success: false,
      message: "Username/email and password are required",
    });
  }

  try {
    // find user record in db using username or email
    const user = await User.findOne({
      $or: [
        ...(userName ? [{ userName }] : []),
        ...(email ? [{ email }] : []),
      ],
    });
    
    if (!user) return res.status(400).json({ success: true, message: "invalid credentials" });

    // compare db stored password with user provided password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) return res.status(400).json({ success: true, message: "invalid credentials" });

    // generate access token ans store inside cookie
    const accessToken = await user.generateAccessToken();
    res.cookie("accessToken", accessToken, cookieOptions);
    return res.status(200).json({ success: true, message: "login successfully" })
  } catch (err) {
    console.error("Error in user login controller:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "internal server error, Please try again later" });
  }
}

export const logoutUser = async (_req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken");
    res.redirect("/login");
  } catch (err) {
    console.error("Error logout controller:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "internal server error" });
  }
}

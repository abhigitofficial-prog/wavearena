import type { Request, Response } from "express";
import { User } from "../models/user.model.js";
import { client as redis, isRedisConnected } from "../utils/redis.js";
import { cookieOptions } from "../config/config.js"
import { sendVerificationEmail } from "../utils/mail.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// user registration business logic
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body;
    
    if ([firstName, lastName, userName, email, password].some(
          (value) => !value || typeof value !== "string" || value.trim() === ""
        )) {
      return res.status(400).json({ success: false, message: "Required fields cannot  be empty" })
    }

    const trustedEmailDomains = ["outlook", "hotmail", "gmail"];
    const isTrusted = trustedEmailDomains.some(domain => email.toLowerCase().endsWith(`@${domain}`));
    if (!isTrusted) return res.status(400).json({ success: false, message: "only outlook, hotmail and gmail are allowed" });
    
    let existingUser;
    existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: "Another user with this email already exists" });
    existingUser = await User.findOne({ userName });
    if (existingUser) return res.status(409).json({ success: false, message: "This username is already taken, Try something else" });
    
    const createdUser = await User.create({ firstName, lastName, userName, email, password });
    if (!createdUser) return res.status(503).json({ success: false, message: "Failed to create user, Try again later" });

    // send verification email with OTP
    const otpRes = await sendVerificationEmail(email, firstName);
    if (!otpRes) {
      return res.status(400).json({ success: false, message: "Failed to send verification email" });
    }
    if (isRedisConnected()) {
      await redis.set(`otp:${email}`, otpRes, { EX: 600 }); // 10 min expiry
    }
    
    const accessToken = await createdUser.generateAccessToken();
    await createdUser.save({ validateBeforeSave: false });

    res.cookie("accessToken", accessToken, cookieOptions);
    return res.status(201).json({ success: true, message: "user created successfully" });
  } catch (err) {
    console.error("Error in user registration controller:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "internal server error, Please try again later" });
  }
}

// user login business logic
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
    }).select("+password");
    
    if (!user) return res.status(400).json({ success: false, message: "invalid credentials" });
    if (!user.isVerified) return res.status(401).json({ success: false, message: "Please verify your account before login" });
    
    // compare db stored password with user provided password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) return res.status(400).json({ success: false, message: "invalid credentials" });

    // generate access token ans store inside cookie
    const accessToken = await user.generateAccessToken();
    res.cookie("accessToken", accessToken, cookieOptions);

    // remove password from user object before sending response
    const { password: _password, ...userObject } = user.toObject();

    return res.status(200).json({ success: true, user: userObject, message: "login successfully" })
  } catch (err) {
    console.error("Error in user login controller:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "internal server error, Please try again later" });
  }
}

// user logout functionality
export const logoutUser = async (_req: Request, res: Response) => {
  try {
    res.clearCookie("accessToken");
    return res.status(200).json({ success: true, message: "Logout successfully" });
  } catch (err) {
    console.error("Error logout controller:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "internal server error" });
  }
}

// change password of current loggedin user
export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  
  if ([currentPassword, newPassword].some(
    (value) => !value || typeof value !== "string" || value.trim() === ""
  )) return res.status(400).json({ success: false, message: "Provide required fields" });

  try {
    const user = await User.findById(req.user?._id).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "unauthorized" });

    const isCorrectPassword = await user.isPasswordCorrect(currentPassword);
    if (!isCorrectPassword) return res.status(401).json({ success: false, message: "unauthorized" });
    user.password = newPassword;
    await user.save();
    return res.status(200).json({ success: true, message: "password changed" });
  } catch (err) {
    console.error("Error changing password in user controller:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "internal server error, Try again later" });
  }
}

// update  user profile picture
export const changeProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!req.files) {
      return res.status(400).json({ success: false, message: "No files were uploaded." });
    }

    const file = req.files.profilePicture;

    if (!file || Array.isArray(file)) {
      return res.status(400).json({ success: false, message: "upload only a single image under 5 MB" });
    }

    // Validate file type
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ success: false, message: "Invalid file type. Only jpg, jpeg, png, and webp are allowed." });
    }

    // Fetch the user to get the current avatar publicId
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const oldPublicId = user.avatar?.publicId;

    // Move uploaded file to /tmp using express-fileupload's built-in mv()
    const tmpFilePath = `/tmp/${Date.now()}-${file.name}`;
    await file.mv(tmpFilePath);

    // Upload to Cloudinary
    const cloudinaryRes = await uploadToCloudinary(tmpFilePath);

    if (!cloudinaryRes) {
      return res.status(500).json({ success: false, message: "Failed to upload image. Please try again." });
    }

    // Update user's avatar in database
    user.avatar = {
      url: cloudinaryRes.secure_url,
      publicId: cloudinaryRes.public_id,
    };
    await user.save();

    // Delete the old image from Cloudinary after successful update
    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      avatar: {
        url: cloudinaryRes.secure_url,
        publicId: cloudinaryRes.public_id,
      },
    });
  } catch (err) {
    console.error("Error changing profile picture:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "Internal server error. Please try again later." });
  }
};

// fetch current loggedin user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) return res.status(400).json({ success: false, message: "Invalid token, Please login again." });
    return res.status(200).json({ success: true, message: "user fetched successfully", currentUser: user });
  } catch (err) {
    console.error("Error fetching current user", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "Failed to fetch user details" });
  }
}

// verify otp 
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { otp, email } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: "Please provide an otp to verify" });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "could not found the user" });
    const redisOtp = await redis.get(`otp:${email}`);
    if (!redisOtp) return res.status(503).json({ success: false, message: "service unavilable, Please try again laeter" });
    if (redisOtp !== otp) return res.status(400).json({ success: false, message: "invalid otp" });
    user.isVerified = true;
    await user.save();
    return res.status(200).json({ success: true, message: "otp verified" });
  } catch (err) {
    console.error("Failed to verify otp:", (err as Error)?.message);
    return res.status(500).json({ success: false, message: "Internal server error, Try again later" });
  }
}

// resend otp
export const resendOTP = async (req: Request, res: Response) => {
  const { email, firstName } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "please provide an email addess" });
  // const user = await User.findOne({ email });
  // if (!user) return res.status(400).json({ success: false, message: "could not found the user" });
  const newOtp = await sendVerificationEmail(email, firstName ?? "there"); // avoiding unnecessary db call
  if (!newOtp) return res.status(503).json({ success: false, message: "failed to send otp, Please try again later" });
  const redisOtp = await redis.get(`otp:${email}`);
  if (redisOtp) await redis.del(`otp:${email}`);
  await redis.set(`otp:${email}`, newOtp, { EX: 600 }); // 10 min expiry
  return res.status(200).json({ success: true, message: "otp send successfully" });
}

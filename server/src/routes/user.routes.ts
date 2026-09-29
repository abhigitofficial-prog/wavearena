import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
  registerUser,
  loginUser,
  logoutUser,
  changePassword,
  changeProfilePicture,
  getCurrentUser,
  verifyOTP
} from "../controllers/user.controller.js"

const router = express.Router();

router.route("/register").post(registerUser); // user registration
router.route("/login").post(loginUser); // user login
router.route("/logout").post(verifyJWT, logoutUser); // user logout
router.route("/change-password").post(verifyJWT, changePassword); // change password of current loggedin user
router.route("/change-profile-picture").post(verifyJWT, changeProfilePicture); // change user profile picture
router.route("/me").get(verifyJWT, getCurrentUser); // get current logged in user
router.route("/verify-user").post(verifyOTP);

export default router;

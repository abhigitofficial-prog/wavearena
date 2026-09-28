import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { registerUser, loginUser, logoutUser, changePassword } from "../controllers/user.controller.js"

const router = express.Router();

router.route("/register").post(registerUser); // user registration
router.route("/login").post(loginUser); // user login
router.route("/logout").post(verifyJWT, logoutUser); // user logout
router.route("/change-password").post(verifyJWT, changePassword); // change password of current loggedin user

export default router;

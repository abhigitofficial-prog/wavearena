import mongoose from "mongoose";
import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";

export interface IUser {
  firstName: string;
  lastName?: string;
  userName: string;
  email: string;
  password: string;
  avatar: {
    url: string | null;
    publicId: string | null;
  };
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): Promise<string>;
}

const userSchema = new mongoose.Schema<IUser, {}, IUserMethods>({
  firstName: {
    type: String,
    trim: true,
    required: [true, "First Name is required"],
    minlength: [3, "First Name must have at least 5 characters"],
    maxlength: [10, "First Name can have at most 10 characters"],
  },
  lastName: {
    type: String,
    trim: true,
    minlength: [3, "Last Name must have at least 5 characters"],
    maxlength: [10, "Last Name can have at most 10 characters"],
  },
  userName: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, "username is required"],
    unique: [true, "This username is taken. Try somethng else"],
    minlength: [5, "username must have at least 5 characters"],
    maxlength: [20, "username can have at most 20 characters"],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, "Email is required"],
    unique: [true, "Another account with this email is exist"],
    maxlength: [50, "email can have at most 50 characters"],
  },
  password: {
    type: String,
    trim: true,
    required: [true, "Password is required"],
    minlength: [8, "Password must have at least 8 characters"],
    maxlength: [20, "Password can have at most 20 characters"],
  },
  avatar: {
    url: {
      type: String,
      default: null
    },
    publicId: {
      type: String,
      default: null
    }
  },
  isVerified: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true })

// update password if user changed the password
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
})

// compare user password and db password for login
userSchema.methods.isPasswordCorrect = async function(password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password)
}

// generate access token
userSchema.methods.generateAccessToken = async function(){
  return jwt.sign({
    userId: this._id,
    email: this.email,
    userName: this.userName,
  }, process.env.ACCESS_TOKEN_SECRET!, {expiresIn: process.env.ACCESS_TOKEN_EXPIRY as SignOptions["expiresIn"]})
}

export const User = mongoose.model<IUser, mongoose.Model<IUser, {}, IUserMethods>>("User", userSchema)

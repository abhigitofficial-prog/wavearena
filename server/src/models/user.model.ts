import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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
    required: [true, "Username is required"],
    unique: [true, "This username is taken. Try somethng else"],
    minlength: [5, "Username must have at least 5 characters"],
    maxlength: [20, "Username can have at most 20 characters"],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, "Email is required"],
    unique: [true, "Another account with this email is exist"],
    minlength: [5, "Username must have at least 5 characters"],
    maxlength: [20, "Username can have at most 20 characters"],
  },
  password: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, "Password is required"],
    minlength: [8, "Password must have at least 5 characters"],
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

export const user = mongoose.model("User", userSchema)

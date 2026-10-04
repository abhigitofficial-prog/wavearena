import { Config } from "../types/config.js"
import type { CookieOptions } from "express";

export const config: Config = {
  port: process.env.PORT as string,
  appOrigin: process.env.APP_ORIGIN as string,
  databaseURL: process.env.MONGODB_URI as string,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY as string,
  smtp_user: process.env.SMTP_USER as string,
  smtp_password: process.env.SMTP_PASS as string,
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
  },
  redis: {
    host: process.env.REDIS_HOST as string,
    port: process.env.REDIS_PORT as string,
    username: process.env.REDIS_USERNAME as string,
    password: process.env.REDIS_PASSWORD as string,
  }
};

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 1000 * 24 * 7, // 7 days
  path: "/",
};

import { Config } from "../types/config.js"
import type { CookieOptions } from "express";

export const config: Config = {
  port: process.env.PORT as string,
  appOrigin: process.env.APP_ORIGIN as string,
  databaseURL: process.env.MONGODB_URI as string,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY as string,
};

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 1000 * 24 * 7, // 7 days
  path: "/",
};

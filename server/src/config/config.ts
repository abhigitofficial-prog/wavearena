import { Config } from "../types/config.js"

export const config: Config = {
  port: process.env.PORT as string,
  appOrigin: process.env.APP_ORIGIN as string,
  databaseURL: process.env.MONGODB_URI as string,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY as string,
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
};

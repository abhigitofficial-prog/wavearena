import { string } from "zod";

export type Cloudinary = {
  cloud_name: string; 
  api_key: string; 
  api_secret: string;
}

export type RedisClient = {
  host: string;
  port: string;
  username: string;
  password: string;
}

export type Config = {
  port: string;
  appOrigin: string;
  databaseURL: string;
  accessTokenSecret: string;
  accessTokenExpiry: string;
  smtp_user: string;
  smtp_password: string;
  cloudinary: Cloudinary;
  redis: RedisClient;
};

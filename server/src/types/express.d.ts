import type { HydratedDocument } from "mongoose";
import type { IUser } from "../models/user.model.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: HydratedDocument<IUser>;
  }
}

export {};
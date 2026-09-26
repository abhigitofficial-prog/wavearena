import mongoose from "mongoose";
import { config } from "../config/config.js"

export async function connectDatabase() {
  const connectionString: string = config.databaseURL as string;
  if (!connectionString) {
    throw new Error("Connection URL not found. Database connection failed!")
  }
  
  try {
    await mongoose.connect(connectionString)
    console.log("Database connected")
  } catch (err) {
    console.error("Error connecting database:", (err as Error)?.message)
    process.exit(1)
  }
}

import mongoose from "mongoose";

export async function connectDatabase() {
  const connectionString: string = process.env.MONGODB_URI as string
  if (!connectionString) {
    throw new Error("Connection URL not found. Database connection failed!")
  }
  
  try {
    mongoose.connect(connectionString)
    console.log("Database connected")
  } catch (err) {
    console.error("Error connecting database:", (err as Error)?.message)
    process.exit(1)
  }
}

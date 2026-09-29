import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/config.js";
import fs from "fs";

const cloudName = config.cloudinary.cloud_name;
const apiKey = config.cloudinary.api_key;
const apisecret = config.cloudinary.api_secret;

if (!cloudName) throw new Error("cloudinary Cloud Name missing.")
if (!apiKey) throw new Error("cloudinary API Key missing.")
if (!apisecret) throw new Error("cloudinary API Secret missing.")

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apisecret,
})

export async function uploadToCloudinary(filePath: string) {
  try {
    if (!filePath) return null;
    // upload image to cloudinary
    const res = await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
      folder: "avatar",
    })
    
    // remove from server after upload
    fs.unlinkSync(filePath);
    return res;
  } catch (err) {
    console.error("Error uploading to cloudinary:", (err as Error)?.message);
    // remove from server if upload failed
    try {
      fs.unlinkSync(filePath);
    } catch {
      // file might already be deleted or never existed
    }
    return null;
  }
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    if (!publicId) return null;
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    return res;
  } catch (err) {
    console.error("Error deleting from cloudinary:", (err as Error)?.message);
    return null;
  }
}

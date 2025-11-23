const dotenv = require("dotenv");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

dotenv.config();

// 🔹 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Use multer's local storage (temporary)
const upload = multer({ dest: "uploads/" });

// 🔹 Utility: upload to Cloudinary manually
export const uploadToCloudinary = async (localPath) => {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: "posts",
      transformation: [{ width: 1000, crop: "limit", quality: "auto" }],
    });
    // Remove local temp file after upload
    fs.unlinkSync(localPath);
    return result.secure_url;
  } catch (error) {
    fs.unlinkSync(localPath);
    throw error;
  }
};

export { upload };
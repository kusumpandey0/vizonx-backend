const cloudinary = require("../config/cloudinary");

// Your original config (kept same)
const uploadFieldsConfig = {
  RichText: {
    maxCount: 6,
    allowedTypes: ["image/png", "image/jpeg", "image/jpg"],
    imageStoragePath: "blog/richtext", // Cloudinary folder now
    maxVideos: 0,
  },
};

async function saveBase64Image(base64String, fieldName) {
  const fieldConfig = uploadFieldsConfig[fieldName];
  if (!fieldConfig) throw new Error(`Unknown field: ${fieldName}`);

  // Match: data:image/png;base64,XXXXX
  const matches = base64String.match(/^data:image\/([a-z]+);base64,(.+)$/);
  if (!matches || matches.length !== 3)
    throw new Error("Invalid Base64 image format");

  const mimeType = `image/${matches[1]}`;
  const base64Data = matches[0]; // Keep full data:image/... string for Cloudinary

  // Validate type like before
  if (!fieldConfig.allowedTypes.includes(mimeType)) {
    throw new Error(
      `${fieldName} only accepts: ${fieldConfig.allowedTypes.join(", ")}`
    );
  }

  // Upload to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(base64Data, {
    folder: fieldConfig.imageStoragePath, // uses your config folder
  });

  return {
    fileName: uploadResult.public_id,
    filePath: uploadResult.secure_url,
    url: uploadResult.secure_url, // returned to frontend
  };
}

module.exports = { saveBase64Image, uploadFieldsConfig };

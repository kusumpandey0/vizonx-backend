const fs = require("fs").promises;
const path = require("path");
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch (err) {
    if (err.code === "ENOENT") {
      await fs.mkdir(dir, { recursive: true });
      console.log("Created directory:", dir);
    }
  }
}
const uploadFieldsConfig = {
  RichText: {
    maxCount: 6, // Max 6 files (corrected comment from "Max 1 file")
    allowedTypes: ["image/png", "image/jpeg", "image/jpg"], // Only images
    imageStoragePath: "uploads/richtext/image", // Storage folder
    maxVideos: 0, // No videos allowed
  },
};

async function saveBase64Image(base64String, fieldName) {
  const fieldConfig = uploadFieldsConfig[fieldName];
  if (!fieldConfig) throw new Error(`Unknown field: ${fieldName}`);

  const matches = base64String.match(/^data:image\/([a-z]+);base64,(.+)$/);
  if (!matches || matches.length !== 3)
    throw new Error("Invalid Base64 image format");

  const mimeType = `image/${matches[1]}`;
  const imageData = matches[2];
  if (!fieldConfig.allowedTypes.includes(mimeType)) {
    throw new Error(
      `${fieldName} only accepts: ${fieldConfig.allowedTypes.join(", ")}`
    );
  }

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = matches[1];
  const fileName = `${fieldName}-${uniqueSuffix}.${ext}`;
  const uploadPath = path.join(fieldConfig.imageStoragePath, fileName);

  await ensureDir(fieldConfig.imageStoragePath);
  await fs.writeFile(uploadPath, Buffer.from(imageData, "base64"));

  return {
    fileName,
    filePath: uploadPath,
    url: `${fieldConfig.imageStoragePath}/${fileName}`,
  };
}

module.exports = { saveBase64Image, uploadFieldsConfig };

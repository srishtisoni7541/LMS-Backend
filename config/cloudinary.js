

// require("dotenv").config();
const logger = require("../utils/logger");
const cloudinary = require("cloudinary").v2;

console.log(process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

logger.info("✅ Cloudinary configured successfully");

module.exports = cloudinary;

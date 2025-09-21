const cloudinary = require('../config/cloudinary');
const streamifier= require('streamifier');

const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};


module.exports = uploadToCloudinary;
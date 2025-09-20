



const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
 const allowedTypes = [
  "video/mp4",
  "video/quicktime", // .mov files ke liye
  "video/x-matroska", // .mkv
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];


  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only mp4, mkv videos, pdf files and images (jpg, jpeg, png) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, 
});


module.exports = upload;

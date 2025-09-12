const express = require("express");
const upload = require("../config/multer.js");
const { createLesson } = require("../controllers/admin/lesson.controllers.js");
const authMiddleware = require("../middlewares/auth.js");


const router = express.Router();

router.post(
  "/create",
  authMiddleware("admin"),   
  upload.single("file"),      
  createLesson
);

module.exports = router;

const express = require("express");
const upload = require("../config/multer.js");
const { createLesson, getAllLessons, softDeleteLesson, hardDeleteLesson } = require("../controllers/admin/lesson.controllers.js");
const authMiddleware = require("../middlewares/auth.js");


const router = express.Router();

router.post(
  "/create",
  authMiddleware("admin","instructor"),   
  upload.single("file"),      
  createLesson
);

router.get('/all',authMiddleware("admin","instructor"),getAllLessons);
router.delete('/delete/:id',authMiddleware('admin','instructor'),hardDeleteLesson)

module.exports = router;

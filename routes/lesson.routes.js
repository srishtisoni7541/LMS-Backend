const express = require("express");
const upload = require("../config/multer.js");
const { createLesson, getAllLessons, updateLesson, deleteLesson } = require("../controllers/admin/lesson.controllers.js");
const authMiddleware = require("../middlewares/auth.js");


const router = express.Router();

router.post(
  "/create",
  authMiddleware("admin"),   
  upload.single("file"),      
  createLesson
);

router.get('/all',authMiddleware("admin","instructor"),getAllLessons);
router.put('/update-lesson/:id',authMiddleware('admin','instructor'),upload.single('file'),updateLesson);
router.delete('/delete/:id',authMiddleware('admin','instructor'),deleteLesson)

module.exports = router;
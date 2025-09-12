const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { createCourse, getCourses, updateCourse, deleteCourse, getCourseById } = require('../controllers/admin/course.controllers');
const router = express.Router();




router.post('/create-course',authMiddleware("admin"),createCourse);
router.get('/get-all-courses',authMiddleware("student","admin","instructor"),getCourses);
router.put('/update-course/:id',authMiddleware("admin"),updateCourse);
router.delete('/delete-course/:id',authMiddleware("admin"),deleteCourse);
router.get('/get-course/:id',authMiddleware("student","admin","instructor"),getCourseById);
module.exports = router;
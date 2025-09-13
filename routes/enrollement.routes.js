const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { createEnrollment, getEnrollmentById, getEnrollments, cancelEnrollment } = require('../controllers/user/enrollement.controller');
const router = express.Router();


router.post('/enroll',authMiddleware("student"),createEnrollment);
router.get('/allenrollments',authMiddleware(["admin","instructor"]),getEnrollments);
router.get('/enrollment/:enrollmentId',authMiddleware(["admin","instructor","student"]),getEnrollmentById);
router.put('/cancel/:enrollmentId',authMiddleware("student"),cancelEnrollment);


module.exports=router;
const express = require('express');
const authMiddleware = require('../middlewares/auth');
const {  getEnrollmentById, getEnrollments, adminCancelEnrollment, requestCancelEnrollment, adminHandleCancel, createEnrollment,  } = require('../controllers/user/enrollement.controller');
const router = express.Router();


router.post('/enroll',authMiddleware("student"),createEnrollment);
router.get('/allenrollments',authMiddleware(["admin","instructor"]),getEnrollments);
router.get('/enrollment/:enrollmentId',authMiddleware(["admin","instructor","student"]),getEnrollmentById);
router.put('/cancel/:enrollmentId',authMiddleware("admin"),adminCancelEnrollment);
router.put('/request-cancel/:enrollmentId',authMiddleware("student"),requestCancelEnrollment);
router.post('/refund/:enrollmentId',authMiddleware("admin"),adminHandleCancel);


module.exports=router;
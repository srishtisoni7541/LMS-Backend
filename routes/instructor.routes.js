const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { makeInstructor, getAllInstructors, removeInstructor } = require('../controllers/admin/instructor.controllers');
const router = express.Router();

router.post('/make-instructor/:id',authMiddleware("admin"),makeInstructor);
router.get('/all-instructors',authMiddleware("admin"),getAllInstructors);
router.post('/remove-instructor/:userId',authMiddleware("admin"),removeInstructor);

module.exports = router;
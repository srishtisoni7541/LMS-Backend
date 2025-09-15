const express = require('express');
const { attemptQuiz, getStudentAttempts, getQuizAttempts, getAttemptById } = require('../controllers/attempt.controllers');
const router = express.Router();


router.post("/:quizId/attempt", authMiddleware("student"), attemptQuiz);

router.get("/my-attempts", authMiddleware("student"), getStudentAttempts);

router.get("/quiz/:quizId", authMiddleware(["admin", "instructor"]), getQuizAttempts);

router.get("/:attemptId", authMiddleware(["admin", "instructor", "student"]), getAttemptById);



module.exports = router;
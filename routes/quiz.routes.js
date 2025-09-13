const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { createQuiz, getQuizzes, getQuizById, updateQuiz, deleteQuiz } = require('../controllers/admin/quiz.controller');
const router = express.Router();


router.post("/create-quiz", authMiddleware("instructor"), createQuiz);
router.get("/get-all-quizzes", authMiddleware("admin", "instructor", "student"), getQuizzes);
router.get("/:quizId", authMiddleware("admin", "instructor", "student"), getQuizById);
router.put("/:quizId", authMiddleware("admin", "instructor"), updateQuiz);
router.delete("/:quizId", authMiddleware("instructor"), deleteQuiz);

module.exports = router;
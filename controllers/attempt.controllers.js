const { default: attemptModel } = require("../models/attempt.model.js");
const QuizQuesModel = require("../models/Quiz&Ques.model.js");
const ResponseHandler = require("../utils/responseHandler.js");


module.exports.attemptQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    const studentId = req.user._id; 

    const quiz = await QuizQuesModel.findById(quizId);
    if (!quiz) return ResponseHandler.notFound(res, "Quiz not found");

    let score = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) score++;
    });

    const attempt = new attemptModel({
      quiz: quizId,
      student: studentId,
      answers,
      score,
    });

    await attempt.save();

    return ResponseHandler.success(res, "Quiz attempted successfully", {
      attemptId: attempt._id,
      score,
      totalQuestions: quiz.questions.length,
    });
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

module.exports.getAttemptById = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await attemptModel.findById(attemptId)
      .populate("quiz", "title questions")
      .populate("student", "name email");

    if (!attempt) return ResponseHandler.notFound(res, "Attempt not found");

    return ResponseHandler.success(res, "Attempt fetched", attempt);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

module.exports.getStudentAttempts = async (req, res) => {
  try {
    const studentId = req.user._id;
    const attempts = await attemptModel.find({ student: studentId })
      .populate("quiz", "title")
      .sort({ attemptedAt: -1 });

    return ResponseHandler.success(res, "Attempts fetched", attempts);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

module.exports.getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const attempts = await attemptModel.find({ quiz: quizId })
      .populate("student", "name email")
      .sort({ attemptedAt: -1 });

    return ResponseHandler.success(res, "Quiz Attempts fetched", attempts);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

module.exports.deleteAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const attempt = await attemptModel.findByIdAndDelete(attemptId);

    if (!attempt) return ResponseHandler.notFound(res, "Attempt not found");

    return ResponseHandler.success(res, "Attempt deleted", attempt);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

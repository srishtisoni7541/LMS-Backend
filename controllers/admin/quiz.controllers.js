const { redisClient } = require("../../config/redis");
const { default: QuizQuesModel } = require("../../models/Quiz&Ques.model");
const ResponseHandler = require("../../utils/responseHandler");

exports.createQuiz = async (req, res, next) => {
  try {
    const quiz = await QuizQuesModel.create(req.body);
    return ResponseHandler.created(res, quiz, "Quiz created successfully");
  } catch (err) {
    next(err);
  }
};

exports.getQuizzesByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const cached = await redisClient.get(`quizzes:${moduleId}`);
    if (cached) {
      return ResponseHandler.success(res, JSON.parse(cached), "Quizzes from cache");
    }

    const quizzes = await QuizQuesModel.aggregate([
      { $match: { module: new mongoose.Types.ObjectId(moduleId) } },
      {
        $project: {
          title: 1,
          timeLimit: 1,
          questionsCount: { $size: "$questions" },
        },
      },
    ]);

    await redisClient.setEx(`quizzes:${moduleId}`, 1800, JSON.stringify(quizzes));
    return ResponseHandler.success(res, quizzes, "Quizzes fetched successfully");
  } catch (err) {
    next(err);
  }
};

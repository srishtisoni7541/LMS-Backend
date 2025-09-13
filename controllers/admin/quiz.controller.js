const ResponseHandler = require("../../utils/responseHandler");

const QuizQuesModel  = require("../../models/Quiz&Ques.model");
const { redisClient } = require("../../config/redis");
const { default: moduleModel } = require("../../models/module.model");
const mongoose = require("mongoose");   


module.exports.createQuiz = async (req, res) => {
  try {
    const { title, module, questions, timeLimit } = req.body;

    // Module check
    const moduledb = await moduleModel.findById(module);
    if (!moduledb) {
      return ResponseHandler.notFound(res, "Module not found");
    }

    // Quiz create
    const quiz = await QuizQuesModel.create({ title, module, questions, timeLimit });

    // Cache update
    const quizzes = await QuizQuesModel.aggregate([
      {
        $lookup: {
          from: "modules",
          localField: "module",
          foreignField: "_id",
          as: "module",
        },
      },
      { $unwind: "$module" },
      {
        $project: {
          _id: 1,
          title: 1,
          timeLimit: 1,
          "module._id": 1,
          "module.name": 1,
          questions: 1,
          totalQuestions: { $size: "$questions" },
        },
      },
    ]);

    await redisClient.set("quizzes", JSON.stringify(quizzes), { EX: 60 });

    return ResponseHandler.created(res, "Quiz created successfully", quiz);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

module.exports.getQuizzes = async (req, res) => {
  try {
    const cached = await redisClient.get("quizzes");
    if (cached) {
      const quizzes = JSON.parse(cached);
      if (!quizzes.length) {
        return ResponseHandler.notFound(res, "No quizzes found");
      }
      return ResponseHandler.success(res, "Quizzes fetched (cache)", quizzes);
    }

    const quizzes = await QuizQuesModel.aggregate([
      { $match: { isDeleted: false } }, 
      {
        $lookup: {
          from: "modules",
          localField: "module",
          foreignField: "_id",
          as: "module",
        },
      },
      { $unwind: "$module" },
      {
        $project: {
          _id: 1,
          title: 1,
          timeLimit: 1,
          "module._id": 1,
          "module.name": 1,
          questions: 1, 
          totalQuestions: { $size: "$questions" },
        },
      },
    ]);

    if (!quizzes.length) {
      return ResponseHandler.notFound(res, "No quizzes found");
    }

    await redisClient.set("quizzes", JSON.stringify(quizzes), { EX: 60 });

    return ResponseHandler.success(res, "Quizzes fetched successfully", quizzes);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};


module.exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;

    const cached = await redisClient.get(`quiz:${quizId}`);
    if (cached) {
      const quiz = JSON.parse(cached);
      if (quiz.isDeleted) {
        return ResponseHandler.notFound(res, "Quiz not found");
      }
      return ResponseHandler.success(res, "Quiz fetched (cache)", quiz);
    }

    const quiz = await QuizQuesModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(quizId), isDeleted: false } }, // <-- filter
      {
        $lookup: {
          from: "modules",
          localField: "module",
          foreignField: "_id",
          as: "module",
        },
      },
      { $unwind: "$module" },
    ]);

    if (!quiz.length) {
      return ResponseHandler.notFound(res, "Quiz not found");
    }

    await redisClient.set(`quiz:${quizId}`, JSON.stringify(quiz[0]), { EX: 60 });

    return ResponseHandler.success(res, "Quiz fetched successfully", quiz[0]);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

module.exports.updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const updates = req.body;

    const quiz = await QuizQuesModel.findByIdAndUpdate(quizId, updates, { new: true });

    if (!quiz) {
      return ResponseHandler.notFound(res, "Quiz not found");
    }

    await redisClient.del("quizzes");
    await redisClient.del(`quiz:${quizId}`);

    return ResponseHandler.success(res, "Quiz updated successfully", quiz);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};


module.exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await QuizQuesModel.findByIdAndUpdate(
      quizId,
      { isDeleted: true },
      { new: true }
    );

    if (!quiz) {
      return ResponseHandler.notFound(res, "Quiz not found");
    }

    await redisClient.del("quizzes");
    await redisClient.del(`quiz:${quizId}`);

    return ResponseHandler.success(res, "Quiz deleted (soft delete) successfully", quiz);
  } catch (error) {
    return ResponseHandler.serverError(res, error.message);
  }
};

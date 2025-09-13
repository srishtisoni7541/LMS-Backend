const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, 
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  questions: [questionSchema],
  isDeleted: { type: Boolean, default: false },

  timeLimit: Number,
});

module.exports = mongoose.model("Quiz", quizSchema);

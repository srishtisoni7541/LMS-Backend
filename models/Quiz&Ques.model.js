import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true } // index of correct option
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
  questions: [questionSchema],
  timeLimit: Number // in minutes
});

export default mongoose.model("Quiz", quizSchema);

import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [{ type: Number }], // index-based answers
  score: Number,
  attemptedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Attempt", attemptSchema);

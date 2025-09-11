import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  watchedDuration: { type: Number, default: 0 }, // seconds watched
  completed: { type: Boolean, default: false },
  lastAccessed: { type: Date, default: Date.now }
});

export default mongoose.model("Progress", progressSchema);

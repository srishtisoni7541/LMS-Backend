import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  deleted: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
});

export default mongoose.model("Module", moduleSchema);

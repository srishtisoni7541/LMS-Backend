import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
  type: { type: String, enum: ["video", "pdf"], required: true },
  contentUrl: String, // video signed URL ya pdf link
  duration: Number,   // seconds me
  order: { type: Number, default: 0 }
});

export default mongoose.model("Lesson", lessonSchema);

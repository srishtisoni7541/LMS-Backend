import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  progress: { type: Number, default: 0 }, // %
  status: { type: String, enum: ["active", "completed"], default: "active" },
  enrolledAt: { type: Date, default: Date.now }
});

export default mongoose.model("Enrollment", enrollmentSchema);

import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  issuedAt: { type: Date, default: Date.now },
  certificateUrl: String 
});

export default mongoose.model("Certificate", certificateSchema);

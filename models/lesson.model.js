const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true,
  },
  type: { type: String, enum: ["video", "pdf"], required: true },
  contentUrl: String,
  duration: Number,
  order: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
});
module.exports = mongoose.model("Lesson", lessonSchema);

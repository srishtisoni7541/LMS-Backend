const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true }, // SEO-friendly url
  description: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  modules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
  price: { type: Number, default: 0 },
  thumbnail: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports= mongoose.model("Course", courseSchema);

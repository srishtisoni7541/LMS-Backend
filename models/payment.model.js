const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentMethod: { type: String, enum: ["razorpay", "paypal", "card", "upi"], required: true },
  paymentStatus: { type: String, enum: ["pending", "success", "failed", "refunded"], default: "pending" },
  transactionId: { type: String }, 
  paymentDate: { type: Date, default: Date.now },
  refundDate: { type: Date },
  isRefunded: { type: Boolean, default: false },
});

module.exports = mongoose.model("Payment", paymentSchema);

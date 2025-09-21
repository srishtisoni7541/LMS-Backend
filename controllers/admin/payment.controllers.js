const Payment = require("../../models/payment.model");
const ResponseHandler = require("../../utils/responseHandler");
const razorpay = require("../../config/razorpay");
const crypto = require("crypto");

exports.createPaymentOrder = async (req, res) => {
  try {
    const { student, course, amount, currency = "INR" } = req.body;
    // console.log(req.body);

    const options = {
      amount: amount * 100, 
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Save order in DB
    const payment = await Payment.create({
      student,
      course,
      amount,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      transactionId: order.id, 
    });

    return ResponseHandler.success(res, { order, payment }, "Order created successfully");
  } catch (err) {
    return ResponseHandler.serverError(res, err.message);
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    // console.log(req.body);

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return ResponseHandler.badRequest(res, "Payment verification failed");
    }

    // Update payment status in DB
    const payment = await Payment.findOneAndUpdate(
      { transactionId: razorpay_order_id },
      { paymentStatus: "success", transactionId: razorpay_payment_id },
      { new: true }
    );

    return ResponseHandler.success(res, payment, "Payment verified successfully");
  } catch (err) {
    console.log(err);
    return ResponseHandler.serverError(res, err.message);
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);
    if (!payment) return ResponseHandler.notFound(res, "Payment not found");
    if (payment.isRefunded) return ResponseHandler.badRequest(res, "Payment already refunded");
    await razorpay.payments.refund(payment.transactionId); 

    payment.paymentStatus = "refunded";
    payment.isRefunded = true;
    payment.refundDate = new Date();
    await payment.save();

    return ResponseHandler.success(res, "Payment refunded successfully", payment);
  } catch (err) {
    return ResponseHandler.serverError(res, err.message);
  }
};

exports.getPayments = async (req, res) => {
  try {
    const filter = req.user.role === "student" ? { student: req.user.id } : {};
    const payments = await Payment.find(filter)
      .populate("student", "name email")
      .populate("course", "title");
    return ResponseHandler.success(res, "Payments fetched successfully", payments);
  } catch (err) {
    return ResponseHandler.serverError(res, err.message);
  }
};

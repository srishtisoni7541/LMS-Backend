const express = require("express");
const authMiddleware = require("../middlewares/auth");
const {  createPaymentOrder, refundPayment, getPayments, verifyPayment } = require("../controllers/admin/payment.controllers");
const router = express.Router();

router.post('/create',authMiddleware('student'),createPaymentOrder);
router.put('/update/:paymentId',authMiddleware('admin'),verifyPayment);
router.post('/refund/:paymentId',authMiddleware('admin'),refundPayment);
router.get('/get-payments',authMiddleware('student','admin'),getPayments);

module.exports = router;
const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    totalFees: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    pendingAmount: { type: Number, required: true },
    paymentMode: { type: String, required: true },
    paymentDate: { type: Date, required: true },
    receiptNumber: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fee', feeSchema);

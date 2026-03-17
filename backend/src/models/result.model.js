const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true },
    className: { type: String, required: true },
    subject: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    grade: { type: String, required: true },
    resultStatus: { type: String, enum: ['Pass', 'Fail'], required: true },
    percentage: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Result', resultSchema);

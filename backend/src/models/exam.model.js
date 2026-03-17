const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    examName: { type: String, required: true },
    className: { type: String, required: true },
    subject: { type: String, required: true },
    examDate: { type: Date, required: true },
    totalMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);

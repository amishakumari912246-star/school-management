const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    studentName: { type: String, required: true },
    rollNo: { type: String, required: true },
    status: { type: String, enum: ['Present', 'Absent'], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);

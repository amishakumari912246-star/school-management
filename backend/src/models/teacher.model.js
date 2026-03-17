const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, required: true },
    subject: { type: String, required: true },
    qualification: { type: String, required: true },
    experience: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    salary: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);

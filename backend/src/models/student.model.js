const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, required: true },
    dob: { type: Date, required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    admissionDate: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);

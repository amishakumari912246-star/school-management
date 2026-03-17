const db = require('../utils/jsonDb');

const getSummary = (_req, res) => {
  const totalStudents = db.read('students').length;
  const totalTeachers = db.read('teachers').length;
  const fees = db.read('fees');
  const pendingFees = fees.reduce((sum, f) => sum + (Number(f.pendingAmount) || 0), 0);

  res.json({
    totalStudents,
    totalTeachers,
    totalClasses: 12,
    attendancePercent: 92,
    pendingFees
  });
};

module.exports = { getSummary };

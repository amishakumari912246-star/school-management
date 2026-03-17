const db = require('../utils/jsonDb');

const getAttendance = (_req, res) => {
  res.json(db.findAll('attendance'));
};

const createAttendance = (req, res) => {
  const row = db.create('attendance', req.body);
  res.status(201).json(row);
};

const updateAttendance = (req, res) => {
  const updated = db.updateById('attendance', req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Attendance record not found' });
  return res.json(updated);
};

const deleteAttendance = (req, res) => {
  const deleted = db.deleteById('attendance', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Attendance record not found' });
  return res.json({ message: 'Attendance deleted' });
};

module.exports = { getAttendance, createAttendance, updateAttendance, deleteAttendance };

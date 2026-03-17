const db = require('../utils/jsonDb');

const getStudents = (_req, res) => {
  res.json(db.findAll('students'));
};

const createStudent = (req, res) => {
  const student = db.create('students', req.body);
  res.status(201).json(student);
};

const updateStudent = (req, res) => {
  const updated = db.updateById('students', req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Student not found' });
  return res.json(updated);
};

const deleteStudent = (req, res) => {
  const deleted = db.deleteById('students', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Student not found' });
  return res.json({ message: 'Student deleted' });
};

module.exports = { getStudents, createStudent, updateStudent, deleteStudent };

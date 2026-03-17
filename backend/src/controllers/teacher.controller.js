const db = require('../utils/jsonDb');

const getTeachers = (_req, res) => {
  res.json(db.findAll('teachers'));
};

const createTeacher = (req, res) => {
  const teacher = db.create('teachers', req.body);
  res.status(201).json(teacher);
};

const updateTeacher = (req, res) => {
  const updated = db.updateById('teachers', req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Teacher not found' });
  return res.json(updated);
};

const deleteTeacher = (req, res) => {
  const deleted = db.deleteById('teachers', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Teacher not found' });
  return res.json({ message: 'Teacher deleted' });
};

module.exports = { getTeachers, createTeacher, updateTeacher, deleteTeacher };

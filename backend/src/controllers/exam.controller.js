const db = require('../utils/jsonDb');

const getExams = (_req, res) => {
  res.json(db.findAll('exams'));
};

const createExam = (req, res) => {
  const exam = db.create('exams', req.body);
  res.status(201).json(exam);
};

const updateExam = (req, res) => {
  const updated = db.updateById('exams', req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Exam not found' });
  return res.json(updated);
};

const deleteExam = (req, res) => {
  const deleted = db.deleteById('exams', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Exam not found' });
  return res.json({ message: 'Exam deleted' });
};

module.exports = { getExams, createExam, updateExam, deleteExam };

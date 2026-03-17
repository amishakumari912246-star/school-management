const db = require('../utils/jsonDb');

const getResults = (_req, res) => {
  res.json(db.findAll('results'));
};

const createResult = (req, res) => {
  const totalMarks = Number(req.body.totalMarks || 0);
  const marksObtained = Number(req.body.marksObtained || 0);
  const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
  const resultStatus = percentage >= 33 ? 'Pass' : 'Fail';
  const row = db.create('results', { ...req.body, percentage, resultStatus });
  res.status(201).json(row);
};

const updateResult = (req, res) => {
  const totalMarks = Number(req.body.totalMarks || 0);
  const marksObtained = Number(req.body.marksObtained || 0);
  const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 100) : 0;
  const resultStatus = percentage >= 33 ? 'Pass' : 'Fail';
  const updated = db.updateById('results', req.params.id, { ...req.body, percentage, resultStatus });
  if (!updated) return res.status(404).json({ message: 'Result not found' });
  return res.json(updated);
};

const deleteResult = (req, res) => {
  const deleted = db.deleteById('results', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Result not found' });
  return res.json({ message: 'Result deleted' });
};

module.exports = { getResults, createResult, updateResult, deleteResult };

const db = require('../utils/jsonDb');

const getAdmitCards = (_req, res) => {
  res.json(db.findAll('admitcards'));
};

const createAdmitCard = (req, res) => {
  const card = db.create('admitcards', req.body);
  res.status(201).json(card);
};

const updateAdmitCard = (req, res) => {
  const updated = db.updateById('admitcards', req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Admit card not found' });
  return res.json(updated);
};

const deleteAdmitCard = (req, res) => {
  const deleted = db.deleteById('admitcards', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Admit card not found' });
  return res.json({ message: 'Admit card deleted' });
};

module.exports = { getAdmitCards, createAdmitCard, updateAdmitCard, deleteAdmitCard };

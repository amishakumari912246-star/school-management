const db = require('../utils/jsonDb');

const getFees = (_req, res) => {
  res.json(db.findAll('fees'));
};

const createFee = (req, res) => {
  const fee = db.create('fees', req.body);
  res.status(201).json(fee);
};

const updateFee = (req, res) => {
  const updated = db.updateById('fees', req.params.id, req.body);
  if (!updated) return res.status(404).json({ message: 'Fee record not found' });
  return res.json(updated);
};

const deleteFee = (req, res) => {
  const deleted = db.deleteById('fees', req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Fee record not found' });
  return res.json({ message: 'Fee record deleted' });
};

module.exports = { getFees, createFee, updateFee, deleteFee };

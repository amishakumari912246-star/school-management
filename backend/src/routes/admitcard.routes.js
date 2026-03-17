const express = require('express');
const router = express.Router();
const {
  getAdmitCards,
  createAdmitCard,
  updateAdmitCard,
  deleteAdmitCard
} = require('../controllers/admitcard.controller');

router.get('/', getAdmitCards);
router.post('/', createAdmitCard);
router.put('/:id', updateAdmitCard);
router.delete('/:id', deleteAdmitCard);

module.exports = router;

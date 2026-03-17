const express = require('express');
const { getFees, createFee, updateFee, deleteFee } = require('../controllers/fee.controller');

const router = express.Router();

router.get('/', getFees);
router.post('/', createFee);
router.put('/:id', updateFee);
router.delete('/:id', deleteFee);

module.exports = router;

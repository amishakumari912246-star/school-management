const express = require('express');
const {
  getResults,
  createResult,
  updateResult,
  deleteResult
} = require('../controllers/result.controller');

const router = express.Router();

router.get('/', getResults);
router.post('/', createResult);
router.put('/:id', updateResult);
router.delete('/:id', deleteResult);

module.exports = router;

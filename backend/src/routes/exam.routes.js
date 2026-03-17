const express = require('express');
const { getExams, createExam, updateExam, deleteExam } = require('../controllers/exam.controller');

const router = express.Router();

router.get('/', getExams);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

module.exports = router;

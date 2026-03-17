const express = require('express');
const {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendance.controller');

const router = express.Router();

router.get('/', getAttendance);
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

module.exports = router;

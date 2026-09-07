const express = require('express');

const {
    checkIn,
    checkOut,
    getTodayAttendance,
    getAllAttendance,
} = require('../controllers/attendance.controller');

const router = express.Router();

router.post('/check-in', checkIn);

router.post('/check-out', checkOut);

router.get('/today/:employeeId', getTodayAttendance);

// HR - Get all attendance records
router.get('/all', getAllAttendance);

module.exports = router;
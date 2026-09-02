const express = require('express');

const {
    checkIn,
    checkOut,
    getTodayAttendance,
} = require('../controllers/attendance.controller');

const router = express.Router();

router.post('/check-in', checkIn);

router.post('/check-out', checkOut);

router.get('/today/:employeeId', getTodayAttendance);

module.exports = router;
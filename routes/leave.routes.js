const express = require('express');

const {
    applyLeave,
    getEmployeeLeaves,
} = require('../controllers/leave.controller');

const router = express.Router();

router.post('/apply', applyLeave);

router.get('/employee/:employeeId', getEmployeeLeaves);

module.exports = router;


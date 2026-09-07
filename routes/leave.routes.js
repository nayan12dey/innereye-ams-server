
const express = require('express');

const {
    applyLeave,
    getEmployeeLeaves,
    getAllLeaves,
    approveLeave,
    rejectLeave,
} = require('../controllers/leave.controller');

const router = express.Router();

router.post('/apply', applyLeave);

router.get('/employee/:employeeId', getEmployeeLeaves);

// HR Leave Management
router.put('/:leaveId/approve', approveLeave);

router.put('/:leaveId/reject', rejectLeave);

router.get('/all', getAllLeaves);

module.exports = router;


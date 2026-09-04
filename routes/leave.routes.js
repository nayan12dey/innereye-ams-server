const express = require('express');

const {
    applyLeave,
} = require('../controllers/leave.controller');

const router = express.Router();

router.post('/apply', applyLeave);

module.exports = router;
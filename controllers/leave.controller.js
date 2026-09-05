const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);

async function getDatabase() {
    await client.connect();
    return client.db('innereye');
}

// Apply for Leave
const applyLeave = async (req, res) => {
    try {
        const db = await getDatabase();

        const {
            employeeId,
            leaveType,
            startDate,
            endDate,
            reason,
        } = req.body;

        // Basic validation
        if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({
                success: false,
                message: 'All leave fields are required',
            });
        }

        // Date validation
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date',
            });
        }

        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be after end date',
            });
        }

        // Calculate total leave days
        const differenceInMs = end - start;

        const totalDays =
            Math.floor(differenceInMs / (1000 * 60 * 60 * 24)) + 1;

        // Check employee
        const employee = await db.collection('user').findOne({
            empId: employeeId,
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        // Calculate remaining leave
        const leaveQuota = employee.annualLeaveQuota || 18;
        const leaveUsed = employee.annualLeaveUsed || 0;
        const remainingLeave = leaveQuota - leaveUsed;

        if (totalDays > remainingLeave) {
            return res.status(400).json({
                success: false,
                message: `Insufficient leave balance. Remaining leave: ${remainingLeave} days`,
            });
        }

        // Create leave request
        const leaveRequest = {
            employeeId,
            leaveType,
            startDate,
            endDate,
            totalDays,
            reason,
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db
            .collection('leaves')
            .insertOne(leaveRequest);

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            leave: {
                id: result.insertedId,
                ...leaveRequest,
            },
        });

    } catch (error) {
        console.error('Apply leave error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to apply for leave',
        });
    }
};

// Get Employee Leave Requests
const getEmployeeLeaves = async (req, res) => {
    try {
        const db = await getDatabase();

        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required',
            });
        }

        const leaves = await db
            .collection('leaves')
            .find({ employeeId })
            .sort({ createdAt: -1 })
            .toArray();

        res.status(200).json({
            success: true,
            leaves,
        });

    } catch (error) {
        console.error('Get employee leaves error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave requests',
        });
    }
};

module.exports = {
    applyLeave,
    getEmployeeLeaves,
};
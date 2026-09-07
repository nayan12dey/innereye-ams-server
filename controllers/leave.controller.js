
const { MongoClient, ObjectId } = require('mongodb');

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
                message: `Insufficient leave balance.Remaining leave: ${remainingLeave} days`,
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


// Get All Leave Requests for HR
const getAllLeaves = async (req, res) => {
    try {
        const db = await getDatabase();

        const leaves = await db
            .collection('leaves')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const leavesWithEmployee = await Promise.all(
            leaves.map(async (leave) => {
                const employee = await db.collection('user').findOne({
                    empId: leave.employeeId,
                });

                return {
                    ...leave,
                    name: employee?.name || employee?.fullName || 'Unknown Employee',
                };
            })
        );

        res.status(200).json({
            success: true,
            leaves: leavesWithEmployee,
        });

    } catch (error) {
        console.error('Get all leaves error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave requests',
        });
    }
};


// Approve Leave + Deduct Leave Balance
const approveLeave = async (req, res) => {
    try {
        const db = await getDatabase();

        const { leaveId } = req.params;

        if (!leaveId || !ObjectId.isValid(leaveId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave ID',
            });
        }

        // Find leave request
        const leave = await db.collection('leaves').findOne({
            _id: new ObjectId(leaveId),
        });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        // Prevent duplicate deduction
        if (leave.status === 'Approved') {
            return res.status(400).json({
                success: false,
                message: 'Leave is already approved',
            });
        }

        if (leave.status === 'Rejected') {
            return res.status(400).json({
                success: false,
                message: 'Rejected leave cannot be approved',
            });
        }

        // Find employee
        const employee = await db.collection('user').findOne({
            empId: leave.employeeId,
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found',
            });
        }

        const leaveQuota = employee.annualLeaveQuota || 18;
        const leaveUsed = employee.annualLeaveUsed || 0;
        const totalDays = leave.totalDays;

        const remainingLeave = leaveQuota - leaveUsed;

        // Double-check leave balance before deduction
        if (totalDays > remainingLeave) {
            return res.status(400).json({
                success: false,
                message: `Insufficient leave balance.Remaining leave: ${remainingLeave} days`,
            });
        }

        // Update employee leave balance
        await db.collection('user').updateOne(
            { empId: leave.employeeId },
            {
                $set: {
                    annualLeaveUsed: leaveUsed + totalDays,
                },
            }
        );

        // Update leave request status
        await db.collection('leaves').updateOne(
            { _id: new ObjectId(leaveId) },
            {
                $set: {
                    status: 'Approved',
                    updatedAt: new Date(),
                },
            }
        );

        const newRemainingLeave = leaveQuota - (leaveUsed + totalDays);

        res.status(200).json({
            success: true,
            message: `Leave approved and ${totalDays} day(s) deducted successfully`,
            leave: {
                ...leave,
                status: 'Approved',
            },
            leaveBalance: {
                quota: leaveQuota,
                used: leaveUsed + totalDays,
                remaining: newRemainingLeave,
            },
        });

    } catch (error) {
        console.error('Approve leave error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to approve leave',
        });
    }
};


// Reject Leave
const rejectLeave = async (req, res) => {
    try {
        const db = await getDatabase();

        const { leaveId } = req.params;

        if (!leaveId || !ObjectId.isValid(leaveId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid leave ID',
            });
        }

        const leave = await db.collection('leaves').findOne({
            _id: new ObjectId(leaveId),
        });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found',
            });
        }

        // Prevent changing an already processed request
        if (leave.status !== 'Pending') {
            return res.status(400).json({
                success: false,
                message: `Leave is already ${leave.status} `,
            });
        }

        await db.collection('leaves').updateOne(
            { _id: new ObjectId(leaveId) },
            {
                $set: {
                    status: 'Rejected',
                    updatedAt: new Date(),
                },
            }
        );

        res.status(200).json({
            success: true,
            message: 'Leave rejected successfully',
        });

    } catch (error) {
        console.error('Reject leave error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to reject leave',
        });
    }
};


module.exports = {
    applyLeave,
    getEmployeeLeaves,
    getAllLeaves,
    approveLeave,
    rejectLeave,
};




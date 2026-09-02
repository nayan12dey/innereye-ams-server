const { MongoClient } = require('mongodb');
const calculateWorkingHours = require('../utils/workingHours');

const client = new MongoClient(process.env.MONGODB_URI);

async function getDatabase() {
    await client.connect();
    return client.db('innereye');
}


// Check-In
const checkIn = async (req, res) => {
    try {
        const db = await getDatabase();

        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required',
            });
        }

        const today = new Date().toISOString().split('T')[0];

        // Check whether employee already checked in today
        const existingAttendance = await db.collection('attendance').findOne({
            employeeId,
            date: today,
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'You have already checked in today',
            });
        }

        const attendance = {
            employeeId,
            date: today,
            checkIn: new Date(),
            checkOut: null,
            workingHours: 0,
            status: 'Present',
            createdAt: new Date(),
        };

        const result = await db
            .collection('attendance')
            .insertOne(attendance);

        res.status(201).json({
            success: true,
            message: 'Check-in successful',
            attendance: {
                id: result.insertedId,
                ...attendance,
            },
        });

    } catch (error) {
        console.error('Check-in error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to check in',
        });
    }
};


// Check-Out
const checkOut = async (req, res) => {
    try {
        const db = await getDatabase();

        const { employeeId } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required',
            });
        }

        const today = new Date().toISOString().split('T')[0];

        const attendance = await db.collection('attendance').findOne({
            employeeId,
            date: today,
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'No check-in record found for today',
            });
        }

        if (attendance.checkOut) {
            return res.status(400).json({
                success: false,
                message: 'You have already checked out today',
            });
        }

        const checkOutTime = new Date();

        const workingHours = calculateWorkingHours(
            attendance.checkIn,
            checkOutTime
        );

        await db.collection('attendance').updateOne(
            {
                _id: attendance._id,
            },
            {
                $set: {
                    checkOut: checkOutTime,
                    workingHours,
                    status: 'Checked Out',
                    updatedAt: new Date(),
                },
            }
        );

        res.status(200).json({
            success: true,
            message: 'Check-out successful',
            workingHours,
        });

    } catch (error) {
        console.error('Check-out error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to check out',
        });
    }
};


// Get today's attendance
const getTodayAttendance = async (req, res) => {
    try {
        const db = await getDatabase();

        const { employeeId } = req.params;

        const today = new Date().toISOString().split('T')[0];

        const attendance = await db.collection('attendance').findOne({
            employeeId,
            date: today,
        });

        res.status(200).json({
            success: true,
            attendance: attendance || null,
        });

    } catch (error) {
        console.error('Get attendance error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance',
        });
    }
};


module.exports = {
    checkIn,
    checkOut,
    getTodayAttendance,
};



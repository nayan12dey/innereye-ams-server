const express = require('express');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const attendanceRoutes = require('./routes/attendance.routes');

// Middleware
app.use(express.json());

app.use('/api/attendance', attendanceRoutes);

// MongoDB connection
async function connectDB() {
    try {
        await client.connect();

        const db = client.db('innereye');

        await db.command({ ping: 1 });

        console.log('MongoDB connected successfully!');

        return db;
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}

// Test route
app.get('/', (req, res) => {
    res.send('InnerEye AMS Server running....');
});

// Start server
async function startServer() {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();


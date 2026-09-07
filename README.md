# InnerEye AMS - Backend API 🕒

InnerEye Attendance Management System (AMS) Server is a RESTful API service built with **Node.js**, **Express 5**, and **MongoDB**. It powers employee attendance tracking, working hour calculations, and automated leave request workflows with quota management.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [API Reference](#-api-reference)
  - [Health Check](#health-check)
  - [Attendance Routes](#attendance-routes)
  - [Leave Management Routes](#leave-management-routes)
- [Database Collections & Schemas](#-database-collections--schemas)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Features

- **Daily Attendance Tracking**:
  - Check-in validation to prevent duplicate daily check-ins.
  - Check-out functionality with automated working hours calculation (formatted to 2 decimal places).
  - Check current day attendance status for an individual employee.
  - HR dashboard access to view aggregated attendance logs joined with employee information.
- **Leave Request Management**:
  - Submit leave requests with comprehensive start/end date validation.
  - Automatic calculation of total leave days requested.
  - Leave quota verification against remaining balance (default 18 days annual quota).
  - Employee view of personal leave history and current statuses (`Pending`, `Approved`, `Rejected`).
  - HR approval endpoint that transitions state and automatically deducts approved days from the employee's annual leave balance.
  - HR rejection endpoint with safeguards preventing modification of already-processed requests.
- **Serverless Ready**:
  - Out-of-the-box configuration for [Vercel](https://vercel.com/) deployment via `@vercel/node`.

---

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (CommonJS)
- **Framework**: [Express.js 5](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (using native `mongodb` driver)
- **Security & Utilities**:
  - `cors` - Cross-Origin Resource Sharing configuration
  - `dotenv` - Environment variable management
  - `better-auth`, `jsonwebtoken`, `bcryptjs` - Authentication utilities

---

## 📂 Project Architecture

```plaintext
innereye-ams-server/
├── config/                  # Configuration modules
├── controllers/             # Request handling and business logic
│   ├── attendance.controller.js # Check-in, check-out, working hours, logs
│   └── leave.controller.js      # Leave requests, balance validation, approvals
├── lib/                     # External library configs (e.g., Better-Auth)
│   └── auth.js
├── models/                  # Data models and schemas
├── routes/                  # Express route definitions
│   ├── attendance.routes.js # /api/attendance routes
│   └── leave.routes.js      # /api/leaves routes
├── utils/                   # Helper functions
│   └── workingHours.js      # Difference calculator for check-in/out
├── .env                     # Local environment variables (do not commit)
├── .gitignore               # Git ignored patterns
├── index.js                 # Server entry point & DB connection setup
├── package.json             # Dependencies and scripts
├── vercel.json              # Vercel deployment configuration
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: A running MongoDB instance locally or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster.

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd innereye-ams-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?appName=Cluster0
CLIENT_URL=http://localhost:3000
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port number the Express server listens on | `5000` |
| `MONGODB_URI` | MongoDB Atlas or local connection string | _Required_ |
| `CLIENT_URL` | Frontend origin for CORS policy | `http://localhost:3000` |

### Running the Server

- **Start server**:
  ```bash
  node index.js
  ```

- **Start with nodemon** (if installed globally or via npx):
  ```bash
  npx nodemon index.js
  ```

When running, the server output will indicate:
```plaintext
MongoDB connected successfully!
Server running on port 5000
```

---

## 📡 API Reference

**Base URL**: `http://localhost:5000`

### Health Check

#### `GET /`
Returns the status of the server.
- **Response**: `200 OK`
  ```text
  InnerEye AMS Server running....
  ```

---

### Attendance Routes

Base path: `/api/attendance`

#### 1. Check-In
Records employee check-in for the current day. Prevents duplicate check-ins on the same calendar day.

- **Method**: `POST`
- **Endpoint**: `/api/attendance/check-in`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "employeeId": "EMP-1001"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "message": "Check-in successful",
      "attendance": {
        "id": "66dab6c8914ef1234567890a",
        "employeeId": "EMP-1001",
        "date": "2026-09-07",
        "checkIn": "2026-09-07T09:00:00.000Z",
        "checkOut": null,
        "workingHours": 0,
        "status": "Present",
        "createdAt": "2026-09-07T09:00:00.000Z"
      }
    }
    ```
  - `400 Bad Request`: Already checked in or missing `employeeId`.

#### 2. Check-Out
Records employee check-out and computes total working hours.

- **Method**: `POST`
- **Endpoint**: `/api/attendance/check-out`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "employeeId": "EMP-1001"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Check-out successful",
      "workingHours": 8.5
    }
    ```
  - `404 Not Found`: No check-in record found for today.
  - `400 Bad Request`: Already checked out today.

#### 3. Get Today's Attendance
Retrieves the logged-in employee's attendance status for today.

- **Method**: `GET`
- **Endpoint**: `/api/attendance/today/:employeeId`
- **Response**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "attendance": {
        "_id": "66dab6c8914ef1234567890a",
        "employeeId": "EMP-1001",
        "date": "2026-09-07",
        "checkIn": "2026-09-07T09:00:00.000Z",
        "checkOut": "2026-09-07T17:30:00.000Z",
        "workingHours": 8.5,
        "status": "Checked Out"
      }
    }
    ```

#### 4. Get All Attendance Records (HR)
Fetches all attendance entries sorted newest to oldest, enriched with employee names from the `user` collection.

- **Method**: `GET`
- **Endpoint**: `/api/attendance/all`
- **Response**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "attendance": [
        {
          "_id": "66dab6c8914ef1234567890a",
          "employeeId": "EMP-1001",
          "name": "Jane Doe",
          "date": "2026-09-07",
          "checkIn": "2026-09-07T09:00:00.000Z",
          "checkOut": "2026-09-07T17:30:00.000Z",
          "workingHours": 8.5,
          "status": "Checked Out"
        }
      ]
    }
    ```

---

### Leave Management Routes

Base path: `/api/leaves`

#### 1. Apply for Leave
Submits a leave request. Validates dates and verifies that the requested duration does not exceed the employee's available leave balance.

- **Method**: `POST`
- **Endpoint**: `/api/leaves/apply`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "employeeId": "EMP-1001",
    "leaveType": "Sick Leave",
    "startDate": "2026-09-10",
    "endDate": "2026-09-12",
    "reason": "Doctor appointment and recovery"
  }
  ```
- **Responses**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "message": "Leave request submitted successfully",
      "leave": {
        "id": "66dab7a1914ef1234567890b",
        "employeeId": "EMP-1001",
        "leaveType": "Sick Leave",
        "startDate": "2026-09-10",
        "endDate": "2026-09-12",
        "totalDays": 3,
        "reason": "Doctor appointment and recovery",
        "status": "Pending"
      }
    }
    ```
  - `400 Bad Request`: Missing fields, invalid dates, start date after end date, or insufficient leave balance.
  - `404 Not Found`: Employee not found in `user` collection.

#### 2. Get Employee Leaves
Fetches all leave requests submitted by a specific employee.

- **Method**: `GET`
- **Endpoint**: `/api/leaves/employee/:employeeId`
- **Response**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "leaves": [
        {
          "_id": "66dab7a1914ef1234567890b",
          "employeeId": "EMP-1001",
          "leaveType": "Sick Leave",
          "startDate": "2026-09-10",
          "endDate": "2026-09-12",
          "totalDays": 3,
          "reason": "Doctor appointment and recovery",
          "status": "Pending",
          "createdAt": "2026-09-07T10:00:00.000Z"
        }
      ]
    }
    ```

#### 3. Get All Leaves (HR)
Fetches all leave requests across the company, populated with employee names.

- **Method**: `GET`
- **Endpoint**: `/api/leaves/all`
- **Response**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "leaves": [
        {
          "_id": "66dab7a1914ef1234567890b",
          "employeeId": "EMP-1001",
          "name": "Jane Doe",
          "leaveType": "Sick Leave",
          "startDate": "2026-09-10",
          "endDate": "2026-09-12",
          "totalDays": 3,
          "status": "Pending"
        }
      ]
    }
    ```

#### 4. Approve Leave (HR)
Approves a pending leave request and automatically deducts the days from the employee's `annualLeaveUsed`.

- **Method**: `PUT`
- **Endpoint**: `/api/leaves/:leaveId/approve`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Leave approved and 3 day(s) deducted successfully",
      "leave": {
        "_id": "66dab7a1914ef1234567890b",
        "employeeId": "EMP-1001",
        "status": "Approved"
      },
      "leaveBalance": {
        "quota": 18,
        "used": 5,
        "remaining": 13
      }
    }
    ```
  - `400 Bad Request`: Leave is already approved, rejected, or insufficient leave balance.
  - `404 Not Found`: Leave request or employee not found.

#### 5. Reject Leave (HR)
Rejects a pending leave request.

- **Method**: `PUT`
- **Endpoint**: `/api/leaves/:leaveId/reject`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Leave rejected successfully"
    }
    ```
  - `400 Bad Request`: Leave request is not in `Pending` status.
  - `404 Not Found`: Leave request not found.

---

## 🗄 Database Collections & Schemas

The application connects to the `innereye` database in MongoDB and operates across three primary collections:

### 1. `attendance`
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique record ID |
| `employeeId` | `String` | Unique employee identifier |
| `date` | `String` | Format: `YYYY-MM-DD` |
| `checkIn` | `Date` | Timestamp of check-in |
| `checkOut` | `Date \| null` | Timestamp of check-out |
| `workingHours`| `Number` | Total hours worked |
| `status` | `String` | `'Present'` \| `'Checked Out'` |
| `createdAt` | `Date` | Record creation timestamp |
| `updatedAt` | `Date` | Record update timestamp |

### 2. `leaves`
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Unique leave request ID |
| `employeeId` | `String` | Unique employee identifier |
| `leaveType` | `String` | Type of leave (e.g., Casual, Sick) |
| `startDate` | `String` | Start date string (`YYYY-MM-DD`) |
| `endDate` | `String` | End date string (`YYYY-MM-DD`) |
| `totalDays` | `Number` | Calculated duration in days |
| `reason` | `String` | Reason for leave |
| `status` | `String` | `'Pending'` \| `'Approved'` \| `'Rejected'` |
| `createdAt` | `Date` | Timestamp of request submission |
| `updatedAt` | `Date` | Timestamp of last status change |

### 3. `user` (Referenced)
| Field | Type | Description |
| :--- | :--- | :--- |
| `empId` | `String` | Employee ID matching `employeeId` |
| `name` / `fullName` | `String` | Employee full name |
| `annualLeaveQuota` | `Number` | Total allowed leave days per year (default: 18) |
| `annualLeaveUsed` | `Number` | Total days already approved & used (default: 0) |

---

## ☁️ Deployment

### Vercel Deployment

The project is pre-configured for Vercel using `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js",
      "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    }
  ]
}
```

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```
3. Set your environment variables (`MONGODB_URI`, `CLIENT_URL`, `PORT`) in the Vercel Dashboard under **Settings > Environment Variables**.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).



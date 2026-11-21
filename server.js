// server.js
// --------------------------------------------------
// Application Entry Point
// --------------------------------------------------
// This is the main file that starts our backend.
// It does 4 things in order:
//   1. Loads environment variables (.env)
//   2. Connects to MongoDB
//   3. Sets up middleware (CORS, JSON parsing)
//   4. Mounts API routes and starts the server
// --------------------------------------------------

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Step 1: Load environment variables from .env file
dotenv.config();

// Import route modules
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const userRoutes = require('./routes/userRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');

// Create the Express application
const app = express();

// Step 2: Global Middleware
app.use(cors());
app.use(express.json());

// Step 3: Test Route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Campus Management System API is running!',
  });
});

// Step 4: Mount API Routes
// Every request to /api/auth/...        → handled by authRoutes
// Every request to /api/attendance/...   → handled by attendanceRoutes
// Every request to /api/users/...        → handled by userRoutes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);

app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);

// ----- Routes for other team members (not yet implemented) -----
// app.use('/api/announcements', announcementRoutes);
// app.use('/api/complaints', complaintRoutes);

// Step 5: Read the port from .env (or default to 5000)
const PORT = process.env.PORT || 5000;

// Step 6: Connect to MongoDB, then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

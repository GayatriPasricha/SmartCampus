// server.js
// --------------------------------------------------
// Application Entry Point
// --------------------------------------------------
// Initializes the Express application, loads
// environment variables, connects to MongoDB,
// registers all route modules, applies global
// middleware (CORS, JSON parsing, error handling),
// and starts the HTTP server.
// --------------------------------------------------

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import route modules
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const userRoutes = require('./routes/userRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

// Import error-handling middleware
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();

// --- Global Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
// TODO: Mount routes, e.g.:
// app.use('/api/auth', authRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/assignments', assignmentRoutes);
// app.use('/api/announcements', announcementRoutes);
// app.use('/api/complaints', complaintRoutes);

// --- Error Handling ---
// TODO: app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

// TODO: Connect to DB then start server
// connectDB().then(() => {
//   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// });

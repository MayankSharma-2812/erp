// Loaded config
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const { rateLimit } = require('express-rate-limit');

const config = require('./config/env');
const connectDB = require('./config/db');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const studentRoutes = require('./routes/student.routes');
const admissionsRoutes = require('./routes/admissions.routes');
const academicsRoutes = require('./routes/academics.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const examsRoutes = require('./routes/exams.routes');
const financeRoutes = require('./routes/finance.routes');
const libraryRoutes = require('./routes/library.routes');
const transportRoutes = require('./routes/transport.routes');
const healthRoutes = require('./routes/health.routes');
const reportsRoutes = require('./routes/reports.routes');
const hostelRoutes = require('./routes/hostel.routes');
const hrRoutes = require('./routes/hr.routes');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use(limiter);

// Body Parsers
app.use(express.json());
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/admissions', admissionsRoutes);
app.use('/api/v1/academics', academicsRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/exams', examsRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/library', libraryRoutes);
app.use('/api/v1/transport', transportRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/hostel', hostelRoutes);
app.use('/api/v1/hr', hrRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = config.PORT;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

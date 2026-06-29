const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://127.0.0.1:3000', 'null'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads Directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Base Route
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Real-Time Chat API',
    data: {}
  });
});

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const friendRoutes = require('./routes/friend');
const messageRoutes = require('./routes/message');
const uploadRoutes = require('./routes/upload');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/uploads', uploadRoutes);

// Error Handler Middleware (must be after routes)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;

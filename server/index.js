import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import fs from 'fs';
import https from 'https';
import compression from 'compression';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import customerRoutes from './routes/customers.js';
import jobRoutes from './routes/jobs.js';
import quotationRoutes from './routes/quotations.js';
import approvalRoutes from './routes/approvals.js';
import invoiceRoutes from './routes/invoices.js';
import dashboardRoutes from './routes/dashboard.js';
import inspectionRoutes from './routes/Inspections.js';
import deliveriesRoutes from './routes/deliveries.js'; // Ensure this import is present
import reportRoutes from './routes/reports.js'; // Import the new reports route
import jobRequestRoutes from './routes/jobrequest.js';
import certificateRouter from './routes/certificates.js';
import serviceFormRoutes from './routes/Serviceform.js';
import taskRoutes from './routes/task.js';

// Initialize environment variables
dotenv.config({ path: process.env.ENV_FILE || '.env' });

console.log('Production RATE_LIMIT_MAX:', process.env.RATE_LIMIT_MAX); // Add this line

const app = express();
const port = process.env.PORT || 8040; // Using your Etisalat-approved port
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================
// Enhanced Security Middleware
// =============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", process.env.FRONTEND_URL.split(',')],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'", process.env.FRONTEND_URL.split(','), process.env.API_BASE_URL],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

// Rate Limiting (more strict in production)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // Use env var or default to 15 mins
  max: process.env.NODE_ENV === 'production'
    ? parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // Use env var or default to 100 in production
    : 10000, // Keep a high limit for development
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// =============================================
// Logging Configuration
// =============================================
// Create write stream for logging (append mode)
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: process.env.NODE_ENV === 'production' ? accessLogStream : process.stdout
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.ip} ${req.method} ${req.url}`);
  next();
});

// =============================================
// Body Parsing and Static Content
// =============================================
app.use(express.json({ limit: '10mb' })); // Increased limit for JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Increased limit for URL-encoded data

// =============================================
// API Routes
// =============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes); // Fixed typo from 'customers'
app.use('/api/jobs', jobRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jobs/inspections', inspectionRoutes);
app.use('/api', reportRoutes); // Mount the new reports route
app.use('/public', express.static(path.join(process.cwd(), 'public')));
app.use('/api/jobs', deliveriesRoutes); // Corrected line to match frontend PUT request path
app.use('/api/jobs-requests', jobRequestRoutes);
app.use('/api/certificates', certificateRouter);
app.use('/api/service-reports', serviceFormRoutes); // Add this line for your new service reports routes
app.use('/api/service-tasks', taskRoutes);

// =============================================
// Health Checks and Monitoring
// =============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve static files from /public folder
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'operational',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  });
});

// =============================================
// Frontend Serving Configuration
// =============================================
const distPath = path.join(__dirname, '..', 'dist');

if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Running in production mode');

  // Serve static files with cache control
  app.use(express.static(distPath, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // SPA fallback route
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'), {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  });
} else {
  console.log('🔧 Running in development mode');
  app.get('/', (req, res) => {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  });
}

// =============================================
// Error Handling
// =============================================
// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong!'
    : err.message;

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// =============================================
// Server Initialization
// =============================================
let server;

if (process.env.HTTPS_ENABLED === 'true') {
  const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/private.key'),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/certificate.crt'),
    ca: fs.readFileSync(process.env.SSL_CA_PATH || './ssl/ca_bundle.crt')
  };

  server = https.createServer(sslOptions, app).listen(port, '0.0.0.0', () => {
    console.log(`🔒 HTTPS Server running on port ${port}`);
  });
} else {
  server = app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 HTTP Server running on port ${port}`);
  });
}

// =============================================
// Graceful Shutdown
// =============================================
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  try {
    await new Promise((resolve) => server.close(resolve));
    console.log('Server closed');

    // Close database connections or other resources here

    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  shutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('UNCaught_EXCEPTION');
});

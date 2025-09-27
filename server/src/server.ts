import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { config } from './config/environment';
import errorHandler from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import jobRoutes from './routes/jobs';
import aiRoutes from './routes/ai';

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow * 60 * 1000,
  max: config.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Health check route
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Handle Backend API is running with Supabase!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'Supabase Connected'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.all('*', (_req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${_req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`🚀 Handle Backend running on port ${PORT}`);
  console.log(`📱 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS Origin: ${config.clientUrl}`);
  console.log(`🗄️  Database: Supabase`);
  console.log(`📚 API Docs: http://localhost:${PORT}/`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, _promise) => {
  console.log(`❌ Error: ${err.message}`);
  process.exit(1);
});
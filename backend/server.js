import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { seedInitialDatabaseData } from './src/config/seed.js';
import { checkSupabaseConnection } from './src/config/supabase.js';
import { apiRateLimiter } from './src/middleware/rateLimiter.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { logger } from './src/utils/logger.js';

// Route Imports
import authRoutes from './src/routes/auth.routes.js';
import scanRoutes from './src/routes/scan.routes.js';
import auditRoutes from './src/routes/audit.routes.js';
import policyRoutes from './src/routes/policy.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';

const app = express();

app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Dynamic CORS: local, vercel, production
const allowedOrigins = config.clientUrls;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1');

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error(`CORS origin not permitted: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-trace-id'],
  })
);

// Logging - NEVER log prompt bodies!
if (config.nodeEnv !== 'test') {
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms', {
      skip: (req) => req.url.includes('/health'),
    })
  );
}

// Body Parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Apply Gateway Global Rate Limiting
app.use('/api/', apiRateLimiter);

// Health Check
app.get('/health', async (req, res) => {
  const supabaseStatus = await checkSupabaseConnection();
  res.status(200).json({
    status: 'healthy',
    service: 'TrustGuard AI — Secure AI Prompt Gateway',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    geminiConfigured: !!config.geminiApiKey,
    supabase: supabaseStatus,
  });
});

app.get('/api/health', async (req, res) => {
  const supabaseStatus = await checkSupabaseConnection();
  res.status(200).json({
    status: 'healthy',
    service: 'TrustGuard AI Gateway API',
    version: '1.2.0',
    timestamp: new Date().toISOString(),
    supabase: supabaseStatus,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central Error Handler
app.use(errorHandler);

// Boot Server
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialDatabaseData();

    const server = app.listen(config.port, () => {
      logger.info(`🛡️  TrustGuard AI Gateway listening on port ${config.port} [${config.nodeEnv}]`);
      logger.info(`🔒 Zero-Leak Boundary: Only sanitized [REDACTED_...] prompts are forwarded to Gemini`);
      logger.info(`🌐 CORS Enabled: ${allowedOrigins.join(', ')} + *.vercel.app`);
    });

    const shutdown = async () => {
      logger.info('Gracefully terminating TrustGuard Gateway server...');
      server.close(() => {
        logger.info('Gateway HTTP server terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start TrustGuard Gateway server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

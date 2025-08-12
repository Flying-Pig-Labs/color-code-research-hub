import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { monitoringRouter } from './api/monitoring-api';
import { errorHandler } from './middleware/error-handler';
import { logger } from './utils/logger';
import { initializeDatabase } from './services/database';
import { ClaudeFlowMonitor } from './services/claude-flow-monitor';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.MONITORING_PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.CORS_ORIGIN || '*'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: process.env.MAX_PAYLOAD_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_PAYLOAD_SIZE || '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API routes
app.use('/api', monitoringRouter);

// Error handling
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Initialize Claude Flow monitor
    const monitor = new ClaudeFlowMonitor({
      host: process.env.CLAUDE_FLOW_HOST || 'localhost',
      port: parseInt(process.env.CLAUDE_FLOW_PORT || '8080'),
      apiKey: process.env.CLAUDE_FLOW_API_KEY,
    });
    
    await monitor.connect();
    logger.info('Connected to Claude Flow');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Monitoring API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`CORS origin: ${process.env.CORS_ORIGIN || '*'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await monitor.disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
/**
 * Monitored Backend
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';

import config from './config/index.js';
import { cacheService } from './services/cache.service.js';
import { aggregationService } from './services/aggregation.service.js';
import { wsHandler } from './services/websocket.service.js';
import apiRoutes from './api/routes.js';

const app = express();
const server = createServer(app);

// ===========================================
// MIDDLEWARE
// ===========================================

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(config.cors));
app.use(compression());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health') {
      console.log(`[HTTP] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// ===========================================
// ROUTES
// ===========================================

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'Monitored API',
    version: '1.0.0',
    endpoints: {
      feed: '/api/feed',
      news: '/api/news',
      tweets: '/api/tweets',
      reddit: '/api/reddit',
      rss: '/api/rss',
      stocks: '/api/stocks',
      search: '/api/search',
      health: '/health',
    },
    websocket: '/ws',
  });
});

app.get('/health', async (req, res) => {
  const redisHealth = await cacheService.health();
  const isHealthy = redisHealth.status === 'healthy';
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: redisHealth,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.isDev ? err.message : undefined,
  });
});

// ===========================================
// BACKGROUND REFRESH
// ===========================================

let refreshInterval = null;

function startBackgroundRefresh() {
  // Initial fetch
  console.log('[Worker] Starting initial content fetch...');
  aggregationService.getCombinedFeed({ refresh: true }).catch(console.error);

  // Periodic refresh
  refreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing content...');
    aggregationService.getCombinedFeed({ refresh: true }).catch(console.error);
  }, config.polling.news);

  console.log(`[Worker] Background refresh every ${config.polling.news / 1000}s`);
}

// ===========================================
// STARTUP
// ===========================================

async function start() {
  console.log('===========================================');
  console.log('  Monitored API - Starting...');
  console.log('===========================================');

  // Connect to Redis
  console.log('[Startup] Connecting to Redis...');
  const redisConnected = await cacheService.connect();
  if (!redisConnected) {
    console.warn('[Startup] Redis not connected - caching disabled');
  }

  // Initialize WebSocket
  console.log('[Startup] Initializing WebSocket...');
  wsHandler.initialize(server);

  // Start background content refresh
  startBackgroundRefresh();

  // Start HTTP server
  server.listen(config.port, () => {
    console.log('===========================================');
    console.log(`  Server running on port ${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  API: http://localhost:${config.port}/api`);
    console.log(`  Feed: http://localhost:${config.port}/api/feed`);
    console.log(`  WebSocket: ws://localhost:${config.port}/ws`);
    console.log('===========================================');
  });
}

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

async function shutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}...`);

  server.close(() => console.log('[Shutdown] HTTP server closed'));
  
  if (refreshInterval) clearInterval(refreshInterval);
  wsHandler.shutdown();
  await cacheService.disconnect();

  console.log('[Shutdown] Complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  console.error('[Fatal]', error);
  process.exit(1);
});

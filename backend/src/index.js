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
import { conflictService } from './services/conflict.service.js';
import { tariffService } from './services/tariff.service.js';
import { worldBankService, PRELOAD_COUNTRIES } from './services/worldbank.service.js';
import { wikidataService } from './services/wikidata.service.js';
import { ucdpService } from './services/ucdp.service.js';
import { wsHandler } from './services/websocket.service.js';
import { electionLiveService } from './services/electionLive.service.js';
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
      polymarket: '/api/polymarket',
      conflict: '/api/conflict',
      tariffs: '/api/tariffs',
      economic: '/api/economic/:cca2',
      leaders: '/api/leaders',
      ucdp: '/api/ucdp/events',
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
let conflictRefreshInterval = null;
let tariffRefreshInterval = null;
let leadersRefreshInterval = null;
let economicRefreshInterval = null;
let ucdpRefreshInterval = null;
let electionRefreshInterval = null;

function startBackgroundRefresh() {
  // Initial fetch
  console.log('[Worker] Starting initial content fetch...');
  aggregationService.getCombinedFeed({ refresh: true }).catch(console.error);

  // Initial conflict data fetch
  console.log('[Worker] Starting initial conflict data fetch...');
  conflictService.getLiveData().catch(console.error);

  // Initial tariff data fetch
  console.log('[Worker] Starting initial tariff data fetch...');
  tariffService.getLiveData().catch(console.error);

  // Initial world leaders fetch (Wikidata)
  console.log('[Worker] Starting initial world leaders fetch...');
  wikidataService.getWorldLeaders().catch(console.error);

  // Initial UCDP conflict events fetch
  console.log('[Worker] Starting initial UCDP conflict events fetch...');
  ucdpService.getActiveConflicts().catch(console.error);

  // Pre-warm World Bank economic data for major countries (delayed to avoid startup contention)
  setTimeout(() => {
    console.log('[Worker] Pre-warming World Bank economic data...');
    worldBankService.preloadCountries(PRELOAD_COUNTRIES).catch(console.error);
  }, 10000);

  // Periodic refresh — news content
  refreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing content...');
    aggregationService.getCombinedFeed({ refresh: true }).catch(console.error);
  }, config.polling.news);

  // Periodic refresh — conflict data (every 30 min)
  const CONFLICT_POLL_MS = 30 * 60 * 1000;
  conflictRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing conflict data...');
    conflictService.getLiveData().catch(console.error);
  }, CONFLICT_POLL_MS);

  // Periodic refresh — tariff data (every 15 min)
  const TARIFF_POLL_MS = 15 * 60 * 1000;
  tariffRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing tariff data...');
    tariffService.getLiveData().catch(console.error);
  }, TARIFF_POLL_MS);

  // Periodic refresh — world leaders (every 24 hours)
  const LEADERS_POLL_MS = 24 * 60 * 60 * 1000;
  leadersRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing world leaders data...');
    wikidataService.getWorldLeaders().catch(console.error);
  }, LEADERS_POLL_MS);

  // Periodic refresh — World Bank economic data (every 24 hours)
  const ECONOMIC_POLL_MS = 24 * 60 * 60 * 1000;
  economicRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing World Bank economic data...');
    worldBankService.preloadCountries(PRELOAD_COUNTRIES).catch(console.error);
  }, ECONOMIC_POLL_MS);

  // Periodic refresh — UCDP conflict events (every 24 hours)
  const UCDP_POLL_MS = 24 * 60 * 60 * 1000;
  ucdpRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing UCDP conflict events...');
    ucdpService.getActiveConflicts().catch(console.error);
  }, UCDP_POLL_MS);

  // Initial election live data fetch (delayed to let market services warm up)
  setTimeout(() => {
    console.log('[Worker] Starting initial election live data fetch...');
    electionLiveService.getLiveData().catch(console.error);
  }, 15000);

  // Periodic refresh — election live data (every 15 min)
  const ELECTION_POLL_MS = 15 * 60 * 1000;
  electionRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing election live data...');
    electionLiveService.getLiveData().catch(console.error);
  }, ELECTION_POLL_MS);

  console.log(`[Worker] Background refresh every ${config.polling.news / 1000}s`);
  console.log(`[Worker] Conflict data refresh every ${CONFLICT_POLL_MS / 1000}s`);
  console.log(`[Worker] Tariff data refresh every ${TARIFF_POLL_MS / 1000}s`);
  console.log(`[Worker] World leaders refresh every ${LEADERS_POLL_MS / 1000}s`);
  console.log(`[Worker] Economic data refresh every ${ECONOMIC_POLL_MS / 1000}s`);
  console.log(`[Worker] UCDP conflict data refresh every ${UCDP_POLL_MS / 1000}s`);
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
  if (conflictRefreshInterval) clearInterval(conflictRefreshInterval);
  if (tariffRefreshInterval) clearInterval(tariffRefreshInterval);
  if (leadersRefreshInterval) clearInterval(leadersRefreshInterval);
  if (economicRefreshInterval) clearInterval(economicRefreshInterval);
  if (ucdpRefreshInterval) clearInterval(ucdpRefreshInterval);
  if (electionRefreshInterval) clearInterval(electionRefreshInterval);
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

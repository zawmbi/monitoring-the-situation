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
import { stabilityService } from './services/stability.service.js';
import { disastersService } from './services/disasters.service.js';
import { cyberService } from './services/cyber.service.js';
import { refugeeService } from './services/refugee.service.js';
import { courtService } from './services/court.service.js';
import { commoditiesService } from './services/commodities.service.js';
import { metaculusService } from './services/metaculus.service.js';
import { sanctionsService } from './services/sanctions.service.js';
import { shippingService } from './services/shipping.service.js';
import { countryRiskService } from './services/countryRisk.service.js';
import { tensionIndexService } from './services/tensionIndex.service.js';
import { briefingService } from './services/briefing.service.js';
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
      stability: '/api/stability',
      disasters: '/api/disasters',
      cyber: '/api/cyber',
      refugees: '/api/refugees',
      court: '/api/court',
      commodities: '/api/commodities',
      metaculus: '/api/metaculus',
      sanctions: '/api/sanctions',
      shipping: '/api/shipping',
      risk: '/api/risk',
      tension: '/api/tension',
      arbitrage: '/api/arbitrage',
      briefing: '/api/briefing',
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
let stabilityRefreshInterval = null;
let disasterRefreshInterval = null;
let cyberRefreshInterval = null;
let refugeeRefreshInterval = null;
let courtRefreshInterval = null;
let commoditiesRefreshInterval = null;
let metaculusRefreshInterval = null;
let sanctionsRefreshInterval = null;
let shippingRefreshInterval = null;
let riskRefreshInterval = null;
let tensionRefreshInterval = null;
let briefingRefreshInterval = null;

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

  // Initial stability data fetch (delayed to avoid startup contention)
  setTimeout(() => {
    console.log('[Worker] Starting initial stability data fetch...');
    stabilityService.getCombinedData().catch(console.error);
  }, 20000);

  // Periodic refresh — stability data (every 15 min)
  const STABILITY_POLL_MS = 15 * 60 * 1000;
  stabilityRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing stability data...');
    stabilityService.getCombinedData().catch(console.error);
  }, STABILITY_POLL_MS);

  // ── New service workers (staggered startup to avoid contention) ──

  // Disasters — every 10 minutes (NASA EONET + ReliefWeb)
  setTimeout(() => {
    console.log('[Worker] Starting initial disasters fetch...');
    disastersService.getCombinedData().catch(console.error);
  }, 25000);
  const DISASTER_POLL_MS = 10 * 60 * 1000;
  disasterRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing disaster data...');
    disastersService.getCombinedData().catch(console.error);
  }, DISASTER_POLL_MS);

  // Cyber — every 10 minutes
  setTimeout(() => {
    console.log('[Worker] Starting initial cyber fetch...');
    cyberService.getCombinedData().catch(console.error);
  }, 28000);
  const CYBER_POLL_MS = 10 * 60 * 1000;
  cyberRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing cyber data...');
    cyberService.getCombinedData().catch(console.error);
  }, CYBER_POLL_MS);

  // Refugees — every 1 hour
  setTimeout(() => {
    console.log('[Worker] Starting initial refugee data fetch...');
    refugeeService.getCombinedData().catch(console.error);
  }, 30000);
  const REFUGEE_POLL_MS = 60 * 60 * 1000;
  refugeeRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing refugee data...');
    refugeeService.getCombinedData().catch(console.error);
  }, REFUGEE_POLL_MS);

  // Court — every 15 minutes
  setTimeout(() => {
    console.log('[Worker] Starting initial court data fetch...');
    courtService.getCombinedData().catch(console.error);
  }, 32000);
  const COURT_POLL_MS = 15 * 60 * 1000;
  courtRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing court data...');
    courtService.getCombinedData().catch(console.error);
  }, COURT_POLL_MS);

  // Commodities — every 5 minutes
  setTimeout(() => {
    console.log('[Worker] Starting initial commodities fetch...');
    commoditiesService.getCombinedData().catch(console.error);
  }, 34000);
  const COMMODITIES_POLL_MS = 5 * 60 * 1000;
  commoditiesRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing commodity data...');
    commoditiesService.getCombinedData().catch(console.error);
  }, COMMODITIES_POLL_MS);

  // Metaculus — every 15 minutes
  setTimeout(() => {
    console.log('[Worker] Starting initial Metaculus fetch...');
    metaculusService.getCombinedData().catch(console.error);
  }, 36000);
  const METACULUS_POLL_MS = 15 * 60 * 1000;
  metaculusRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing Metaculus data...');
    metaculusService.getCombinedData().catch(console.error);
  }, METACULUS_POLL_MS);

  // Sanctions — every 15 minutes
  setTimeout(() => {
    console.log('[Worker] Starting initial sanctions fetch...');
    sanctionsService.getCombinedData().catch(console.error);
  }, 38000);
  const SANCTIONS_POLL_MS = 15 * 60 * 1000;
  sanctionsRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing sanctions data...');
    sanctionsService.getCombinedData().catch(console.error);
  }, SANCTIONS_POLL_MS);

  // Shipping — every 15 minutes
  setTimeout(() => {
    console.log('[Worker] Starting initial shipping fetch...');
    shippingService.getCombinedData().catch(console.error);
  }, 40000);
  const SHIPPING_POLL_MS = 15 * 60 * 1000;
  shippingRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing shipping data...');
    shippingService.getCombinedData().catch(console.error);
  }, SHIPPING_POLL_MS);

  // Country risk scores — every 30 minutes
  setTimeout(() => {
    console.log('[Worker] Starting initial risk score computation...');
    countryRiskService.getCountryRiskScores().catch(console.error);
  }, 45000);
  const RISK_POLL_MS = 30 * 60 * 1000;
  riskRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing risk scores...');
    countryRiskService.getCountryRiskScores().catch(console.error);
  }, RISK_POLL_MS);

  // Global tension index — every 15 minutes
  setTimeout(() => {
    console.log('[Worker] Starting initial tension index computation...');
    tensionIndexService.getGlobalTension().catch(console.error);
  }, 48000);
  const TENSION_POLL_MS = 15 * 60 * 1000;
  tensionRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing tension index...');
    tensionIndexService.getGlobalTension().catch(console.error);
  }, TENSION_POLL_MS);

  // Briefing — every 10 minutes
  setTimeout(() => {
    console.log('[Worker] Starting initial briefing generation...');
    briefingService.getGlobalBriefing().catch(console.error);
  }, 55000);
  const BRIEFING_POLL_MS = 10 * 60 * 1000;
  briefingRefreshInterval = setInterval(() => {
    console.log('[Worker] Refreshing global briefing...');
    briefingService.getGlobalBriefing().catch(console.error);
  }, BRIEFING_POLL_MS);

  console.log(`[Worker] Background refresh every ${config.polling.news / 1000}s`);
  console.log(`[Worker] Conflict data refresh every ${CONFLICT_POLL_MS / 1000}s`);
  console.log(`[Worker] Tariff data refresh every ${TARIFF_POLL_MS / 1000}s`);
  console.log(`[Worker] World leaders refresh every ${LEADERS_POLL_MS / 1000}s`);
  console.log(`[Worker] Economic data refresh every ${ECONOMIC_POLL_MS / 1000}s`);
  console.log(`[Worker] UCDP conflict data refresh every ${UCDP_POLL_MS / 1000}s`);
  console.log(`[Worker] New services: disasters(${DISASTER_POLL_MS/1000}s) cyber(${CYBER_POLL_MS/1000}s) commodities(${COMMODITIES_POLL_MS/1000}s) tensions(${TENSION_POLL_MS/1000}s)`);
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
  if (stabilityRefreshInterval) clearInterval(stabilityRefreshInterval);
  if (disasterRefreshInterval) clearInterval(disasterRefreshInterval);
  if (cyberRefreshInterval) clearInterval(cyberRefreshInterval);
  if (refugeeRefreshInterval) clearInterval(refugeeRefreshInterval);
  if (courtRefreshInterval) clearInterval(courtRefreshInterval);
  if (commoditiesRefreshInterval) clearInterval(commoditiesRefreshInterval);
  if (metaculusRefreshInterval) clearInterval(metaculusRefreshInterval);
  if (sanctionsRefreshInterval) clearInterval(sanctionsRefreshInterval);
  if (shippingRefreshInterval) clearInterval(shippingRefreshInterval);
  if (riskRefreshInterval) clearInterval(riskRefreshInterval);
  if (tensionRefreshInterval) clearInterval(tensionRefreshInterval);
  if (briefingRefreshInterval) clearInterval(briefingRefreshInterval);
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

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
import { electionNewsService } from './services/electionNews.service.js';
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
import { narrativeService } from './services/narrative.service.js';
import { regimeService } from './services/regime.service.js';
import { allianceService } from './services/alliance.service.js';
import { infrastructureService } from './services/infrastructure.service.js';
import { demographicService } from './services/demographic.service.js';
import { credibilityService } from './services/credibility.service.js';
import { leadershipService } from './services/leadership.service.js';
import { healthService } from './services/health.service.js';
import { timeseriesService } from './services/timeseries.service.js';
import { climateService } from './services/climate.service.js';
import { nuclearService } from './services/nuclear.service.js';
import { aitechService } from './services/aitech.service.js';
import { emergingNewsService } from './services/emergingNews.service.js';
import apiRoutes from './api/routes.js';

const app = express();
const server = createServer(app);

// ===========================================
// CONSTANTS
// ===========================================

const SHUTDOWN_TIMEOUT_MS = 15_000;
const NETWORK_PROBE_INTERVAL_MS = 60_000;
const NETWORK_PROBE_TIMEOUT_MS = 5_000;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_JSON_BODY = '1mb';

// ===========================================
// WORKER REGISTRY
// ===========================================

/**
 * Data-driven worker definitions. Each entry describes a background task:
 *   name       – human-readable label for logs
 *   fn         – async function to call
 *   intervalMs – refresh interval in milliseconds
 *   delayMs    – staggered startup delay (0 = immediate)
 *
 * The registry replaces 30+ individual interval variables and makes
 * shutdown, health reporting, and future changes trivial.
 */
const WORKERS = [
  // ── Tier 0: Core content (immediate startup) ──
  { name: 'content',          fn: () => aggregationService.getCombinedFeed({ refresh: true }), intervalMs: config.polling.news,    delayMs: 0 },
  { name: 'conflict',         fn: () => conflictService.getLiveData(),                         intervalMs: 30 * 60_000,            delayMs: 0 },
  { name: 'tariff',           fn: () => tariffService.getLiveData(),                           intervalMs: 15 * 60_000,            delayMs: 0 },
  { name: 'world-leaders',    fn: () => wikidataService.getWorldLeaders(),                     intervalMs: 24 * 60 * 60_000,       delayMs: 0 },
  { name: 'ucdp',             fn: () => ucdpService.getActiveConflicts(),                      intervalMs: 24 * 60 * 60_000,       delayMs: 0 },

  // ── Tier 1: Delayed startup (avoid contention) ──
  { name: 'worldbank',        fn: () => worldBankService.preloadCountries(PRELOAD_COUNTRIES),  intervalMs: 24 * 60 * 60_000,       delayMs: 10_000 },
  { name: 'election-news',    fn: async () => { await electionNewsService.getTopElectionNews(); await electionNewsService.getBattlegroundOverview(); }, intervalMs: 10 * 60_000, delayMs: 20_000 },
  { name: 'disasters',        fn: () => disastersService.getCombinedData(),                    intervalMs: 10 * 60_000,            delayMs: 25_000 },
  { name: 'cyber',            fn: () => cyberService.getCombinedData(),                        intervalMs: 10 * 60_000,            delayMs: 28_000 },
  { name: 'election-live',    fn: () => electionLiveService.getLiveData(),                     intervalMs: 15 * 60_000,            delayMs: 30_000 },
  { name: 'refugees',         fn: () => refugeeService.getCombinedData(),                      intervalMs: 60 * 60_000,            delayMs: 30_000 },
  { name: 'court',            fn: () => courtService.getCombinedData(),                        intervalMs: 15 * 60_000,            delayMs: 32_000 },
  { name: 'commodities',      fn: () => commoditiesService.getCombinedData(),                  intervalMs: 5 * 60_000,             delayMs: 34_000 },
  { name: 'stability',        fn: () => stabilityService.getCombinedData(),                    intervalMs: 15 * 60_000,            delayMs: 35_000 },
  { name: 'metaculus',        fn: () => metaculusService.getCombinedData(),                    intervalMs: 15 * 60_000,            delayMs: 36_000 },
  { name: 'sanctions',        fn: () => sanctionsService.getCombinedData(),                    intervalMs: 15 * 60_000,            delayMs: 38_000 },
  { name: 'shipping',         fn: () => shippingService.getCombinedData(),                     intervalMs: 15 * 60_000,            delayMs: 40_000 },
  { name: 'risk-scores',      fn: () => countryRiskService.getCountryRiskScores(),             intervalMs: 30 * 60_000,            delayMs: 45_000 },
  { name: 'tension-index',    fn: () => tensionIndexService.getGlobalTension(),                intervalMs: 15 * 60_000,            delayMs: 48_000 },
  { name: 'briefing',         fn: () => briefingService.getGlobalBriefing(),                   intervalMs: 10 * 60_000,            delayMs: 55_000 },

  // ── Tier 2: Phase 2 services ──
  { name: 'narrative',        fn: () => narrativeService.getCombinedData(),                    intervalMs: 10 * 60_000,            delayMs: 58_000 },
  { name: 'regime',           fn: () => regimeService.getCombinedData(),                       intervalMs: 30 * 60_000,            delayMs: 62_000 },
  { name: 'alliance',         fn: () => allianceService.getCombinedData(),                     intervalMs: 60 * 60_000,            delayMs: 65_000 },
  { name: 'infrastructure',   fn: () => infrastructureService.getCombinedData(),               intervalMs: 15 * 60_000,            delayMs: 68_000 },
  { name: 'demographic',      fn: () => demographicService.getCombinedData(),                  intervalMs: 24 * 60 * 60_000,       delayMs: 72_000 },
  { name: 'credibility',      fn: () => credibilityService.getCombinedData(),                  intervalMs: 10 * 60_000,            delayMs: 75_000 },
  { name: 'leadership',       fn: () => leadershipService.getCombinedData(),                   intervalMs: 60 * 60_000,            delayMs: 78_000 },
  { name: 'health',           fn: () => healthService.getCombinedData(),                       intervalMs: 30 * 60_000,            delayMs: 82_000 },
  { name: 'climate',          fn: () => climateService.getCombinedData(),                      intervalMs: 30 * 60_000,            delayMs: 85_000 },
  { name: 'nuclear',          fn: () => nuclearService.getCombinedData(),                      intervalMs: 30 * 60_000,            delayMs: 88_000 },
  { name: 'aitech',           fn: () => aitechService.getCombinedData(),                       intervalMs: 30 * 60_000,            delayMs: 91_000 },
  { name: 'emerging-news',    fn: () => emergingNewsService.getCombinedData(),                 intervalMs: 10 * 60_000,            delayMs: 94_000 },
];

// Runtime state for each worker
const workerState = new Map(); // name → { intervalId, timeoutId, lastRun, lastError, running }

// ===========================================
// MIDDLEWARE
// ===========================================

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(config.cors));
app.use(compression());
app.use(express.json({ limit: MAX_JSON_BODY }));

// Request timeout — prevent slow clients from holding connections forever
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });
  next();
});

// In-flight request tracking for graceful shutdown
let inFlightRequests = 0;
app.use((req, res, next) => {
  inFlightRequests++;
  let counted = true;
  const done = () => { if (counted) { counted = false; inFlightRequests--; } };
  res.on('finish', done);
  res.on('close', done);
  next();
});

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
      emerging: '/api/emerging',
      narrative: '/api/narrative',
      regime: '/api/regime',
      alliance: '/api/alliance',
      infrastructure: '/api/infrastructure',
      demographic: '/api/demographic',
      credibility: '/api/credibility',
      leadership: '/api/leadership',
      search: '/api/search',
      health: '/health',
    },
    websocket: '/ws',
  });
});

app.get('/health', async (req, res) => {
  const redisHealth = await cacheService.health();
  const isHealthy = redisHealth.status === 'healthy';
  const mem = process.memoryUsage();

  // Worker summary
  const workers = {};
  for (const [name, state] of workerState) {
    workers[name] = {
      running: state.running,
      lastRun: state.lastRun,
      lastError: state.lastError,
    };
  }

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    inFlightRequests,
    redis: redisHealth,
    workers,
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
// NETWORK CONNECTIVITY
// ===========================================

let _networkOnline = false;
let _networkCheckInterval = null;

async function checkNetworkConnectivity() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NETWORK_PROBE_TIMEOUT_MS);
    const resp = await fetch('https://dns.google/resolve?name=example.com&type=A', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timeout);
    return resp.ok;
  } catch {
    return false;
  }
}

// ===========================================
// BACKGROUND WORKERS (data-driven)
// ===========================================

function runWorker(worker) {
  const state = workerState.get(worker.name);
  if (state.running) return; // skip if previous run still in progress

  state.running = true;
  worker.fn()
    .then(() => {
      state.lastRun = new Date().toISOString();
      state.lastError = null;
    })
    .catch((err) => {
      state.lastError = err.message;
      console.error(`[Worker:${worker.name}] Error: ${err.message}`);
    })
    .finally(() => {
      state.running = false;
    });
}

function startBackgroundRefresh() {
  console.log(`[Worker] Starting ${WORKERS.length} background workers...`);

  for (const worker of WORKERS) {
    const state = { intervalId: null, timeoutId: null, lastRun: null, lastError: null, running: false };
    workerState.set(worker.name, state);

    if (worker.delayMs === 0) {
      // Immediate start
      console.log(`[Worker] Starting ${worker.name} (every ${worker.intervalMs / 1000}s)`);
      runWorker(worker);
    } else {
      // Delayed start
      state.timeoutId = setTimeout(() => {
        console.log(`[Worker] Starting ${worker.name} (every ${worker.intervalMs / 1000}s)`);
        runWorker(worker);
        state.timeoutId = null;
      }, worker.delayMs);
    }

    // Periodic refresh
    state.intervalId = setInterval(() => runWorker(worker), worker.intervalMs);
  }

  // Timeseries snapshots — piggyback on tension index refresh
  const SNAPSHOT_POLL_MS = 15 * 60_000;
  const snapshotState = { intervalId: null, timeoutId: null, lastRun: null, lastError: null, running: false };
  workerState.set('timeseries-snapshot', snapshotState);
  snapshotState.intervalId = setInterval(async () => {
    if (snapshotState.running) return;
    snapshotState.running = true;
    try {
      const tension = await tensionIndexService.getGlobalTension();
      await timeseriesService.snapshot({
        tensionIndex: tension?.index,
        activeConflictCount: tension?.summary?.totalConflicts,
        conflictIntensities: tension?.activeConflicts?.reduce((acc, c) => {
          acc[c.id] = c.intensity;
          return acc;
        }, {}),
      });
      snapshotState.lastRun = new Date().toISOString();
      snapshotState.lastError = null;
    } catch (err) {
      snapshotState.lastError = err.message;
      console.error('[Worker:timeseries-snapshot] Error:', err.message);
    } finally {
      snapshotState.running = false;
    }
  }, SNAPSHOT_POLL_MS);

  console.log(`[Worker] All ${WORKERS.length} workers registered`);
}

async function startBackgroundRefreshWhenReady() {
  _networkOnline = await checkNetworkConnectivity();

  if (!_networkOnline) {
    console.warn('===========================================');
    console.warn('  [Network] No internet access detected');
    console.warn('  All external API calls will be skipped');
    console.warn('  Retrying connectivity every 60s...');
    console.warn('  Server is still running with cached/mock data');
    console.warn('===========================================');

    _networkCheckInterval = setInterval(async () => {
      const online = await checkNetworkConnectivity();
      if (online && !_networkOnline) {
        _networkOnline = true;
        console.log('[Network] Internet access restored — starting data fetches');
        clearInterval(_networkCheckInterval);
        _networkCheckInterval = null;
        startBackgroundRefresh();
      }
    }, NETWORK_PROBE_INTERVAL_MS);
    return;
  }

  console.log('[Network] Internet access confirmed');
  startBackgroundRefresh();
}

// ===========================================
// STARTUP
// ===========================================

async function start() {
  console.log('===========================================');
  console.log('  Monitored API - Starting...');
  console.log(`  Node ${process.version} | PID ${process.pid}`);
  console.log('===========================================');

  // Validate critical config
  config.validate();

  // Connect to Redis
  console.log('[Startup] Connecting to Redis...');
  const redisConnected = await cacheService.connect();
  if (!redisConnected) {
    console.warn('[Startup] Redis not connected - caching disabled');
  }

  // Initialize WebSocket
  console.log('[Startup] Initializing WebSocket...');
  wsHandler.initialize(server);

  // Start background content refresh (checks network first)
  startBackgroundRefreshWhenReady();

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

let _shuttingDown = false;

async function shutdown(signal) {
  if (_shuttingDown) return; // prevent double-shutdown
  _shuttingDown = true;

  console.log(`\n[Shutdown] Received ${signal}...`);

  // Stop accepting new connections
  server.close(() => console.log('[Shutdown] HTTP server closed'));

  // Clear all worker intervals and pending timeouts
  for (const [name, state] of workerState) {
    if (state.intervalId) clearInterval(state.intervalId);
    if (state.timeoutId) clearTimeout(state.timeoutId);
  }
  if (_networkCheckInterval) clearInterval(_networkCheckInterval);

  // Wait for in-flight requests to drain (up to SHUTDOWN_TIMEOUT_MS)
  const drainStart = Date.now();
  while (inFlightRequests > 0 && (Date.now() - drainStart) < SHUTDOWN_TIMEOUT_MS) {
    console.log(`[Shutdown] Waiting for ${inFlightRequests} in-flight requests...`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (inFlightRequests > 0) {
    console.warn(`[Shutdown] Forcing shutdown with ${inFlightRequests} requests still in-flight`);
  }

  wsHandler.shutdown();
  await cacheService.disconnect();

  console.log('[Shutdown] Complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled rejections so they don't silently crash the process
process.on('unhandledRejection', (reason) => {
  console.error('[Fatal] Unhandled promise rejection:', reason);
});

start().catch((error) => {
  console.error('[Fatal]', error);
  process.exit(1);
});

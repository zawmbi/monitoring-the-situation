/**
 * WebSocket Handler
 * Real-time content updates to connected clients
 */

import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { cacheService } from '../services/cache.service.js';

class WebSocketHandler {
  constructor() {
    this.wss = null;
    this.clients = new Map();
    this.heartbeatInterval = null;
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.startHeartbeat();
    this.subscribeToUpdates();

    console.log('[WebSocket] Server initialized');
  }

  handleConnection(ws, req) {
    const clientId = uuidv4();
    console.log(`[WebSocket] Client connected: ${clientId}`);

    this.clients.set(clientId, {
      ws,
      subscriptions: new Set(['content:updates']),
      isAlive: true,
      connectedAt: new Date(),
      filters: { types: [], sources: [] },
    });

    this.sendToClient(clientId, {
      type: 'connected',
      clientId,
      message: 'Connected to Monitored',
    });

    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) client.isAlive = true;
    });
    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    });
    ws.on('error', (error) => {
      console.error(`[WebSocket] Error ${clientId}:`, error.message);
      this.clients.delete(clientId);
    });
  }

  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);
      if (!client) return;

      switch (message.type) {
        case 'subscribe':
          if (message.channel) {
            client.subscriptions.add(message.channel);
            this.sendToClient(clientId, { type: 'subscribed', channel: message.channel });
          }
          break;

        case 'unsubscribe':
          if (message.channel) {
            client.subscriptions.delete(message.channel);
            this.sendToClient(clientId, { type: 'unsubscribed', channel: message.channel });
          }
          break;

        case 'set_filters':
          // Allow clients to filter what updates they receive
          client.filters = {
            types: message.types || [],
            sources: message.sources || [],
          };
          this.sendToClient(clientId, { type: 'filters_set', filters: client.filters });
          break;

        case 'ping':
          this.sendToClient(clientId, { type: 'pong' });
          break;
      }
    } catch (error) {
      console.error('[WebSocket] Message parse error:', error.message);
    }
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client?.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message));
    }
  }

  broadcast(channel, message) {
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions.has(channel) && client.ws.readyState === 1) {
        client.ws.send(JSON.stringify({ channel, ...message }));
      }
    }
  }

  async subscribeToUpdates() {
    await cacheService.subscribe('content:updates', (message) => {
      this.broadcast('content:updates', message);
    });
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      for (const [clientId, client] of this.clients) {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(clientId);
          continue;
        }
        client.isAlive = false;
        client.ws.ping();
      }
    }, 30000);
  }

  getStats() {
    return {
      totalConnections: this.clients.size,
      connections: Array.from(this.clients.entries()).map(([id, client]) => ({
        id,
        subscriptions: Array.from(client.subscriptions),
        connectedAt: client.connectedAt,
        filters: client.filters,
      })),
    };
  }

  shutdown() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    for (const [clientId, client] of this.clients) {
      this.sendToClient(clientId, { type: 'shutdown' });
      client.ws.close();
    }
    if (this.wss) this.wss.close();
  }
}

export const wsHandler = new WebSocketHandler();
export default wsHandler;

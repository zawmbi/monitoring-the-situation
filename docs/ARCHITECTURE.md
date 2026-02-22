# monitr - Architecture Documentation

## Overview

A scalable platform for aggregating news articles and social media content from multiple sources, designed to handle thousands of API calls per day while serving thousands of concurrent users.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│                    (Web / Mobile / Embeds)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     LOAD BALANCER / CDN                                  │
│              (Static assets cached at edge)                              │
└─────────────────────────────────────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │   API Server    │    │   API Server    │
│   (Stateless)   │    │   (Stateless)   │    │   (Stateless)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Redis       │    │   PostgreSQL    │    │  Background     │
│  Cache/PubSub   │    │   (Storage)     │    │  Workers        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                ┌──────────────────────┼──────────────────────┐
                                ▼                      ▼                      ▼
                       ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
                       │    NewsAPI      │    │   Twitter/X     │    │   RSS Feeds     │
                       │    GNews        │    │   Reddit        │    │   (Any URL)     │
                       └─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Design Principles

### 1. Cache-First Architecture

Users never directly trigger external API calls. All content is served from Redis cache:

```
User Request
     │
     ▼
┌──────────────┐
│ Redis Cache  │◄─── Hit: Return immediately (< 10ms)
└──────────────┘
     │
     │ Miss
     ▼
Return stale data (if available) + trigger background refresh
     │
     ▼
Background worker fetches fresh data
     │
     ▼
Update cache + notify via Pub/Sub
```

This approach:
- Ensures consistent response times
- Protects against external API failures
- Maximizes API quota efficiency

### 2. Content Normalization

All content types (articles, tweets, Reddit posts) are normalized to a common schema:

```javascript
{
  id: string,
  contentType: 'article' | 'tweet' | 'reddit_post',
  source: string,
  sourceName: string,
  title: string | null,
  content: string,
  summary: string,
  url: string,
  imageUrl: string | null,
  author: string,
  authorHandle: string | null,
  authorAvatarUrl: string | null,
  publishedAt: ISO8601 string,
  likesCount: number,
  retweetsCount: number,
  repliesCount: number,
  fetchedAt: ISO8601 string,
}
```

### 3. Real-time Updates

WebSocket connections provide live updates without polling:

```
┌──────────────────────────────────────────────────────────────┐
│                    Multi-Instance Setup                       │
│                                                               │
│  Client ◄──── WS ────► Server 1 ◄──┐                        │
│  Client ◄──── WS ────► Server 2 ◄──┼──► Redis Pub/Sub       │
│  Client ◄──── WS ────► Server 3 ◄──┘                        │
│                                          ▲                   │
│                                          │                   │
│                              Background Worker               │
│                              (publishes updates)             │
└──────────────────────────────────────────────────────────────┘
```

## Data Sources

### News APIs

| Source | Free Tier | Rate Limit | Data |
|--------|-----------|------------|------|
| NewsAPI | 100/day | 1 req/sec | Headlines, search |
| GNews | 100/day | 1 req/sec | Headlines by topic |
| Associated Press | Requires partnership | - | Wire content |

### Social APIs

| Source | Access Level | Rate Limit | Data |
|--------|--------------|------------|------|
| Twitter/X | Basic ($100/mo) | 100 reads/mo | Tweets, user timelines |
| Twitter/X | Pro ($5000/mo) | 1M reads/mo | Full access |
| Reddit | Free | 100 req/min | Posts, comments |

### RSS Feeds

No rate limits, but be respectful:
- Poll every 10-15 minutes
- Respect `Cache-Control` headers
- Use conditional requests (`If-Modified-Since`)

## API Endpoints

### Combined Feed
```
GET /api/feed
  ?limit=50           # Number of items
  ?types=article,tweet # Content types to include
  ?sources=reuters,bbc # Filter by source
  ?refresh=true       # Force cache refresh
```

### By Source Type
```
GET /api/news         # NewsAPI articles
GET /api/tweets       # Twitter content
GET /api/reddit       # Reddit posts
GET /api/rss          # RSS feed items
```

### Search
```
GET /api/search?q=keyword
```

### WebSocket
```
WS /ws
  → { type: 'subscribe', channel: 'content:updates' }
  ← { type: 'refresh', count: 150, timestamp: '...' }
```

## Scaling Strategy

### Current (POC)
- Single server instance
- Single Redis instance
- Docker Compose

### Phase 2 (1,000 users)
- 2-3 API servers behind load balancer
- Managed Redis (ElastiCache)
- Managed PostgreSQL (RDS)

### Phase 3 (10,000 users)
- Auto-scaling API servers
- Redis Cluster
- Read replicas for PostgreSQL
- CDN for static assets

### Phase 4 (100,000+ users)
- Kubernetes orchestration
- Dedicated WebSocket servers
- Content delivery via edge functions
- Full-text search with Elasticsearch

## Rate Limit Management

### Strategy: Quota Pooling

Instead of each user consuming API quota:

```
Traditional (Bad):
User 1 ──► NewsAPI ◄── User 2
User 3 ──► NewsAPI ◄── User 4
(4 API calls for same content)

Quota Pooling (Good):
                    ┌─────────────┐
Worker ──────────►  │   NewsAPI   │
(1 call every 5min) └─────────────┘
       │
       ▼
    ┌─────────┐
    │  Cache  │◄── User 1, User 2, User 3, User 4
    └─────────┘
(1 API call serves unlimited users)
```

### API Call Budget (Free Tier)

| Source | Daily Limit | Poll Interval | Daily Calls |
|--------|-------------|---------------|-------------|
| NewsAPI | 100 | 15 min | 96 |
| GNews | 100 | 15 min | 96 |
| Reddit | Unlimited* | 5 min | 288 |
| RSS | Unlimited | 10 min | 144 |

*Reddit is technically unlimited but requests respect.

## Monitoring

### Key Metrics

- **Content freshness**: Time since last successful fetch per source
- **Cache hit ratio**: Target > 95%
- **API quota usage**: Percentage of daily limit used
- **WebSocket connections**: Current count
- **Error rates**: By source and type

### Alerts

- API quota > 80% of daily limit
- No successful fetch from source in 30+ minutes
- Cache hit ratio < 90%
- Error rate > 5%

## Security

1. **API Keys**: Stored in environment variables, never in code
2. **CORS**: Restricted to known origins in production
3. **Rate Limiting**: Per-IP limits on all endpoints
4. **Input Validation**: All user inputs sanitized
5. **Content Sanitization**: HTML stripped from RSS content

## Future Enhancements

- [ ] User authentication & personalized feeds
- [ ] AI-powered content summarization
- [ ] Sentiment analysis on social content
- [ ] Trending topic detection
- [ ] Email/push notifications for keywords
- [ ] Content moderation & filtering
- [ ] Analytics dashboard

# Monitored Platform

A scalable real-time news and social media aggregation platform designed for high-volume content ingestion from major news sources, Twitter/X, and other social platforms.

## Core Purpose

Aggregate, process, and display content from:
- **Major News APIs**: NewsAPI, Associated Press, Reuters, Google News
- **Social Media**: Twitter/X API, Reddit, potentially Bluesky/Mastodon
- **RSS Feeds**: Any publication with RSS/Atom feeds
- **Custom Sources**: Webhooks, scrapers, manual curation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│                    (Web / Mobile / Embed Widgets)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│                    (Rate Limiting, Auth, Routing)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│   REST API    │      │   WebSocket   │      │   Workers     │
│   (Query)     │      │   (Real-time) │      │  (Ingestion)  │
└───────────────┘      └───────────────┘      └───────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   News      │  │   Social    │  │   Feed      │  │   Search    │    │
│  │   Service   │  │   Service   │  │   Service   │  │   Service   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│    Redis      │      │  PostgreSQL   │      │ External APIs │
│ Cache/PubSub  │      │  (Articles)   │      │ News/Twitter  │
└───────────────┘      └───────────────┘      └───────────────┘
```

## Quick Start

If you just want the UI and API running locally without Docker:

```bash
# From repo root
cp .env.example .env
cd frontend && cp .env.example .env && cd ..
npm run install:all
npm run dev:backend       # starts API on :4000
npm run dev:frontend      # starts UI on :3000
```

Frontend env defaults assume the API is on http://localhost:4000; update `frontend/.env` if needed. The UI shows demo data (with a yellow notice) if it cannot reach the API, so you should never get a black screen.

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local dev)
- API Keys (see below)

### API Keys You'll Need

| Service | Free Tier | Get Key |
|---------|-----------|---------|
| NewsAPI | 100 req/day | [newsapi.org](https://newsapi.org) |
| Twitter/X | Basic access | [developer.twitter.com](https://developer.twitter.com) |
| Reddit | Free | [reddit.com/prefs/apps](https://reddit.com/prefs/apps) |
| Google News | Via SerpAPI | [serpapi.com](https://serpapi.com) |

### Running the Platform

```bash
# Clone and setup
git clone <your-repo-url>
cd news-aggregator
cp .env.example .env
# Edit .env with your API keys

# Start everything
docker compose up --build

# Access
# Frontend: http://localhost:3000
# API: http://localhost:4000/api
# Health: http://localhost:4000/health
```

## Project Structure

```
news-aggregator/
├── docker-compose.yml          # Service orchestration
├── .env.example                 # Environment template
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Entry point
│       ├── config/             # Configuration
│       ├── api/                # REST endpoints
│       │   └── routes.js
│       ├── services/           # Business logic
│       │   ├── news.service.js      # News API integrations
│       │   ├── social.service.js    # Twitter/Reddit
│       │   ├── feed.service.js      # RSS/Atom parsing
│       │   ├── cache.service.js     # Redis caching
│       │   └── search.service.js    # Full-text search
│       └── workers/            # Background jobs
│           ├── news.worker.js       # Poll news APIs
│           ├── social.worker.js     # Poll social APIs
│           └── feed.worker.js       # Poll RSS feeds
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── NewsFeed/
│       │   ├── TweetStream/
│       │   ├── SourceFilter/
│       │   └── SearchBar/
│       ├── hooks/
│       └── services/
│
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    └── CONTRIBUTING.md
```

## Key Features

### Content Aggregation
- Pull from 10+ news sources simultaneously
- Real-time Twitter/X stream integration
- RSS feed polling with configurable intervals
- Deduplication to prevent repeated stories

### Scaling for Volume
- Redis caching prevents redundant API calls
- Background workers handle ingestion (not user requests)
- WebSocket broadcast for real-time updates
- Horizontal scaling ready

### Content Organization
- Filter by source, topic, date
- Full-text search across all content
- Trending topics detection
- Saved/bookmarked articles

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEWS_API_KEY` | NewsAPI.org key | Yes |
| `TWITTER_BEARER_TOKEN` | Twitter API v2 bearer token | Yes |
| `TWITTER_API_KEY` | Twitter API key | Yes |
| `TWITTER_API_SECRET` | Twitter API secret | Yes |
| `REDDIT_CLIENT_ID` | Reddit app client ID | Optional |
| `REDDIT_CLIENT_SECRET` | Reddit app secret | Optional |
| `REDIS_URL` | Redis connection string | Auto in Docker |
| `DATABASE_URL` | PostgreSQL connection | Auto in Docker |

## Rate Limit Strategy

External APIs have strict limits. Our approach:

```
User Request → Cache Check → Return if fresh
                   ↓
              Cache Miss → Return stale + trigger background refresh
                   ↓
         Background Worker → Fetch from API → Update cache
```

Users never wait for external API calls. Content is always served from cache.

## License

Proprietary - All rights reserved

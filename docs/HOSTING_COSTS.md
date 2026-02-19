# Monitr.xyz — Hosting Cost Estimate

## Current Architecture

| Component | Technology | Where It Runs |
|-----------|-----------|---------------|
| Frontend (SPA) | React + Vite | Firebase Hosting |
| Cloud Functions | Node.js (15 functions) | Firebase Cloud Functions (v2) |
| Database (user data) | Firestore | Firebase |
| Auth | Firebase Authentication | Firebase |
| Backend API server | Node.js + Express | **Needs separate hosting** |
| Cache / Pub-Sub | Redis | **Needs separate hosting** |
| Persistent storage | PostgreSQL | **Needs separate hosting** |
| Payments | Stripe | Stripe (external) |
| Domain | monitr.xyz | Registrar |

---

## 1. Firebase (Free Spark Plan vs Paid Blaze Plan)

Firebase's **Spark plan** (free) works for getting started, but Cloud Functions and Firestore have hard limits. The **Blaze plan** (pay-as-you-go) is required once you exceed free tier limits — it still includes a generous free tier each month.

### Firebase Hosting

| | Spark (Free) | Blaze (Pay-as-you-go) |
|---|---|---|
| Storage | 10 GB | $0.026/GB |
| Data transfer | 360 MB/day | $0.15/GB |
| Custom domain | Yes | Yes |
| SSL | Yes | Yes |

**Your estimated cost**: Your SPA is likely < 50 MB. At low-to-moderate traffic (a few hundred users/day), you'll stay well within the free tier. **$0/mo** at launch.

### Firebase Cloud Functions (v2)

| | Free Tier (per month) | After Free Tier |
|---|---|---|
| Invocations | 2,000,000 | $0.40 per million |
| CPU-seconds | 200,000 | $0.01/1000 vCPU-sec |
| Memory | 400,000 GB-seconds | $0.0025/1000 GB-sec |
| Outbound networking | 5 GB | $0.12/GB |

You have **15 Cloud Functions**: auth triggers, chat, configs, settings, Stripe, admin, and a scheduled function (runs every 10 minutes = ~4,320 invocations/month just for the scheduler).

**Your estimated cost**:
- **< 100 users**: Free tier covers everything. **$0/mo**
- **1,000 active users**: ~50k-100k invocations/month. Still within free tier. **$0/mo**
- **10,000 active users**: ~500k-1M invocations/month. Approaching free tier limits. **$1-5/mo**

### Firestore

| | Free Tier (per day) | After Free Tier |
|---|---|---|
| Document reads | 50,000/day | $0.06 per 100,000 |
| Document writes | 20,000/day | $0.18 per 100,000 |
| Document deletes | 20,000/day | $0.02 per 100,000 |
| Storage | 1 GB | $0.18/GB/month |

Collections: `users`, `configs`, `chats`, `messages`, `subscriptions`, `reports`, `rate_limits`

**Your estimated cost**:
- **< 100 users**: Well within free tier. **$0/mo**
- **1,000 active users**: Chat messages could push reads to ~100k/day. **$1-3/mo**
- **10,000 active users**: Chat-heavy usage could mean 500k+ reads/day. **$10-30/mo**

### Firebase Authentication

| | Free Tier | After Free Tier |
|---|---|---|
| Email/password | 50,000 MAU | $0.0055/MAU beyond 50k |
| Anonymous (guests) | 50,000 MAU | $0.0055/MAU beyond 50k |
| Phone auth | 10 verifications/day | $0.01-0.06/verification |

**Your estimated cost**: With guest expiration every 30 minutes, anonymous account churn is managed. **$0/mo** until you hit 50k monthly users.

---

## 2. Backend API Server + Redis + PostgreSQL

Your Express backend, Redis, and PostgreSQL are currently configured via Docker Compose for local development. For production, you need to host these somewhere. Here are the main options:

### Option A: Single VPS (Best Value for Starting Out)

Run all three (Express + Redis + PostgreSQL) on one server.

| Provider | Plan | Specs | Monthly Cost |
|----------|------|-------|-------------|
| **DigitalOcean** | Basic Droplet | 2 vCPU, 2 GB RAM, 50 GB SSD | **$18/mo** |
| **Hetzner** | CX22 | 2 vCPU, 4 GB RAM, 40 GB SSD | **~$5/mo** |
| **Vultr** | Cloud Compute | 2 vCPU, 2 GB RAM, 50 GB SSD | **$14/mo** |
| **Linode (Akamai)** | Shared 2GB | 1 vCPU, 2 GB RAM, 50 GB SSD | **$12/mo** |
| **Railway** | Pro plan | Usage-based | **$5 + usage (~$10-20/mo)** |
| **Render** | Starter | 512 MB RAM per service | **$7/service × 3 = $21/mo** |
| **Fly.io** | Pay-as-you-go | 1 shared CPU, 256 MB | **~$5-10/mo** |

**Recommendation**: A **single Hetzner CX22 ($5/mo)** or **DigitalOcean Droplet ($18/mo)** running Docker Compose is the most cost-effective for launch. You already have the `docker-compose.yml` ready.

### Option B: Managed Services (Easier, More Expensive)

| Service | Provider | Monthly Cost |
|---------|----------|-------------|
| Express API | Railway / Render / Fly.io | $5-15/mo |
| Redis | Upstash (serverless) | $0 (free tier: 10k commands/day) |
| Redis | Redis Cloud | $0 (free tier: 30 MB) |
| PostgreSQL | Neon (serverless) | $0 (free tier: 0.5 GB) |
| PostgreSQL | Supabase | $0 (free tier: 500 MB) |

**Managed total**: ~$5-15/mo (API hosting) + $0 (free Redis/Postgres tiers)

### Option C: Move Backend to Firebase Cloud Functions

You could eliminate the separate backend entirely by migrating Express routes into Cloud Functions. This means:
- No separate server to manage
- Pay only for what you use
- But: cold starts, no WebSockets (would need to switch to Firestore real-time listeners), and refactoring effort

**Not recommended right now** — your backend has 40+ services and WebSocket support that don't fit the Cloud Functions model well.

---

## 3. External API Costs

| Service | Free Tier | Paid Tier | Your Current Usage |
|---------|-----------|-----------|-------------------|
| NewsAPI | 100 req/day | $449/mo (Business) | Using free tier |
| GNews | 100 req/day | $84/mo (Basic) | Using free tier |
| Twitter/X | Very limited | $100/mo (Basic), $5,000/mo (Pro) | Free or Basic |
| Reddit | Free (100 req/min) | Free | Free |
| Alpha Vantage | 25 req/day | $49.99/mo (Standard) | Using free tier |
| FMP | 250 req/day | $14/mo (Starter) | Using free tier |
| FEC API | Free | Free | Free |
| GDELT | Free | Free | Free |

**Current external API cost**: **$0/mo** (all free tiers)
**If you need Twitter Basic**: **+$100/mo**

---

## 4. Domain & DNS

| Item | Cost |
|------|------|
| monitr.xyz domain (annual) | ~$10-15/year (~$1/mo) |
| DNS (Cloudflare, etc.) | Free |
| SSL (Firebase provides) | Free |

---

## 5. Stripe Fees

Stripe charges per transaction, not monthly:
- **2.9% + $0.30** per successful card charge
- No monthly fee

This only matters once you have paying subscribers.

---

## Summary: Monthly Cost Estimates

### Launch Phase (< 100 users)

| Component | Cost |
|-----------|------|
| Firebase (Hosting + Functions + Firestore + Auth) | $0 |
| Backend VPS (Hetzner CX22 with Docker) | $5 |
| External APIs | $0 |
| Domain | ~$1 |
| **Total** | **~$6/mo** |

### Growth Phase (1,000 users)

| Component | Cost |
|-----------|------|
| Firebase (Blaze plan, still mostly free tier) | $0-5 |
| Backend VPS (DigitalOcean 2GB or Hetzner CX22) | $5-18 |
| Twitter/X Basic (if needed) | $0-100 |
| External APIs (free tiers) | $0 |
| Domain | ~$1 |
| **Total** | **~$6-124/mo** |

### Scale Phase (10,000 users)

| Component | Cost |
|-----------|------|
| Firebase (Blaze plan) | $15-40 |
| Backend (larger VPS or managed services) | $20-50 |
| Managed Redis (Upstash/Redis Cloud) | $0-10 |
| Managed PostgreSQL (if migrating off VPS) | $0-25 |
| Twitter/X Basic | $100 |
| News API upgrades | $0-84 |
| Domain | ~$1 |
| **Total** | **~$136-310/mo** |

---

## Recommended First Steps

1. **Stay on Firebase Spark (free) plan** until you deploy Cloud Functions, then switch to **Blaze** (it still includes free tier usage — you only pay for overages)
2. **Get a $5/mo Hetzner VPS** (or similar) and run your existing `docker-compose.yml` for the backend + Redis + PostgreSQL
3. **Keep all external APIs on free tiers** — your quota-pooling architecture is designed exactly for this
4. **Set up Firebase budget alerts** at $5, $10, and $25 to avoid surprises on Blaze plan

**Estimated total to launch: ~$6/month**

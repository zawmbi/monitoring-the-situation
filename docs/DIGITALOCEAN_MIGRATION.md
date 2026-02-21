# Railway → DigitalOcean Droplet Migration Guide

**Target**: Deploy the `demo` branch backend (API + Redis + PostgreSQL) on a single DigitalOcean Droplet with `monitr.xyz` domain.

**Architecture after migration**:
- **Frontend SPA** → stays on Firebase Hosting at `monitr.xyz`
- **Backend API** → DigitalOcean Droplet at `api.monitr.xyz`
- **Redis + PostgreSQL** → same Droplet via Docker Compose

---

## Prerequisites

- DigitalOcean account with 1 Droplet plan
- Access to DNS settings for `monitr.xyz`
- Your `.env` file with production API keys
- SSH key added to your DigitalOcean account

---

## Step 1: Create the Droplet

1. Log into [DigitalOcean](https://cloud.digitalocean.com)
2. Click **Create → Droplets**
3. Configure:
   - **Region**: Choose closest to your primary user base (e.g., `NYC1`, `SFO3`)
   - **Image**: **Ubuntu 24.04 LTS**
   - **Size**: **Basic → Regular** — minimum **2 GB RAM / 1 vCPU / 50 GB SSD** ($12/mo) or **2 vCPU / 2 GB RAM** ($18/mo) recommended
   - **Authentication**: SSH key (recommended) or password
   - **Hostname**: `monitr-api`
4. Click **Create Droplet**
5. **Copy the Droplet's public IPv4 address** (e.g., `164.90.xxx.xxx`)

> **Why 2 GB RAM minimum**: Docker + PostgreSQL + Redis + Node backend need ~1.5 GB under load. The 1 GB plan will OOM.

---

## Step 2: Point DNS to the Droplet

Go to your domain registrar or DNS provider (Cloudflare, Namecheap, etc.) and create/update these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `api` | `<DROPLET_IP>` | 300 |

This makes `api.monitr.xyz` resolve to your Droplet.

**If you also want `monitr.xyz` itself on the Droplet** (not Firebase), add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `<DROPLET_IP>` | 300 |

> DNS propagation can be near-instant with a low TTL (300s), but can take up to 30 minutes with some providers. Set the A record now before proceeding.

### Verify DNS (from your local machine):

```bash
dig api.monitr.xyz +short
# Should return your Droplet IP
```

---

## Step 3: SSH into the Droplet

```bash
ssh root@<DROPLET_IP>
```

Or if you named it:
```bash
ssh root@api.monitr.xyz
```

---

## Step 4: Initial Server Setup

Run the deploy script's setup command, or do it manually:

### Option A: Manual setup (if you want to understand each step)

```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Verify Docker + Compose
docker --version
docker compose version

# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

### Option B: Use the deploy script (after cloning — see Step 5)

```bash
./deploy.sh setup
```

---

## Step 5: Clone the Repo & Checkout `demo` Branch

```bash
# Clone the repository
cd /opt
git clone https://github.com/<your-org>/monitoring-the-situation.git monitr
cd monitr

# Checkout the demo branch
git checkout demo
```

> If using a private repo, you'll need to set up a deploy key or personal access token:
> ```bash
> # Using HTTPS with token
> git clone https://<GITHUB_TOKEN>@github.com/<your-org>/monitoring-the-situation.git monitr
> ```

---

## Step 6: Create the Production `.env` File

```bash
nano /opt/monitr/.env
```

Paste your production environment variables. At minimum you need:

```env
# Database (these are internal to Docker — pick strong passwords for production)
POSTGRES_USER=newsuser
POSTGRES_PASSWORD=<STRONG_RANDOM_PASSWORD>
POSTGRES_DB=newsdb

# CORS
CORS_ORIGIN=https://monitr.xyz

# News APIs (copy from your Railway env vars)
NEWS_API_KEY=<your_key>
GNEWS_API_KEY=<your_key>

# Financial
ALPHA_VANTAGE_API_KEY=<your_key>
FMP_API_KEY=<your_key>

# Social
TWITTER_BEARER_TOKEN=<your_token>
TWITTER_API_KEY=<your_key>
TWITTER_API_SECRET=<your_secret>
REDDIT_CLIENT_ID=<your_id>
REDDIT_CLIENT_SECRET=<your_secret>

# Government
FEC_API_KEY=<your_key>
CONGRESS_API_KEY=<your_key>
GOOGLE_CIVIC_API_KEY=<your_key>

# Polling intervals
NEWS_POLL_INTERVAL=300
SOCIAL_POLL_INTERVAL=60
FEED_POLL_INTERVAL=600
```

> **Get your current env vars from Railway**: `railway variables` (Railway CLI) or copy from the Railway dashboard → your service → Variables tab.

```bash
chmod 600 /opt/monitr/.env
```

---

## Step 7: Create the nginx conf.d Directory

The `docker-compose.yml` mounts `./nginx/conf.d:/etc/nginx/conf.d:ro`. Make sure the directory exists:

```bash
mkdir -p /opt/monitr/nginx/conf.d
```

The `nginx/conf.d/api.conf` file should already exist in the repo. Verify:

```bash
ls -la /opt/monitr/nginx/conf.d/api.conf
```

---

## Step 8: Obtain SSL Certificate

The deploy script handles this, but here's what it does:

```bash
cd /opt/monitr
./deploy.sh ssl
```

This will:
1. Create a temporary self-signed cert so nginx can start
2. Start all services (nginx needs backend healthy first)
3. Run Certbot with webroot challenge against `api.monitr.xyz`
4. Reload nginx with the real Let's Encrypt certificate

> **Important**: DNS must be propagated (Step 2) before this step works. Certbot validates domain ownership by making an HTTP request to `http://api.monitr.xyz/.well-known/acme-challenge/`.

### If SSL fails

```bash
# Check DNS is resolving
dig api.monitr.xyz +short

# Check port 80 is open
curl -I http://api.monitr.xyz

# Check certbot logs
docker compose logs certbot
```

---

## Step 9: Deploy the Application

```bash
cd /opt/monitr
./deploy.sh deploy
```

This runs:
1. `docker compose build --no-cache backend` — builds the Node.js backend image
2. `docker compose up -d` — starts all 5 services (backend, nginx, certbot, redis, postgres)
3. Waits 10 seconds then checks the `/health` endpoint

### Verify everything is running:

```bash
# Check all containers are up
docker compose ps

# Expected output: 5 services (backend, nginx, certbot, redis, postgres) all "Up"

# Check health endpoint
curl -s https://api.monitr.xyz/health | python3 -m json.tool

# Check logs if something is wrong
docker compose logs backend --tail=50
docker compose logs nginx --tail=50
docker compose logs postgres --tail=20
docker compose logs redis --tail=20
```

---

## Step 10: Verify Frontend Connectivity

Your frontend (on Firebase Hosting) uses these env vars from `.env.production`:

```
VITE_API_URL=https://api.monitr.xyz
VITE_WS_URL=wss://api.monitr.xyz/ws
```

Test from your browser or local machine:

```bash
# REST API
curl https://api.monitr.xyz/api/feed

# WebSocket (quick test)
npx wscat -c wss://api.monitr.xyz/ws
```

If the frontend was previously pointing at a Railway URL, **rebuild and redeploy** the frontend:

```bash
# Locally
cd frontend
VITE_API_URL=https://api.monitr.xyz VITE_WS_URL=wss://api.monitr.xyz/ws npm run build
firebase deploy --only hosting
```

---

## Step 11: Decommission Railway

Once everything is confirmed working on DigitalOcean:

1. Go to Railway dashboard
2. Remove or pause the service
3. Delete the Railway project if you no longer need it

---

## Post-Deployment: Ongoing Operations

### Update the application (after pushing new code)

```bash
ssh root@api.monitr.xyz
cd /opt/monitr
./deploy.sh update
```

This pulls latest code, rebuilds the backend, and does a rolling restart.

### View logs

```bash
./deploy.sh logs              # All services
./deploy.sh logs backend      # Backend only
./deploy.sh logs nginx        # Nginx only
```

### Check status

```bash
./deploy.sh status
```

### SSL auto-renewal

The `certbot` container in `docker-compose.yml` automatically renews certificates every 12 hours. No action needed.

### Database backup (recommended)

Add a cron job for PostgreSQL backups:

```bash
crontab -e
```

Add:
```
0 3 * * * docker exec $(docker ps -qf "name=postgres") pg_dump -U newsuser newsdb | gzip > /opt/backups/monitr-$(date +\%Y\%m\%d).sql.gz
```

```bash
mkdir -p /opt/backups
```

### Monitoring the Droplet

- **DigitalOcean Monitoring**: Enable in Droplet settings → Monitoring tab (free)
- Set alerts for: CPU > 80%, Memory > 85%, Disk > 80%

---

## Quick Reference

| Action | Command |
|--------|---------|
| SSH in | `ssh root@api.monitr.xyz` |
| Deploy | `cd /opt/monitr && ./deploy.sh deploy` |
| Update | `cd /opt/monitr && ./deploy.sh update` |
| Logs | `cd /opt/monitr && ./deploy.sh logs` |
| Status | `cd /opt/monitr && ./deploy.sh status` |
| Restart all | `cd /opt/monitr && docker compose restart` |
| Restart backend only | `cd /opt/monitr && docker compose restart backend` |
| Rebuild from scratch | `cd /opt/monitr && docker compose down && ./deploy.sh deploy` |
| PostgreSQL shell | `docker exec -it $(docker ps -qf "name=postgres") psql -U newsuser newsdb` |
| Redis CLI | `docker exec -it $(docker ps -qf "name=redis") redis-cli` |

---

## Troubleshooting

### Backend won't start
```bash
docker compose logs backend --tail=100
# Common: missing env var, postgres not ready yet (check depends_on + healthcheck)
```

### 502 Bad Gateway from nginx
```bash
# Backend isn't healthy yet — nginx can't proxy
docker compose logs backend
# Check if backend is still starting up (healthcheck has 60s start_period)
```

### SSL certificate errors
```bash
# Check certbot obtained the cert
docker compose exec certbot certbot certificates
# Re-run SSL setup
./deploy.sh ssl
```

### Out of memory
```bash
free -h
docker stats --no-stream
# Consider upgrading to a larger Droplet or tuning memory limits in docker-compose.yml
```

### Can't connect to WebSocket
```bash
# Verify wss:// endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGVzdA==" \
  https://api.monitr.xyz/ws
# Should return 101 Switching Protocols
```

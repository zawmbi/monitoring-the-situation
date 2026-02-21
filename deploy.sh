#!/usr/bin/env bash
set -euo pipefail

# ===========================================
# DigitalOcean Droplet Deploy Script
# ===========================================
#
# Usage:
#   ./deploy.sh setup     — First-time setup (install Docker, configure firewall)
#   ./deploy.sh ssl       — Obtain SSL certificates via Let's Encrypt
#   ./deploy.sh deploy    — Build and start all services
#   ./deploy.sh update    — Pull latest code, rebuild, and restart
#   ./deploy.sh logs      — Tail all service logs
#   ./deploy.sh status    — Show service status
#
# Prerequisites:
#   - Ubuntu 22.04+ Droplet
#   - monitr.xyz + api.monitr.xyz pointing to Droplet IP
#   - .env file with API keys in the project root

API_DOMAIN="${API_DOMAIN:-api.monitr.xyz}"
SITE_DOMAIN="${SITE_DOMAIN:-monitr.xyz}"
EMAIL="${CERTBOT_EMAIL:-admin@monitr.xyz}"
COMPOSE="docker compose"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
err()  { echo -e "${RED}[deploy]${NC} $1"; exit 1; }

# ── First-time Droplet setup ──
cmd_setup() {
    log "Installing Docker and Docker Compose..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker

    log "Configuring UFW firewall..."
    ufw allow OpenSSH
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable

    log "Creating nginx directories..."
    mkdir -p nginx/conf.d

    log "Setup complete. Next steps:"
    log "  1. Copy your .env file to this directory"
    log "  2. Run: ./deploy.sh deploy"
    log "  3. Run: ./deploy.sh ssl"
}

# ── Obtain SSL certificates for both domains ──
cmd_ssl() {
    log "Obtaining SSL certificates for ${SITE_DOMAIN} and ${API_DOMAIN}..."

    # Make sure services are running (nginx needs to serve ACME challenges)
    $COMPOSE up -d

    log "Waiting for services to be healthy..."
    sleep 15

    # Request cert for the main site domain
    log "Requesting certificate for ${SITE_DOMAIN}..."
    $COMPOSE run --rm certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "${SITE_DOMAIN}" \
        -d "www.${SITE_DOMAIN}" \
        --email "${EMAIL}" \
        --agree-tos \
        --non-interactive || warn "Failed to obtain cert for ${SITE_DOMAIN} — check DNS"

    # Request cert for the API subdomain
    log "Requesting certificate for ${API_DOMAIN}..."
    $COMPOSE run --rm certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "${API_DOMAIN}" \
        --email "${EMAIL}" \
        --agree-tos \
        --non-interactive || warn "Failed to obtain cert for ${API_DOMAIN} — check DNS"

    log ""
    log "SSL certificates obtained. Now you need to:"
    log "  1. Edit nginx/conf.d/default.conf — uncomment the HTTPS block"
    log "  2. Edit nginx/conf.d/api.conf — uncomment the HTTPS block"
    log "  3. Run: docker compose restart nginx"
}

# ── Build and deploy ──
cmd_deploy() {
    log "Building and starting services..."

    if [ ! -f .env ]; then
        warn "No .env file found — services will use defaults"
    fi

    $COMPOSE build --no-cache backend frontend
    $COMPOSE up -d

    log "Waiting for health check..."
    sleep 15

    if curl -sf "http://localhost/health" > /dev/null 2>&1; then
        log "Deploy successful — all services healthy"
    else
        warn "Health check failed — check logs with: ./deploy.sh logs"
    fi

    $COMPOSE ps
}

# ── Update (pull + rebuild + restart) ──
cmd_update() {
    local BRANCH="${1:-demo}"
    log "Pulling latest code from ${BRANCH}..."
    git pull origin "${BRANCH}"

    log "Rebuilding backend and frontend..."
    $COMPOSE build backend frontend

    log "Rolling restart..."
    $COMPOSE up -d --no-deps backend frontend
    sleep 10

    # Reload nginx to pick up any config changes
    $COMPOSE exec nginx nginx -s reload 2>/dev/null || true

    if curl -sf "http://localhost/health" > /dev/null 2>&1; then
        log "Update successful"
    else
        warn "Health check failed after update — check logs"
    fi

    $COMPOSE ps
}

# ── Logs ──
cmd_logs() {
    $COMPOSE logs -f --tail=100 "$@"
}

# ── Status ──
cmd_status() {
    $COMPOSE ps
    echo ""
    log "Health check:"
    curl -s "http://localhost/health" | python3 -m json.tool 2>/dev/null || echo "Health endpoint not reachable"
}

# ── Main ──
case "${1:-}" in
    setup)  cmd_setup ;;
    ssl)    cmd_ssl ;;
    deploy) cmd_deploy ;;
    update) cmd_update "${@:2}" ;;
    logs)   cmd_logs "${@:2}" ;;
    status) cmd_status ;;
    *)
        echo "Usage: $0 {setup|ssl|deploy|update|logs|status}"
        echo ""
        echo "Commands:"
        echo "  setup   — First-time Droplet setup (Docker, firewall)"
        echo "  ssl     — Obtain Let's Encrypt SSL certificates"
        echo "  deploy  — Build and start all services (backend + frontend)"
        echo "  update  — Pull, rebuild, and restart (default branch: demo)"
        echo "  logs    — Tail service logs"
        echo "  status  — Show service status and health"
        exit 1
        ;;
esac

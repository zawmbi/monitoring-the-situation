#!/usr/bin/env bash
set -euo pipefail

# ===========================================
# DigitalOcean Droplet Deploy Script
# ===========================================
#
# Usage:
#   ./deploy.sh setup     — First-time setup (install Docker, configure firewall)
#   ./deploy.sh ssl       — Obtain SSL certificate via Let's Encrypt
#   ./deploy.sh deploy    — Build and start all services
#   ./deploy.sh update    — Pull latest code, rebuild, and restart
#   ./deploy.sh logs      — Tail all service logs
#   ./deploy.sh status    — Show service status
#
# Prerequisites:
#   - Ubuntu 22.04+ Droplet
#   - Domain api.monitr.xyz pointing to Droplet IP
#   - .env file with API keys in the project root

DOMAIN="${DOMAIN:-api.monitr.xyz}"
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
    log "  2. Run: ./deploy.sh ssl"
    log "  3. Run: ./deploy.sh deploy"
}

# ── Obtain SSL certificate ──
cmd_ssl() {
    log "Obtaining SSL certificate for ${DOMAIN}..."

    # Start nginx temporarily with a self-signed cert for the ACME challenge
    mkdir -p /tmp/fake-cert
    openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
        -keyout /tmp/fake-cert/privkey.pem \
        -out /tmp/fake-cert/fullchain.pem \
        -subj "/CN=localhost" 2>/dev/null

    # Create dummy cert path so nginx can start
    $COMPOSE run --rm --entrypoint "" certbot sh -c "
        mkdir -p /etc/letsencrypt/live/${DOMAIN} &&
        cp /tmp/fake-cert/* /etc/letsencrypt/live/${DOMAIN}/
    " 2>/dev/null || true

    # Copy fake certs into the certbot volume
    docker run --rm \
        -v "$(pwd)/monitoring-the-situation_certbot-etc:/etc/letsencrypt" \
        -v "/tmp/fake-cert:/tmp/fake-cert" \
        alpine sh -c "
            mkdir -p /etc/letsencrypt/live/${DOMAIN} &&
            cp /tmp/fake-cert/* /etc/letsencrypt/live/${DOMAIN}/
        " 2>/dev/null || true

    # Start just nginx for the challenge
    $COMPOSE up -d nginx 2>/dev/null || warn "nginx may need backend — starting all services..."
    $COMPOSE up -d

    # Request the real certificate
    $COMPOSE run --rm certbot certonly \
        --webroot \
        -w /var/www/certbot \
        -d "${DOMAIN}" \
        --email "${EMAIL}" \
        --agree-tos \
        --non-interactive

    # Reload nginx with real cert
    $COMPOSE exec nginx nginx -s reload

    log "SSL certificate obtained for ${DOMAIN}"
    rm -rf /tmp/fake-cert
}

# ── Build and deploy ──
cmd_deploy() {
    log "Building and starting services..."

    if [ ! -f .env ]; then
        warn "No .env file found — services will use defaults"
    fi

    $COMPOSE build --no-cache backend
    $COMPOSE up -d

    log "Waiting for health check..."
    sleep 10

    if curl -sf "http://localhost/health" > /dev/null 2>&1; then
        log "Deploy successful — all services healthy"
    else
        warn "Health check failed — check logs with: ./deploy.sh logs"
    fi

    $COMPOSE ps
}

# ── Update (pull + rebuild + restart) ──
cmd_update() {
    log "Pulling latest code..."
    git pull origin main

    log "Rebuilding backend..."
    $COMPOSE build backend

    log "Rolling restart..."
    $COMPOSE up -d --no-deps backend
    sleep 5

    # Reload nginx to pick up any config changes
    $COMPOSE exec nginx nginx -s reload 2>/dev/null || true

    if curl -sf "http://localhost/health" > /dev/null 2>&1; then
        log "Update successful"
    else
        warn "Health check failed after update — check logs"
    fi
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
    update) cmd_update ;;
    logs)   cmd_logs "${@:2}" ;;
    status) cmd_status ;;
    *)
        echo "Usage: $0 {setup|ssl|deploy|update|logs|status}"
        echo ""
        echo "Commands:"
        echo "  setup   — First-time Droplet setup (Docker, firewall)"
        echo "  ssl     — Obtain Let's Encrypt SSL certificate"
        echo "  deploy  — Build and start all services"
        echo "  update  — Pull, rebuild, and restart"
        echo "  logs    — Tail service logs"
        echo "  status  — Show service status and health"
        exit 1
        ;;
esac

#!/usr/bin/env bash
# =============================================================================
# DocMesh — Automated Cloud Installer
# =============================================================================
# Deploys DocMesh on any Ubuntu/Debian server (AWS EC2, Azure VM, DigitalOcean
# Droplet, or bare metal). Provisions Docker, PostgreSQL, Redis, Nginx + TLS.
#
# Usage:
#   sudo ./install.sh --domain docs.example.com --email admin@example.com
#
# Options:
#   --domain        Your domain name (required)
#   --email         Email for Let's Encrypt TLS certificates (required)
#   --branch        Git branch to deploy (default: master)
#   --no-tls        Skip TLS setup (HTTP only)
#   --db-password   Custom PostgreSQL password (auto-generated if omitted)
#   --jwt-secret    Custom JWT secret (auto-generated if omitted)
#   --repo          Git repository URL (default: https://github.com/your-username/docmesh.git)
#   --install-dir   Installation directory (default: /opt/docmesh)
#   --help          Show this help message
# =============================================================================

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────────────
DOMAIN=""
EMAIL=""
BRANCH="master"
SETUP_TLS=true
DB_PASSWORD=""
JWT_SECRET=""
REPO_URL="https://github.com/your-username/docmesh.git"
INSTALL_DIR="/opt/docmesh"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No color

# ── Logging helpers ───────────────────────────────────────────────────────────
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()     { echo -e "${RED}[ERROR]${NC} $*" >&2; }
step()    { echo -e "\n${CYAN}──── $* ────${NC}"; }

# ── Parse arguments ───────────────────────────────────────────────────────────
usage() {
    echo ""
    echo "DocMesh Installer"
    echo ""
    echo "Usage: sudo ./install.sh --domain <domain> --email <email> [options]"
    echo ""
    echo "Required:"
    echo "  --domain        Your domain name (e.g. docs.example.com)"
    echo "  --email         Email for Let's Encrypt TLS certificates"
    echo ""
    echo "Optional:"
    echo "  --branch        Git branch to deploy (default: master)"
    echo "  --no-tls        Skip TLS setup (HTTP only, for testing)"
    echo "  --db-password   Custom PostgreSQL password"
    echo "  --jwt-secret    Custom JWT secret"
    echo "  --repo          Git repository URL"
    echo "  --install-dir   Installation directory (default: /opt/docmesh)"
    echo "  --help          Show this help message"
    echo ""
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)      DOMAIN="$2";      shift 2 ;;
        --email)       EMAIL="$2";       shift 2 ;;
        --branch)      BRANCH="$2";      shift 2 ;;
        --no-tls)      SETUP_TLS=false;  shift   ;;
        --db-password) DB_PASSWORD="$2"; shift 2 ;;
        --jwt-secret)  JWT_SECRET="$2";  shift 2 ;;
        --repo)        REPO_URL="$2";    shift 2 ;;
        --install-dir) INSTALL_DIR="$2"; shift 2 ;;
        --help)        usage ;;
        *)             err "Unknown option: $1"; usage ;;
    esac
done

# ── Validate ──────────────────────────────────────────────────────────────────
if [[ -z "$DOMAIN" ]]; then
    err "--domain is required"
    usage
fi

if [[ "$SETUP_TLS" == true && -z "$EMAIL" ]]; then
    err "--email is required for TLS (or use --no-tls to skip)"
    usage
fi

if [[ $EUID -ne 0 ]]; then
    err "This script must be run as root (use sudo)"
    exit 1
fi

# ── Generate secrets if not provided ──────────────────────────────────────────
if [[ -z "$DB_PASSWORD" ]]; then
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 40)
fi

if [[ -z "$JWT_SECRET" ]]; then
    JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
fi

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          DocMesh — Automated Cloud Installer        ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  Domain:      ${GREEN}$DOMAIN${NC}"
echo -e "${CYAN}║${NC}  Branch:      ${GREEN}$BRANCH${NC}"
echo -e "${CYAN}║${NC}  TLS:         ${GREEN}$SETUP_TLS${NC}"
echo -e "${CYAN}║${NC}  Install dir: ${GREEN}$INSTALL_DIR${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ══════════════════════════════════════════════════════════════════════════════
# STEP 1: System update & dependencies
# ══════════════════════════════════════════════════════════════════════════════
step "Step 1/7: Updating system packages"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban

success "System packages updated"

# ══════════════════════════════════════════════════════════════════════════════
# STEP 2: Install Docker
# ══════════════════════════════════════════════════════════════════════════════
step "Step 2/7: Installing Docker"

if command -v docker &> /dev/null; then
    info "Docker already installed: $(docker --version)"
else
    curl -fsSL https://get.docker.com | sh
    success "Docker installed: $(docker --version)"
fi

# Ensure docker compose plugin is available
if ! docker compose version &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
fi

systemctl enable docker
systemctl start docker

success "Docker is running"

# ══════════════════════════════════════════════════════════════════════════════
# STEP 3: Clone repository
# ══════════════════════════════════════════════════════════════════════════════
step "Step 3/7: Setting up DocMesh"

if [[ -d "$INSTALL_DIR" ]]; then
    warn "$INSTALL_DIR already exists — pulling latest changes"
    cd "$INSTALL_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    git clone --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

success "Repository cloned to $INSTALL_DIR"

# ══════════════════════════════════════════════════════════════════════════════
# STEP 4: Configure environment
# ══════════════════════════════════════════════════════════════════════════════
step "Step 4/7: Configuring environment"

VITE_API_URL="https://$DOMAIN/api"
if [[ "$SETUP_TLS" == false ]]; then
    VITE_API_URL="http://$DOMAIN/api"
fi

cat > "$INSTALL_DIR/.env" <<EOF
# =============================================================================
# DocMesh — Production Environment
# Generated by install.sh on $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# =============================================================================

# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=docmesh
DB_PASSWORD=$DB_PASSWORD
DB_NAME=docmesh

# Auth
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=7d

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# App
NODE_ENV=production
PORT=3000

# Frontend (build-time)
VITE_API_URL=$VITE_API_URL

# Domain
DOMAIN=$DOMAIN
EOF

chmod 600 "$INSTALL_DIR/.env"
success "Environment configured (.env created with secure permissions)"

# ── Create production docker-compose ──────────────────────────────────────────

cat > "$INSTALL_DIR/docker-compose.prod.yml" <<'COMPOSE_EOF'
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: ${DB_NAME:-docmesh}
      POSTGRES_USER: ${DB_USERNAME:-docmesh}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-docmesh}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - docmesh-internal
    # No port exposure — only accessible from the backend container

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redisdata:/data
    networks:
      - docmesh-internal
    # No port exposure — only accessible from the backend container

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - DB_HOST=${DB_HOST:-postgres}
      - DB_PORT=${DB_PORT:-5432}
      - DB_USERNAME=${DB_USERNAME:-docmesh}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME:-docmesh}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRATION=${JWT_EXPIRATION:-7d}
      - REDIS_HOST=${REDIS_HOST:-redis}
      - REDIS_PORT=${REDIS_PORT:-6379}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - docmesh-internal
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=${VITE_API_URL:-/api}
    restart: always
    ports:
      - "127.0.0.1:8080:80"
    depends_on:
      - backend
    networks:
      - docmesh-internal
    logging:
      driver: json-file
      options:
        max-size: "5m"
        max-file: "3"

volumes:
  pgdata:
  redisdata:

networks:
  docmesh-internal:
    driver: bridge
COMPOSE_EOF

success "Production docker-compose.prod.yml created"

# ── Create backup directory ───────────────────────────────────────────────────
mkdir -p "$INSTALL_DIR/backups"

# ══════════════════════════════════════════════════════════════════════════════
# STEP 5: Build and start containers
# ══════════════════════════════════════════════════════════════════════════════
step "Step 5/7: Building and starting containers"

cd "$INSTALL_DIR"
docker compose -f docker-compose.prod.yml up --build -d

# Wait for backend to be ready
info "Waiting for backend to start..."
RETRIES=30
for i in $(seq 1 $RETRIES); do
    if docker compose -f docker-compose.prod.yml exec -T backend wget -qO- http://localhost:3000/api/docs 2>/dev/null | head -1 | grep -q "<!DOCTYPE"; then
        break
    fi
    if [[ $i -eq $RETRIES ]]; then
        warn "Backend may still be starting — check logs with: docker compose -f $INSTALL_DIR/docker-compose.prod.yml logs backend"
    fi
    sleep 2
done

success "All containers are running"
docker compose -f docker-compose.prod.yml ps

# ══════════════════════════════════════════════════════════════════════════════
# STEP 6: Configure Nginx + TLS
# ══════════════════════════════════════════════════════════════════════════════
step "Step 6/7: Configuring Nginx reverse proxy"

apt-get install -y -qq nginx

# ── Nginx config (HTTP) ──────────────────────────────────────────────────────
cat > "/etc/nginx/sites-available/docmesh" <<NGINX_EOF
# DocMesh — Nginx reverse proxy
# Generated by install.sh

server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Max upload size (for asset uploads)
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # WebSocket support (for future real-time features)
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "ok";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF

# Enable the site
ln -sf /etc/nginx/sites-available/docmesh /etc/nginx/sites-enabled/docmesh
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

success "Nginx configured (HTTP)"

# ── TLS with Certbot ─────────────────────────────────────────────────────────
if [[ "$SETUP_TLS" == true ]]; then
    info "Setting up TLS with Let's Encrypt..."

    apt-get install -y -qq certbot python3-certbot-nginx

    certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domain "$DOMAIN" \
        --redirect

    # Verify auto-renewal timer
    systemctl enable certbot.timer
    systemctl start certbot.timer

    success "TLS certificate installed and auto-renewal enabled"
else
    warn "TLS skipped (--no-tls). Site accessible via HTTP only."
fi

# ══════════════════════════════════════════════════════════════════════════════
# STEP 7: Firewall & systemd service
# ══════════════════════════════════════════════════════════════════════════════
step "Step 7/7: Securing server"

# ── UFW Firewall ──────────────────────────────────────────────────────────────
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw --force enable

success "Firewall configured (SSH, HTTP, HTTPS only)"

# ── Systemd service for auto-start ───────────────────────────────────────────
cat > /etc/systemd/system/docmesh.service <<SERVICE_EOF
[Unit]
Description=DocMesh CCMS
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=120

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
systemctl enable docmesh.service

success "Systemd service installed (auto-starts on boot)"

# ── Daily backup cron ─────────────────────────────────────────────────────────
CRON_LINE="0 2 * * * docker exec \$(docker ps -qf name=documesh-postgres) pg_dump -U docmesh docmesh | gzip > $INSTALL_DIR/backups/docmesh-\$(date +\\%Y\\%m\\%d).sql.gz && find $INSTALL_DIR/backups -name '*.sql.gz' -mtime +30 -delete"

(crontab -l 2>/dev/null || true; echo "$CRON_LINE") | sort -u | crontab -

success "Daily database backup configured (2 AM, 30-day retention)"

# ══════════════════════════════════════════════════════════════════════════════
# DONE
# ══════════════════════════════════════════════════════════════════════════════
PROTO="https"
if [[ "$SETUP_TLS" == false ]]; then
    PROTO="http"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        DocMesh installed successfully!               ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Web UI:       ${CYAN}$PROTO://$DOMAIN${NC}"
echo -e "${GREEN}║${NC}  API:          ${CYAN}$PROTO://$DOMAIN/api${NC}"
echo -e "${GREEN}║${NC}  Swagger:      ${CYAN}$PROTO://$DOMAIN/api/docs${NC}"
echo -e "${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  Install dir:  ${CYAN}$INSTALL_DIR${NC}"
echo -e "${GREEN}║${NC}  Config:       ${CYAN}$INSTALL_DIR/.env${NC}"
echo -e "${GREEN}║${NC}  Backups:      ${CYAN}$INSTALL_DIR/backups/${NC}"
echo -e "${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${YELLOW}Next steps:${NC}"
echo -e "${GREEN}║${NC}    1. Open ${CYAN}$PROTO://$DOMAIN${NC} and register your first account"
echo -e "${GREEN}║${NC}    2. The first registered user becomes the org admin"
echo -e "${GREEN}║${NC}    3. Invite team members from the Team page"
echo -e "${GREEN}║${NC}"
echo -e "${GREEN}║${NC}  ${YELLOW}Useful commands:${NC}"
echo -e "${GREEN}║${NC}    Logs:      ${CYAN}docker compose -f $INSTALL_DIR/docker-compose.prod.yml logs -f${NC}"
echo -e "${GREEN}║${NC}    Restart:   ${CYAN}systemctl restart docmesh${NC}"
echo -e "${GREEN}║${NC}    Backup:    ${CYAN}docker exec \$(docker ps -qf name=postgres) pg_dump -U docmesh docmesh > backup.sql${NC}"
echo -e "${GREEN}║${NC}    Update:    ${CYAN}cd $INSTALL_DIR && git pull && docker compose -f docker-compose.prod.yml up --build -d${NC}"
echo -e "${GREEN}║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

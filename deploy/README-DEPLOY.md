# DocMesh — Deployment Guide

Complete deployment instructions for AWS, Azure, DigitalOcean, and bare metal servers.

---

## Table of Contents

- [Requirements](#requirements)
- [Automated Installer](#automated-installer)
- [Deploy on AWS EC2](#deploy-on-aws-ec2)
- [Deploy on Azure VM](#deploy-on-azure-vm)
- [Deploy on DigitalOcean](#deploy-on-digitalocean)
- [Manual Deployment](#manual-deployment)
- [Using Managed Databases](#using-managed-databases)
- [Updating DocMesh](#updating-docmesh)
- [Backup & Restore](#backup--restore)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 1 vCPU | 2 vCPU |
| **RAM** | 2 GB | 4 GB |
| **Disk** | 20 GB | 40 GB SSD |
| **Ports** | 22, 80, 443 | 22, 80, 443 |

The installer supports any **Debian/Ubuntu** based system. For other distros, use the [Manual Deployment](#manual-deployment) section.

---

## Automated Installer

The `install.sh` script is a one-command installer that works on any supported server:

```bash
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

### What it does

1. Updates system packages and installs dependencies (`curl`, `git`, `ufw`, `fail2ban`)
2. Installs Docker Engine + Docker Compose plugin
3. Clones the DocMesh repository to `/opt/docmesh`
4. Generates cryptographically secure passwords for PostgreSQL and JWT
5. Creates a production `.env` file with secure permissions (600)
6. Creates a hardened `docker-compose.prod.yml` (no exposed DB ports, log rotation, restart policies)
7. Builds and starts all 4 containers
8. Installs and configures Nginx as a reverse proxy
9. Obtains a free TLS certificate from Let's Encrypt via Certbot
10. Configures UFW firewall (allows only SSH, HTTP, HTTPS)
11. Registers a systemd service for auto-start on reboot
12. Sets up a daily database backup cron job (2 AM, 30-day retention)

### Installer options

| Flag | Description | Default |
|---|---|---|
| `--domain` | Your domain name | *Required* |
| `--email` | Email for Let's Encrypt | *Required* |
| `--branch` | Git branch to deploy | `master` |
| `--no-tls` | Skip TLS (HTTP only) | TLS enabled |
| `--db-password` | PostgreSQL password | Auto-generated |
| `--jwt-secret` | JWT signing secret | Auto-generated |
| `--repo` | Git repository URL | Default repo |
| `--install-dir` | Installation path | `/opt/docmesh` |

---

## Deploy on AWS EC2

### Step 1: Launch an EC2 Instance

1. Open the [EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **Launch Instance**
3. Configure:
   - **Name:** `docmesh-server`
   - **AMI:** Ubuntu Server 22.04 LTS (HVM, SSD) — `ami-0c7217cdde317cfec` (us-east-1)
   - **Instance type:** `t3.small` (2 vCPU, 2 GB RAM) — minimum. Use `t3.medium` for production.
   - **Key pair:** Create or select an existing SSH key pair
   - **Storage:** 20 GB gp3 (increase to 40+ for production)
   - **Security Group:** Create a new SG with:

| Type | Protocol | Port | Source | Description |
|---|---|---|---|---|
| SSH | TCP | 22 | My IP | Server access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | Secure web traffic |

4. Click **Launch Instance**

### Step 2: Allocate an Elastic IP

1. Go to **Elastic IPs** in the EC2 console
2. Click **Allocate Elastic IP address**
3. Associate it with your EC2 instance
4. Note the IP address (e.g., `54.123.45.67`)

### Step 3: Configure DNS

In your DNS provider, create an A record:

```
docs.yourcompany.com  →  A  →  54.123.45.67
```

Wait for DNS propagation (usually 1–5 minutes).

### Step 4: Install DocMesh

```bash
# SSH into the instance
ssh -i your-key.pem ubuntu@54.123.45.67

# Download and run the installer
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

### Step 5: Verify

```bash
# Check containers
docker compose -f /opt/docmesh/docker-compose.prod.yml ps

# Check backend logs
docker compose -f /opt/docmesh/docker-compose.prod.yml logs backend --tail 20

# Test the API
curl -s https://docs.yourcompany.com/api/docs | head -5
```

### AWS Production Tips

- **Elastic IP:** Always attach one so the address persists across stop/start cycles
- **Load Balancer:** For HA, put the instance behind an **Application Load Balancer (ALB)** and terminate TLS there instead of Certbot
- **RDS:** Replace the containerized PostgreSQL with **Amazon RDS for PostgreSQL** (see [Using Managed Databases](#using-managed-databases))
- **ElastiCache:** Replace the containerized Redis with **Amazon ElastiCache for Redis**
- **Secrets Manager:** Store `JWT_SECRET` and `DB_PASSWORD` in AWS Secrets Manager
- **CloudWatch:** Forward Docker container logs to CloudWatch Logs
- **Auto Scaling:** For higher traffic, put the backend behind an ASG with the web tier on CloudFront

---

## Deploy on Azure VM

### Step 1: Create a Virtual Machine

1. Open the [Azure Portal](https://portal.azure.com)
2. Search for **Virtual Machines** → **Create**
3. Configure:
   - **Resource group:** Create `docmesh-rg`
   - **VM name:** `docmesh-server`
   - **Region:** Choose closest to users
   - **Image:** Ubuntu Server 22.04 LTS — Gen2
   - **Size:** `Standard_B2s` (2 vCPU, 4 GB) — minimum
   - **Authentication:** SSH public key (recommended)
   - **Username:** `azureuser`

4. **Networking:** Select or create a Virtual Network. Create an NSG with:

| Priority | Name | Port | Protocol | Source | Action |
|---|---|---|---|---|---|
| 100 | AllowSSH | 22 | TCP | My IP | Allow |
| 110 | AllowHTTP | 80 | TCP | Any | Allow |
| 120 | AllowHTTPS | 443 | TCP | Any | Allow |

5. **Disks:** 32 GB Premium SSD
6. **Review + Create** → **Create**

### Step 2: Assign a Static Public IP

1. Go to the VM's **Networking** settings
2. Click on the **Public IP address**
3. Change **Assignment** to **Static**
4. Note the IP address (e.g., `20.85.123.45`)

### Step 3: Configure DNS

Create an A record:

```
docs.yourcompany.com  →  A  →  20.85.123.45
```

### Step 4: Install DocMesh

```bash
ssh azureuser@20.85.123.45

curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

### Step 5: Verify

```bash
docker compose -f /opt/docmesh/docker-compose.prod.yml ps
curl -s https://docs.yourcompany.com/api/docs | head -5
```

### Azure Production Tips

- **Static IP:** Essential — dynamic IPs change on VM deallocation
- **Azure Database for PostgreSQL — Flexible Server:** Managed PostgreSQL with automatic backups, HA, and read replicas
- **Azure Cache for Redis:** Managed Redis with persistence
- **Azure Key Vault:** Store secrets securely
- **Azure Monitor + Log Analytics:** Container health monitoring and log aggregation
- **App Service / Container Instances:** For a managed PaaS experience without VM management
- **Azure Front Door:** Global load balancing + CDN + WAF

---

## Deploy on DigitalOcean

### Step 1: Create a Droplet

1. Open [DigitalOcean Cloud Console](https://cloud.digitalocean.com/droplets)
2. Click **Create Droplet**
3. Configure:
   - **Region:** Choose closest to users
   - **Image:** Ubuntu 22.04 (LTS)
   - **Plan:** Basic
     - **$12/month** (2 GB RAM, 1 vCPU, 50 GB SSD) — minimum
     - **$24/month** (4 GB RAM, 2 vCPU, 80 GB SSD) — recommended
   - **Authentication:** SSH key (recommended)
   - **Hostname:** `docmesh-server`
   - **Enable backups:** Recommended ($2.40/month extra)
4. Click **Create Droplet**

### Step 2: Configure DNS

In **Networking** → **Domains** (or your registrar):

```
docs.yourcompany.com  →  A  →  157.230.xx.xx
```

### Step 3: Install DocMesh

```bash
ssh root@157.230.xx.xx

curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

> Note: On DigitalOcean, you typically SSH as `root`, so `sudo` is not needed.

### Step 4: Verify

```bash
docker compose -f /opt/docmesh/docker-compose.prod.yml ps
curl -s https://docs.yourcompany.com/api/docs | head -5
```

### DigitalOcean Production Tips

- **Cloud Firewalls:** Add a DO Cloud Firewall as an extra network layer (in addition to UFW)
- **Managed PostgreSQL:** $15/month — automatic backups, failover, connection pooling
- **Managed Redis:** $10/month — high availability with automatic failover
- **DO Spaces:** S3-compatible object storage for asset files
- **Monitoring:** Enable the built-in Monitoring agent in the Droplet dashboard
- **App Platform:** For a fully managed PaaS (push-to-deploy from Git)
- **Load Balancers:** $12/month — distribute traffic across multiple droplets

---

## Manual Deployment

If you prefer not to use the automated installer:

### 1. Install Docker

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

### 2. Clone the repository

```bash
sudo git clone https://github.com/your-username/docmesh.git /opt/docmesh
cd /opt/docmesh
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with production values:

```bash
# IMPORTANT: Generate secure random values
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 40)
JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)

echo "DB_PASSWORD=$DB_PASSWORD"
echo "JWT_SECRET=$JWT_SECRET"
```

Update `.env`:
```
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=docmesh
DB_PASSWORD=<paste generated password>
DB_NAME=docmesh
JWT_SECRET=<paste generated secret>
JWT_EXPIRATION=7d
REDIS_HOST=redis
REDIS_PORT=6379
NODE_ENV=production
PORT=3000
VITE_API_URL=https://docs.yourcompany.com/api
```

### 4. Copy production compose file

```bash
cp deploy/docker-compose.prod.yml .
```

### 5. Build and start

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### 6. Set up Nginx

```bash
sudo apt install -y nginx
sudo cp deploy/nginx-ssl.conf /etc/nginx/sites-available/docmesh

# Replace $DOMAIN with your actual domain
sudo sed -i 's/\$DOMAIN/docs.yourcompany.com/g' /etc/nginx/sites-available/docmesh

sudo ln -sf /etc/nginx/sites-available/docmesh /etc/nginx/sites-enabled/docmesh
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Set up TLS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx --domain docs.yourcompany.com --email admin@yourcompany.com
```

### 8. Configure firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Using Managed Databases

For production, replace the containerized PostgreSQL/Redis with managed services:

### AWS RDS / Azure Database / DO Managed Database

1. Create a managed PostgreSQL 16 instance
2. Note the host, port, username, password, and database name
3. Update `/opt/docmesh/.env`:

```
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_USERNAME=docmesh
DB_PASSWORD=your-managed-db-password
DB_NAME=docmesh
```

4. Remove the `postgres` service from `docker-compose.prod.yml`
5. Remove the `depends_on: postgres` from the `backend` service
6. Rebuild: `docker compose -f docker-compose.prod.yml up --build -d`

### Managed Redis

Same process — update `REDIS_HOST` and `REDIS_PORT` in `.env`, remove the `redis` service from compose.

---

## Updating DocMesh

```bash
cd /opt/docmesh

# Pull latest code
git pull origin master

# Rebuild and restart (zero-downtime)
docker compose -f docker-compose.prod.yml up --build -d

# Verify
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend --tail 20
```

TypeORM's `synchronize: true` handles schema migrations automatically in the current version. For production environments with critical data, consider disabling this and running migrations manually.

---

## Backup & Restore

### Manual backup

```bash
# Backup database
docker exec $(docker ps -qf name=postgres) pg_dump -U docmesh docmesh > backup.sql

# Backup with compression
docker exec $(docker ps -qf name=postgres) pg_dump -U docmesh docmesh | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore from backup

```bash
# Restore from SQL file
cat backup.sql | docker exec -i $(docker ps -qf name=postgres) psql -U docmesh docmesh

# Restore from compressed backup
gunzip -c backup-20260322.sql.gz | docker exec -i $(docker ps -qf name=postgres) psql -U docmesh docmesh
```

### Automated backups

The installer sets up a daily cron job at 2 AM that:
- Dumps the database to `/opt/docmesh/backups/docmesh-YYYYMMDD.sql.gz`
- Deletes backups older than 30 days

To verify: `crontab -l`

---

## Monitoring

### Health check

```bash
# Quick check — expect HTTP 401 (unauthorized = backend is running)
curl -s -o /dev/null -w "%{http_code}" https://docs.yourcompany.com/api/auth/profile
# Expected: 401

# Nginx health endpoint
curl https://docs.yourcompany.com/health
# Expected: ok
```

### Container status

```bash
docker compose -f /opt/docmesh/docker-compose.prod.yml ps
docker compose -f /opt/docmesh/docker-compose.prod.yml stats --no-stream
```

### Logs

```bash
# All services
docker compose -f /opt/docmesh/docker-compose.prod.yml logs -f

# Backend only
docker compose -f /opt/docmesh/docker-compose.prod.yml logs -f backend

# Last 100 lines
docker compose -f /opt/docmesh/docker-compose.prod.yml logs --tail 100 backend
```

### Disk usage

```bash
# Docker disk usage
docker system df

# Database volume size
du -sh /var/lib/docker/volumes/docmesh_pgdata
```

---

## Troubleshooting

### Containers won't start

```bash
# Check if Docker is running
systemctl status docker

# Check compose logs
docker compose -f /opt/docmesh/docker-compose.prod.yml logs

# Check if port 8080 is in use
ss -tlnp | grep 8080
```

### Backend can't connect to PostgreSQL

```bash
# Check if postgres is healthy
docker compose -f /opt/docmesh/docker-compose.prod.yml exec postgres pg_isready -U docmesh

# Check env variables
docker compose -f /opt/docmesh/docker-compose.prod.yml exec backend env | grep DB_
```

### TLS certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check auto-renewal timer
systemctl status certbot.timer
```

### Nginx 502 Bad Gateway

The web container isn't responding. Check:

```bash
docker compose -f /opt/docmesh/docker-compose.prod.yml ps web
docker compose -f /opt/docmesh/docker-compose.prod.yml logs web --tail 50
```

### Reset everything

```bash
cd /opt/docmesh
docker compose -f docker-compose.prod.yml down -v  # WARNING: destroys data
docker compose -f docker-compose.prod.yml up --build -d
```

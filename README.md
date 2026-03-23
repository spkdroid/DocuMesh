<p align="center">
  <img src="web/public/docmesh.svg" alt="DocMesh" width="100" />
</p>

<h1 align="center">DocMesh</h1>

<p align="center">
  <strong>The open-source Component Content Management System</strong><br/>
  Structure. Reuse. Publish. Deliver — at scale.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white" alt="NestJS" /></a>
  <a href="#"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="PRs Welcome" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#highlights">Highlights</a> &middot;
  <a href="#everything-we-built">Features</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#api-reference">API</a> &middot;
  <a href="#deployment">Deployment</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

---

## What is DocMesh?

**DocMesh** is an open-source CCMS (Component Content Management System) built for developers, technical writers, and product teams. It breaks documentation into **reusable, structured DITA components** and delivers them through a REST API — making it the backbone for in-app help systems, developer docs, customer support portals, knowledge bases, and any application that needs dynamic, multi-channel content delivery.

Inspired by enterprise systems like SDL Tridion Docs, IXIASOFT CCMS, and Paligo — DocMesh brings the same structured authoring, content reuse, and multi-channel publishing model to an **open, modern, API-first stack**.

> **77 features** across 8 modules. One `docker compose up` — or use the automated installer to deploy to **AWS**, **Azure**, or **DigitalOcean**.

---

## Highlights

- **🏗️ Full DITA Content Model** — Topics, tasks, concepts, references, glossary entries, and troubleshooting as first-class types with prolog, shortdesc, body sections, and related links
- **✏️ DITA Structured Authoring** — Type-aware editing with DITA element labels (`<conbody>`, `<prereq>`, `<steps>`, etc.), collapsible sections, and live DITA XML preview with copy-to-clipboard
- **♻️ True Content Reuse** — conref, conkeyref, key maps, variables, content fragments, where-used tracking, and dependency graph analysis
- **📚 DITA Maps & Publishing** — Hierarchical maps, bookmaps, nested maps, DITAVAL conditional profiling, and multi-format output (HTML5, PDF, JSON)
- **🔀 Branching & Versioning** — Content branches, diff engine, three-way merge with conflict detection, baselines, releases, and rollback
- **📝 Review Workflows** — Configurable state-machine workflows, reviewer assignment, inline comments, approval gates, audit trail, and notifications
- **🌍 Localization & Translation** — Multi-locale with fallback chains, XLIFF import/export, translation jobs, TMS integration, and source change detection
- **🔐 Enterprise Access Control** — RBAC, user groups, folder-level permissions, API key management with scoped access
- **🏷️ Taxonomy & Search** — Hierarchical taxonomy terms, content tagging, PostgreSQL full-text search, and faceted filtering
- **🔗 Integrations & Automation** — Webhooks with HMAC signing, event logging, asset management, content comparison, batch operations, and soft delete with trash
- **✏️ Rich Block Editor** — TipTap/ProseMirror with tables, highlights, sub/superscript, placeholders, and structured authoring extensions
- **🐳 One-Command Deploy** — Full stack (PostgreSQL, Redis, NestJS, React + Nginx) via Docker Compose, with automated cloud installers for AWS, Azure, and DigitalOcean

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- (For local development) Node.js 20+, PostgreSQL 16

### Option 1 — Docker (recommended)

```bash
git clone https://github.com/your-username/docmesh.git
cd docmesh

# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker compose up --build
```

Once running:

| Service | URL |
|---|---|
| **Web UI** | http://localhost:8080 |
| **API** | http://localhost:3000/api |
| **Swagger Docs** | http://localhost:3000/api/docs |

### Option 2 — Automated Cloud Installer

Deploy to any cloud server with a single command:

```bash
# Download the installer
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh

# Run with your domain
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

The installer automatically provisions Docker, PostgreSQL, Redis, TLS certificates (Let's Encrypt), and an Nginx reverse proxy. See [Deployment](#deployment) for full cloud guides.

### Option 3 — Local Development

```bash
git clone https://github.com/your-username/docmesh.git
cd docmesh
```

**Start the database:**

```bash
docker compose up postgres redis -d
```

**Start the backend:**

```bash
cd backend
npm install
npm run start:dev
# API available at http://localhost:3000/api
```

**Start the frontend:**

```bash
cd web
npm install
npm run dev
# UI available at http://localhost:5173
```

---

## Project Structure

```
docmesh/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── auth/            # Authentication (JWT, register, login)
│   │   ├── content/         # Content CRUD, versioning, DITA sections
│   │   ├── delivery/        # Public content delivery API
│   │   ├── maps/            # DITA Maps, MapEntries, DITAVAL profiles
│   │   ├── organizations/   # Multi-tenant org management
│   │   ├── publications/    # Publication trees, publishing profiles
│   │   ├── reuse/           # Conrefs, content references, key maps
│   │   ├── users/           # User management, invitations
│   │   ├── workflows/       # Review workflows, notifications
│   │   ├── localization/    # XLIFF, translation jobs, locales
│   │   ├── taxonomy/        # Hierarchical terms, tagging
│   │   ├── search/          # Full-text search, faceted filtering
│   │   ├── branching/       # Branches, diff, merge, baselines
│   │   ├── integrations/    # Webhooks, API keys, assets, trash
│   │   └── common/          # Guards, decorators, utilities
│   └── Dockerfile
├── web/                     # React + TipTap frontend
│   ├── src/
│   │   ├── components/      # Editor, Layout, DITA toolbar
│   │   ├── pages/           # Dashboard, ContentEditor, Publications,
│   │   │                    # Reviews, Team, Login, Register
│   │   └── contexts/        # Auth context
│   └── Dockerfile
├── deploy/                  # Deployment automation
│   ├── install.sh           # Universal cloud installer (Bash)
│   ├── docker-compose.prod.yml  # Production Docker Compose
│   ├── nginx-ssl.conf       # Nginx + TLS template
│   └── README-DEPLOY.md     # Detailed deployment guide
├── docker-compose.yml       # Local development orchestration
├── .env.example             # Environment variable template
└── ARCHITECTURE_ROADMAP.md  # Architecture decision document
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | **NestJS 10** (TypeScript 5.x) |
| Database | **PostgreSQL 16** (JSONB for content bodies, full-text search) |
| ORM | **TypeORM 0.3** |
| Auth | **Passport + JWT** (org-scoped, RBAC) |
| Cache | **Redis 7** |
| Frontend | **React 18 + TipTap** (ProseMirror-based DITA editor) |
| Build | **Vite 5** |
| Containerization | **Docker + Docker Compose** |
| Reverse Proxy | **Nginx** (SPA routing + API proxy + TLS) |

---

## Everything We Built

DocMesh ships **77 features** across 8 phases:

### Phase 1 — Foundation
Content model (6 DITA types), CRUD API, automatic version history, JWT auth with org scoping, TipTap rich text editor, content delivery API, publications with hierarchical entries, Swagger docs, Docker Compose.

### Phase 2 — Content Reuse & Structure
Conref/conkeyref content references (embed, link, conref types), where-used tracking, dependency graph, DITA maps (MAP, BOOKMAP), map entries (TOPICREF, CHAPTER, PART, APPENDIX, FRONTMATTER, BACKMATTER, MAPREF), DITAVAL conditional profiling, content variables, key maps, content fragments.

### Phase 3 — Publishing & Output
Publishing profiles, multi-format output (HTML5, PDF, JSON), DITAVAL filtering at publish time, hierarchical publication trees with ordered entries, public delivery API with locale/platform filtering.

### Phase 4 — Branching & Versioning
Content branches (create, merge, delete), three-way diff engine, merge with conflict detection, baselines, releases, rollback, version comparison.

### Phase 5 — Review Workflows & Collaboration
State-machine workflows (draft → in_review → published → archived), reviewer assignment from org members, inline comments with resolve/reopen, approval gates, review task dashboard, real-time notifications, audit trail.

### Phase 6 — Localization & Translation
Multi-locale content with fallback chains, XLIFF import/export, translation jobs, TMS integration hooks, source change detection, locale-aware delivery.

### Phase 7 — Taxonomy, Search & Access Control
Hierarchical taxonomy terms, content tagging, PostgreSQL full-text search, faceted filtering, RBAC (admin/author/reviewer/viewer), user groups, folder-level permissions, API key management with scoped access.

### Phase 8 — Integrations & Automation
Webhooks with HMAC signing, event logging, asset management (upload, metadata, versioning), content comparison, batch operations, soft delete with trash and restore, external integration endpoints.

---

## API Reference

All authenticated endpoints require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register user + org | No |
| `POST` | `/api/auth/login` | Get access token | No |
| `GET` | `/api/auth/profile` | Current user info | Yes |

### Content

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/content` | List items (filtered, paginated) | Yes |
| `POST` | `/api/content` | Create content item | Yes |
| `GET` | `/api/content/:id` | Get single item | Yes |
| `PATCH` | `/api/content/:id` | Update item | Yes |
| `DELETE` | `/api/content/:id` | Delete item | Yes |
| `GET` | `/api/content/:id/versions` | Version history | Yes |

### DITA Maps

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/maps` | List maps | Yes |
| `POST` | `/api/maps` | Create map (MAP/BOOKMAP) | Yes |
| `GET` | `/api/maps/:id` | Get map with entries | Yes |
| `POST` | `/api/maps/:id/entries` | Add map entry | Yes |
| `PATCH` | `/api/maps/entries/:id` | Update entry | Yes |
| `DELETE` | `/api/maps/entries/:id` | Remove entry | Yes |

### Publications

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/publications` | List publications | Yes |
| `POST` | `/api/publications` | Create publication | Yes |
| `GET` | `/api/publications/:id` | Get with content tree | Yes |
| `DELETE` | `/api/publications/:id` | Delete publication | Yes |
| `POST` | `/api/publications/:id/entries` | Add entry | Yes |
| `DELETE` | `/api/publications/:id/entries/:eid` | Remove entry | Yes |

### Review Workflows

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/workflows/reviews` | Submit content for review | Yes |
| `GET` | `/api/workflows/reviews` | My review tasks | Yes |
| `GET` | `/api/workflows/reviews/all` | All org review tasks | Yes |
| `PATCH` | `/api/workflows/reviews/:id` | Update review (approve/reject) | Yes |
| `GET` | `/api/workflows/reviews/dashboard` | Review dashboard stats | Yes |

### Users & Teams

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users` | List org members | Yes |
| `POST` | `/api/users/invite` | Invite user to org | Yes |

### Delivery (Public)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/deliver/:slug?lang=en&platform=web` | Fetch published content | No |

> Full interactive documentation available at `/api/docs` (Swagger UI) — **100+ endpoints** across all modules.

---

## DITA Structured Authoring

The content editor provides **type-aware DITA structured authoring** with element-level guidance:

| Content Type | DITA Root | Sections |
|---|---|---|
| **Topic** | `<topic>` | `<body>` |
| **Concept** | `<concept>` | `<conbody>` |
| **Task** | `<task>` | `<context>`, `<prereq>`, `<steps>`, `<result>`, `<postreq>`, `<example>` |
| **Reference** | `<reference>` | `<refbody>`, `<refsyn>`, `<properties>` |
| **Glossary** | `<glossentry>` | `<glossdef>` |
| **Troubleshooting** | `<troubleshooting>` | `<condition>`, `<cause>`, `<remedy>` |

Each section shows its DITA XML element tag, has a contextual hint, and can be collapsed. The **DITA XML** tab provides a live preview of the generated XML with copy-to-clipboard.

---

## Content Model

DocMesh stores content as structured components:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "reset-password",
  "type": "task",
  "title": "Reset Password",
  "shortDescription": "Steps to reset a forgotten password",
  "body": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Open the app and tap Forgot Password." }]
      }
    ]
  },
  "metadata": {
    "audience": "end-user",
    "platform": ["web", "mobile"],
    "ditaSections": {
      "context": { "type": "doc", "content": [] },
      "prereq": { "type": "doc", "content": [] }
    }
  },
  "prolog": {
    "author": "Jane Doe",
    "keywords": ["password", "reset", "account"],
    "audience": "end-user"
  },
  "status": "published",
  "locale": "en",
  "version": 3
}
```

**Content types:** `topic` · `concept` · `task` · `reference` · `glossary` · `troubleshooting`

**Statuses:** `draft` → `in_review` → `published` → `archived`

---

## Architecture

```
┌─────────────────────┐       ┌─────────────────────┐
│   React + TipTap    │       │  Consumer Apps       │
│  (DITA Structured   │       │  (Web/Mobile/API)    │
│   Authoring Editor) │       │                      │
└─────────┬───────────┘       └───────────┬──────────┘
          │  :8080 (nginx)                │
          ▼                               ▼
┌─────────────────────────────────────────────────────┐
│            Nginx Reverse Proxy (TLS)                │
│       /         → SPA (React)                       │
│       /api/     → Backend                           │
└──────────────────────┬──────────────────────────────┘
                       │  :3000
                       ▼
┌─────────────────────────────────────────────────────┐
│                NestJS Backend API                    │
│                                                     │
│  Auth · Content · Maps · Reuse · Publications       │
│  Workflows · Localization · Taxonomy · Search       │
│  Branching · Integrations · Delivery                │
└────────┬──────────────────────┬─────────────────────┘
         │                      │
         ▼                      ▼
   PostgreSQL 16           Redis 7
  (Content, Users,       (Cache, Sessions,
   Maps, Workflows)       Notifications)
```

For a detailed architecture comparison and roadmap, see [ARCHITECTURE_ROADMAP.md](ARCHITECTURE_ROADMAP.md).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `docmesh` | Database user |
| `DB_PASSWORD` | `docmesh_secret` | Database password — **change in production** |
| `DB_NAME` | `docmesh` | Database name |
| `JWT_SECRET` | `dev-secret-change-me` | **Must change in production** — use 64+ char random string |
| `JWT_EXPIRATION` | `7d` | Token expiry |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `PORT` | `3000` | Backend listening port |
| `NODE_ENV` | `development` | `development` or `production` |
| `VITE_API_URL` | `http://localhost:3000/api` | API base URL (build-time, frontend) |

---

## Deployment

DocMesh includes an **automated installer** (`deploy/install.sh`) that handles provisioning on any Linux server. It works on **AWS EC2**, **Azure VMs**, **DigitalOcean Droplets**, and any Ubuntu/Debian server with SSH access.

### What the installer does

1. Installs Docker Engine and Docker Compose (if not present)
2. Clones the DocMesh repository
3. Generates secure random passwords for PostgreSQL and JWT
4. Creates a production `.env` file
5. Configures Nginx with TLS via Let's Encrypt (Certbot)
6. Builds and starts all containers with `docker compose`
7. Sets up a systemd service for auto-restart on reboot
8. Configures UFW firewall (allows only 80, 443, 22)

### Quick deploy (any server)

```bash
# SSH into your server, then run:
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

### Installer options

| Flag | Description | Required |
|---|---|---|
| `--domain` | Your domain name (e.g. `docs.example.com`) | Yes |
| `--email` | Email for Let's Encrypt TLS certificates | Yes |
| `--branch` | Git branch to deploy (default: `master`) | No |
| `--no-tls` | Skip TLS setup (HTTP only, for testing) | No |
| `--db-password` | Custom PostgreSQL password (auto-generated if omitted) | No |
| `--jwt-secret` | Custom JWT secret (auto-generated if omitted) | No |

---

### Deploy on AWS (EC2)

#### 1. Launch an EC2 instance

- **AMI:** Ubuntu 22.04 LTS (or 24.04)
- **Instance type:** `t3.small` (2 vCPU, 2 GB RAM) minimum — `t3.medium` recommended for production
- **Storage:** 20 GB gp3 minimum
- **Security Group rules:**

| Type | Port | Source | Purpose |
|---|---|---|---|
| SSH | 22 | Your IP | Server access |
| HTTP | 80 | 0.0.0.0/0 | Web + Let's Encrypt |
| HTTPS | 443 | 0.0.0.0/0 | Web (TLS) |

#### 2. Point your domain

Create an **A record** in your DNS provider pointing to the EC2 **Elastic IP**:

```
docs.yourcompany.com  →  A  →  54.xxx.xxx.xxx
```

#### 3. SSH in and install

```bash
ssh -i your-key.pem ubuntu@54.xxx.xxx.xxx

curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

#### 4. Verify

```bash
# Check all containers are running
docker compose -f /opt/docmesh/docker-compose.prod.yml ps

# Check logs
docker compose -f /opt/docmesh/docker-compose.prod.yml logs -f backend
```

Open `https://docs.yourcompany.com` in your browser.

#### AWS tips

- Attach an **Elastic IP** so the address survives reboots
- For high availability, put the instance behind an **ALB** (Application Load Balancer) and use **RDS PostgreSQL** instead of the containerized database
- Use **AWS Secrets Manager** for `JWT_SECRET` and `DB_PASSWORD`
- Enable **CloudWatch** log forwarding from Docker

---

### Deploy on Azure (Virtual Machine)

#### 1. Create a VM

- **Image:** Ubuntu Server 22.04 LTS
- **Size:** `Standard_B2s` (2 vCPU, 4 GB RAM) minimum
- **Disk:** 32 GB Premium SSD
- **Networking:** Create/select an NSG with:

| Priority | Name | Port | Protocol | Source | Action |
|---|---|---|---|---|---|
| 100 | AllowSSH | 22 | TCP | Your IP | Allow |
| 110 | AllowHTTP | 80 | TCP | Any | Allow |
| 120 | AllowHTTPS | 443 | TCP | Any | Allow |

#### 2. Point your domain

Create an A record in Azure DNS or your registrar:

```
docs.yourcompany.com  →  A  →  20.xxx.xxx.xxx
```

#### 3. SSH in and install

```bash
ssh azureuser@20.xxx.xxx.xxx

curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

#### 4. Verify

```bash
docker compose -f /opt/docmesh/docker-compose.prod.yml ps
curl -s https://docs.yourcompany.com/api/auth/profile | head
```

#### Azure tips

- Use a **Static IP** so DNS records don't break on reboot
- For production, swap the containerized PostgreSQL for **Azure Database for PostgreSQL — Flexible Server**
- Store secrets in **Azure Key Vault**
- Use **Azure Monitor** for container health and log analytics
- Consider **Azure Container Instances (ACI)** or **Azure App Service** for a managed container experience

---

### Deploy on DigitalOcean (Droplet)

#### 1. Create a Droplet

- **Image:** Ubuntu 22.04 (LTS)
- **Plan:** Basic — **$12/month** (2 GB RAM, 1 vCPU, 50 GB SSD) or **$24/month** (4 GB) for production
- **Region:** closest to your users
- **Authentication:** SSH key (recommended)
- **Enable backups** (optional but recommended)

#### 2. Point your domain

In DigitalOcean Networking (or your registrar), create an A record:

```
docs.yourcompany.com  →  A  →  157.xxx.xxx.xxx
```

#### 3. SSH in and install

```bash
ssh root@157.xxx.xxx.xxx

curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

#### 4. Verify

```bash
docker compose -f /opt/docmesh/docker-compose.prod.yml ps
```

Open `https://docs.yourcompany.com` in your browser.

#### DigitalOcean tips

- Enable **DigitalOcean Cloud Firewalls** as an additional layer (allow 22, 80, 443)
- For production databases, use **DigitalOcean Managed PostgreSQL** ($15/month)
- Use **DO Spaces** for asset/file storage
- Enable **Monitoring** in the Droplet dashboard
- Use **DigitalOcean App Platform** if you prefer a PaaS experience

---

### Production hardening checklist

After the installer finishes, review these items for a production deployment:

- [ ] **Secrets** — Verify `JWT_SECRET` and `DB_PASSWORD` in `/opt/docmesh/.env` are strong random values (the installer generates them automatically)
- [ ] **TLS** — Confirm `https://yourdomain.com` loads with a valid certificate; Certbot auto-renews via systemd timer
- [ ] **Firewall** — Only ports 22, 80, 443 should be open (`sudo ufw status`)
- [ ] **Backups** — Set up automated PostgreSQL backups:
  ```bash
  # Add to crontab (daily backup at 2 AM)
  0 2 * * * docker exec documesh-postgres-1 pg_dump -U docmesh docmesh | gzip > /opt/docmesh/backups/docmesh-$(date +\%Y\%m\%d).sql.gz
  ```
- [ ] **Log rotation** — Docker logs are rotated by the json-file driver config in `docker-compose.prod.yml`
- [ ] **Updates** — Pull latest code and rebuild:
  ```bash
  cd /opt/docmesh
  git pull origin master
  docker compose -f docker-compose.prod.yml up --build -d
  ```
- [ ] **Monitoring** — Set up uptime monitoring for `https://yourdomain.com/api/auth/profile` (expect 401 = healthy)

---

### Manual deployment (without installer)

If you prefer to deploy manually without the installer script:

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Clone and configure
git clone https://github.com/your-username/docmesh.git /opt/docmesh
cd /opt/docmesh
cp .env.example .env

# 3. Edit .env with production values
#    - Set strong DB_PASSWORD and JWT_SECRET
#    - Set VITE_API_URL to your domain

# 4. Use the production compose file
cp deploy/docker-compose.prod.yml docker-compose.prod.yml

# 5. Build and start
docker compose -f docker-compose.prod.yml up --build -d
```

---

## Roadmap

### Completed

- [x] **Phase 1 — Foundation:** Content model, CRUD, versioning, JWT auth, TipTap editor, delivery API, publications, Swagger
- [x] **Phase 2 — Content Reuse:** Conrefs, where-used tracking, DITA maps, DITAVAL profiling, content fragments
- [x] **Phase 3 — Publishing:** Publishing profiles, HTML5/PDF/JSON output, DITAVAL filtering
- [x] **Phase 4 — Branching:** Branches, diff, merge, baselines, releases, rollback
- [x] **Phase 5 — Review Workflows:** State-machine workflows, reviewer assignment, comments, notifications
- [x] **Phase 6 — Localization:** Multi-locale, XLIFF, translation jobs, fallback chains
- [x] **Phase 7 — Taxonomy & Access Control:** Taxonomy terms, full-text search, RBAC, API keys
- [x] **Phase 8 — Integrations:** Webhooks, event logging, assets, batch ops, trash

### Upcoming

- [ ] AI-assisted authoring and content suggestions
- [ ] Semantic search (vector embeddings)
- [ ] Real-time collaborative editing (Yjs + CRDTs)
- [ ] Mobile SDKs (iOS / Android)
- [ ] DITA OT import/export
- [ ] Plugin / extension system
- [ ] Kubernetes Helm chart

---

## Contributing

Contributions are welcome and appreciated.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Please ensure your code passes linting and existing tests before submitting.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <sub>Built with NestJS, React, TipTap, PostgreSQL, and Docker.</sub><br/>
  <sub>Deploy to AWS, Azure, or DigitalOcean in minutes.</sub><br/>
  <sub>If you find DocMesh useful, please consider giving it a star.</sub>
</p>

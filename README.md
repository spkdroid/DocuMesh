# DocMesh

**An open-source Component Content Management System (CCMS)**

DocMesh helps developers, technical writers, and product teams manage documentation as reusable, structured DITA components. It exposes everything through a REST API, so you can power in-app help, developer docs, support portals, knowledge bases, or any application that needs structured content delivered across channels.

We built it because enterprise CCMS tools (Tridion Docs, IXIASOFT, Paligo) solve real problems — granular reuse, structured authoring, multi-channel publishing — but they're expensive, closed-source, and painful to integrate into modern workflows. DocMesh takes those same ideas and puts them in a stack you can actually run with `docker compose up`.

**Quick links:** [Getting started](#getting-started) · [Features](#what-it-does) · [Architecture](#architecture) · [API](#api-reference) · [Deployment](#deployment) · [Configuration](#configuration) · [Contributing](#contributing)

---

## What it does

**Structured content model** — Six DITA information types (topic, concept, task, reference, glossary, troubleshooting) with prolog metadata, short descriptions, body sections, and related links. Content is stored as structured JSON (ProseMirror format) and can be previewed or exported as DITA XML.

**DITA structured authoring** — The editor is type-aware. When you create a task, you get sections for context, prerequisites, steps, result, post-requisites, and examples — each labeled with its DITA element tag. Concepts get a conbody. References get refbody, refsyn, and properties. Everything is collapsible, and there's a live XML preview tab.

**Content reuse** — Conref and conkeyref references, content fragments, key maps, variables, where-used tracking, and dependency graph analysis. Write once, reuse everywhere, and know exactly where every piece of content is used.

**DITA maps and publishing** — Hierarchical maps and bookmaps with nested entries (topicref, chapter, part, appendix, frontmatter, backmatter, mapref). DITAVAL conditional profiling lets you filter content by audience, platform, or any custom attribute. Output in HTML5, PDF, or JSON.

**Branching and versioning** — Every edit creates a new version automatically. You can create content branches, run three-way diffs, merge with conflict detection, tag baselines, cut releases, and roll back to any previous version.

**Review workflows** — A state machine moves content through draft, in-review, published, and archived states. Assign reviewers from your team, leave inline comments, resolve or reopen threads, and track everything in a review dashboard with notifications.

**Localization** — Multi-locale content with fallback chains. Import and export XLIFF for translation. Create translation jobs, hook into your TMS, and automatically detect when source content changes so translations stay in sync.

**Access control** — Role-based permissions (admin, author, reviewer, viewer), user groups, folder-level access, and API key management with scoped access for external integrations.

**Taxonomy and search** — Hierarchical taxonomy terms for classification. Tag content with terms. PostgreSQL full-text search with faceted filtering across type, status, locale, and custom metadata.

**Integrations** — Webhooks with HMAC signing for secure event delivery. Event logging, asset management with versioning, content comparison, batch operations, and soft delete with trash and restore.

**Rich block editor** — TipTap/ProseMirror editor with a full toolbar: bold, italic, underline, strikethrough, code, highlight, sub/superscript, headings (H1–H4), bullet and ordered lists, blockquotes, code blocks, horizontal rules, and full table support with add/remove rows and columns.

**One-command deployment** — The entire stack (PostgreSQL, Redis, NestJS backend, React frontend + Nginx) runs as four Docker containers. For production, there's an automated installer that handles TLS certificates, firewall rules, and systemd services on AWS, Azure, or DigitalOcean.

---

## Getting started

You'll need [Docker](https://docs.docker.com/get-docker/) and Docker Compose. For local development without Docker, you'll need Node.js 20+ and PostgreSQL 16.

### Docker (recommended)

```bash
git clone https://github.com/your-username/docmesh.git
cd docmesh
docker compose up --build
```

That starts PostgreSQL, Redis, the NestJS backend, and the React frontend behind Nginx. Once it's up:

- **Web UI** — http://localhost:8080
- **API** — http://localhost:3000/api
- **Swagger docs** — http://localhost:3000/api/docs

### Cloud installer

If you have a server (EC2, Azure VM, Droplet, etc.) and a domain pointed at it:

```bash
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

This installs Docker, generates secure passwords, configures Nginx with a free Let's Encrypt TLS certificate, and starts everything. More details in [Deployment](#deployment).

### Local development

If you want to run the backend and frontend separately (with hot reload):

```bash
git clone https://github.com/your-username/docmesh.git
cd docmesh

# Start just the databases
docker compose up postgres redis -d

# In one terminal — backend
cd backend
npm install
npm run start:dev
# API at http://localhost:3000/api

# In another terminal — frontend
cd web
npm install
npm run dev
# UI at http://localhost:5173
```

---

## Project structure

```
docmesh/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── auth/            # JWT authentication, register, login
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
├── web/                     # React frontend
│   ├── src/
│   │   ├── components/      # TipTap editor, layout shell
│   │   ├── pages/           # Dashboard, ContentEditor, Publications,
│   │   │                    # Reviews, Team, Login, Register
│   │   └── contexts/        # Auth context
│   └── Dockerfile
├── deploy/                  # Deployment automation
│   ├── install.sh           # Cloud installer script
│   ├── docker-compose.prod.yml
│   ├── nginx-ssl.conf
│   └── README-DEPLOY.md     # Detailed deployment guide
├── docker-compose.yml       # Development orchestration
├── .env.example             # Environment template
└── ARCHITECTURE_ROADMAP.md
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | NestJS 10 (TypeScript 5.x) |
| Database | PostgreSQL 16 — JSONB for content bodies, full-text search |
| ORM | TypeORM 0.3 |
| Auth | Passport + JWT, org-scoped with RBAC |
| Cache | Redis 7 |
| Frontend | React 18 + TipTap (ProseMirror-based editor) |
| Build | Vite 5 |
| Containers | Docker + Docker Compose |
| Reverse proxy | Nginx (SPA routing, API proxy, TLS termination) |

---

## API reference

All authenticated endpoints require a `Bearer` token in the `Authorization` header. Register at `POST /api/auth/register` to get started. Full Swagger UI is at `/api/docs`.

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user and organization | No |
| `POST` | `/api/auth/login` | Log in and get an access token | No |
| `GET` | `/api/auth/profile` | Get current user info | Yes |

### Content

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/content` | List content items (filtered, paginated) | Yes |
| `POST` | `/api/content` | Create a content item | Yes |
| `GET` | `/api/content/:id` | Get a single item | Yes |
| `PATCH` | `/api/content/:id` | Update an item | Yes |
| `DELETE` | `/api/content/:id` | Delete an item | Yes |
| `GET` | `/api/content/:id/versions` | Get version history | Yes |

### DITA maps

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/maps` | List maps | Yes |
| `POST` | `/api/maps` | Create a map (MAP or BOOKMAP) | Yes |
| `GET` | `/api/maps/:id` | Get a map with its entries | Yes |
| `POST` | `/api/maps/:id/entries` | Add an entry to a map | Yes |
| `PATCH` | `/api/maps/entries/:id` | Update an entry | Yes |
| `DELETE` | `/api/maps/entries/:id` | Remove an entry | Yes |

### Publications

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/publications` | List publications | Yes |
| `POST` | `/api/publications` | Create a publication | Yes |
| `GET` | `/api/publications/:id` | Get a publication with its content tree | Yes |
| `DELETE` | `/api/publications/:id` | Delete a publication | Yes |
| `POST` | `/api/publications/:id/entries` | Add an entry | Yes |
| `DELETE` | `/api/publications/:id/entries/:eid` | Remove an entry | Yes |

### Reviews

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/workflows/reviews` | Submit content for review | Yes |
| `GET` | `/api/workflows/reviews` | Get my review tasks | Yes |
| `GET` | `/api/workflows/reviews/all` | Get all review tasks in my org | Yes |
| `PATCH` | `/api/workflows/reviews/:id` | Approve or reject a review | Yes |
| `GET` | `/api/workflows/reviews/dashboard` | Review dashboard stats | Yes |

### Users

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users` | List members in my organization | Yes |
| `POST` | `/api/users/invite` | Invite a user to my organization | Yes |

### Delivery (public)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/deliver/:slug?lang=en&platform=web` | Fetch published content by slug | No |

There are 100+ endpoints total across all modules. The Swagger UI at `/api/docs` has the complete reference.

---

## DITA structured authoring

The content editor adapts to the type of content you're writing. Instead of one big text box, you get the sections that the DITA spec defines for each information type:

| Content type | Root element | Sections you'll see in the editor |
|---|---|---|
| Topic | `<topic>` | `<body>` |
| Concept | `<concept>` | `<conbody>` |
| Task | `<task>` | `<context>`, `<prereq>`, `<steps>`, `<result>`, `<postreq>`, `<example>` |
| Reference | `<reference>` | `<refbody>`, `<refsyn>`, `<properties>` |
| Glossary | `<glossentry>` | `<glossdef>` |
| Troubleshooting | `<troubleshooting>` | `<condition>`, `<cause>`, `<remedy>` |

Each section is labeled with its DITA XML element name, includes a hint about what goes there, and can be collapsed when you're not working on it. There's a "DITA XML" tab that shows the generated XML for the current content, with a copy button.

---

## Content model

Content is stored as structured JSON (ProseMirror/TipTap document format). Here's what a task looks like:

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

Six content types: `topic`, `concept`, `task`, `reference`, `glossary`, `troubleshooting`.

Four statuses: `draft` → `in_review` → `published` → `archived`.

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

The frontend is a React SPA served by Nginx. Nginx also reverse-proxies `/api/` requests to the NestJS backend. PostgreSQL stores everything (content bodies as JSONB, users, maps, workflows, etc.). Redis handles caching and session data.

In development, the frontend runs on Vite's dev server (port 5173) and the backend runs directly on Node (port 3000). In production, both are multi-stage Docker builds — the frontend compiles to static files served by Nginx, and the backend compiles TypeScript to JavaScript and runs on `node dist/main`.

For more on how the architecture was designed and why, see [ARCHITECTURE_ROADMAP.md](ARCHITECTURE_ROADMAP.md).

---

## Configuration

Copy `.env.example` to `.env` and update the values. In Docker, the compose file passes these to the containers automatically.

| Variable | Default | Notes |
|---|---|---|
| `DB_HOST` | `localhost` | Use `postgres` when running in Docker |
| `DB_PORT` | `5432` | |
| `DB_USERNAME` | `docmesh` | |
| `DB_PASSWORD` | `docmesh_secret` | Change this in production |
| `DB_NAME` | `docmesh` | |
| `JWT_SECRET` | `dev-secret-change-me` | **Must** change in production — use a 64+ character random string |
| `JWT_EXPIRATION` | `7d` | How long access tokens last |
| `REDIS_HOST` | `localhost` | Use `redis` when running in Docker |
| `REDIS_PORT` | `6379` | |
| `PORT` | `3000` | Backend server port |
| `NODE_ENV` | `development` | Set to `production` for deployment |
| `VITE_API_URL` | `http://localhost:3000/api` | Build-time variable for the frontend |

---

## Deployment

DocMesh ships with an automated installer (`deploy/install.sh`) that works on any Ubuntu/Debian server — AWS EC2, Azure VMs, DigitalOcean Droplets, or bare metal. It handles everything from installing Docker to configuring TLS.

For the full step-by-step guide with cloud-specific instructions, see [deploy/README-DEPLOY.md](deploy/README-DEPLOY.md).

### What the installer does

1. Updates system packages and installs dependencies
2. Installs Docker Engine and Docker Compose
3. Clones the repository to `/opt/docmesh`
4. Generates cryptographically secure random passwords for PostgreSQL and JWT
5. Creates a production `.env` with restrictive file permissions
6. Builds and starts all containers with a hardened production compose file (no exposed database ports, log rotation, restart policies)
7. Configures Nginx as a reverse proxy with security headers
8. Obtains a TLS certificate from Let's Encrypt and sets up auto-renewal
9. Configures the UFW firewall (SSH, HTTP, HTTPS only)
10. Registers a systemd service so everything restarts on reboot
11. Sets up a daily database backup cron (2 AM, 30-day retention)

### Usage

```bash
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

| Flag | What it does | Required |
|---|---|---|
| `--domain` | Your domain name | Yes |
| `--email` | Email for Let's Encrypt certificates | Yes |
| `--branch` | Git branch to deploy (default: `master`) | No |
| `--no-tls` | Skip TLS, serve over HTTP only (for testing) | No |
| `--db-password` | Custom database password (auto-generated otherwise) | No |
| `--jwt-secret` | Custom JWT secret (auto-generated otherwise) | No |

### AWS (EC2)

Spin up a `t3.small` or larger running Ubuntu 22.04. Open ports 22, 80, and 443 in the security group. Attach an Elastic IP so the address doesn't change. Point your domain's A record at the Elastic IP, then SSH in and run the installer.

```bash
ssh -i your-key.pem ubuntu@54.xxx.xxx.xxx
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

For a more resilient setup, put the instance behind an ALB, swap the containerized PostgreSQL for RDS, and store secrets in AWS Secrets Manager.

### Azure (VM)

Create a `Standard_B2s` or larger VM running Ubuntu 22.04. Configure the NSG to allow ports 22, 80, and 443. Assign a static public IP. Point your domain at it, SSH in, and run the installer.

```bash
ssh azureuser@20.xxx.xxx.xxx
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

For production, consider Azure Database for PostgreSQL (Flexible Server), Azure Cache for Redis, and Key Vault for secrets.

### DigitalOcean (Droplet)

Create a Droplet with the $12/month plan (2 GB RAM) or $24/month (4 GB) for production. Ubuntu 22.04, SSH key auth. Point your domain at the Droplet IP and run the installer.

```bash
ssh root@157.xxx.xxx.xxx
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

DigitalOcean also offers managed PostgreSQL ($15/month) and managed Redis ($10/month) if you want to offload database operations.

### Manual deployment

If you'd rather not use the installer:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone and configure
git clone https://github.com/your-username/docmesh.git /opt/docmesh
cd /opt/docmesh
cp .env.example .env
# Edit .env — set strong DB_PASSWORD, JWT_SECRET, and VITE_API_URL

# Use the production compose file and start
cp deploy/docker-compose.prod.yml .
docker compose -f docker-compose.prod.yml up --build -d
```

Then set up Nginx and TLS yourself — the template is in `deploy/nginx-ssl.conf`.

### After deployment

Things to verify once the installer finishes:

- **Secrets** — Check that `/opt/docmesh/.env` has strong random values for DB_PASSWORD and JWT_SECRET
- **TLS** — Open your domain in a browser and confirm the certificate is valid
- **Firewall** — Run `sudo ufw status` and confirm only 22, 80, and 443 are open
- **Backups** — The installer configures daily PostgreSQL dumps to `/opt/docmesh/backups/`. Verify with `crontab -l`.
- **Updates** — Pull and rebuild: `cd /opt/docmesh && git pull && docker compose -f docker-compose.prod.yml up --build -d`
- **Monitoring** — A GET to `/api/auth/profile` returning 401 means the backend is alive

---

## Roadmap

What we're looking at next:

- AI-assisted authoring and content suggestions
- Semantic search with vector embeddings
- Real-time collaborative editing (Yjs + CRDTs)
- Mobile SDKs for iOS and Android
- DITA Open Toolkit import/export
- Plugin and extension system
- Kubernetes Helm chart

---

## Contributing

Contributions are welcome. Fork the repo, create a feature branch, make your changes, and open a pull request. Please make sure things still build and existing tests pass before submitting.

```bash
git checkout -b feature/my-feature
git commit -m 'Add my feature'
git push origin feature/my-feature
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

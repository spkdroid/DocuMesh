# DocMesh — Open-Source CCMS

<p align="center">
  <img src="web/public/docmesh.svg" alt="DocMesh" width="100" />
</p>

<p align="center"><strong>Structure. Reuse. Publish. Deliver.</strong></p>

DocMesh is an open-source Component Content Management System built for developers, technical writers, and product teams. It breaks documentation into reusable, structured DITA components and delivers them through a REST API — powering in-app help, developer docs, support portals, knowledge bases, and multi-channel content delivery.

Think of it as the open, self-hosted alternative to Tridion Docs, IXIASOFT, or Paligo — DITA structured authoring plus content reuse plus multi-channel publishing, in a stack you can run with `docker compose up`.

[Getting Started](#install-recommended) · [Highlights](#highlights) · [Architecture](#how-it-works) · [API](#api-reference) · [Deploy](#deployment) · [Config](#configuration) · [Contributing](#contributing)

---

## Install (recommended)

Runtime: [Docker](https://docs.docker.com/get-docker/) + Docker Compose.

```bash
git clone https://github.com/your-username/docmesh.git
cd docmesh
docker compose up --build
```

| Service | URL |
|---|---|
| Web UI | http://localhost:8080 |
| API | http://localhost:3000/api |
| Swagger docs | http://localhost:3000/api/docs |

&nbsp;

## Quick start (TL;DR)

```bash
git clone https://github.com/your-username/docmesh.git
cd docmesh
docker compose up --build

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"changeme","name":"Dev","organizationName":"Acme"}'

# Log in and get a token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"changeme"}'

# Create your first content item
curl -X POST http://localhost:3000/api/content \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Getting Started","type":"topic","slug":"getting-started"}'
```

Or just open http://localhost:8080, register, and start writing in the browser.

&nbsp;

## From source (development)

Prefer running the backend and frontend separately with hot reload:

```bash
git clone https://github.com/your-username/docmesh.git
cd docmesh

# Start databases
docker compose up postgres redis -d

# Backend (terminal 1)
cd backend && npm install && npm run start:dev

# Frontend (terminal 2)
cd web && npm install && npm run dev
```

Backend at http://localhost:3000/api, frontend at http://localhost:5173.

&nbsp;

## Cloud installer

Deploy to any Ubuntu/Debian server (AWS, Azure, DigitalOcean, bare metal) with a single command:

```bash
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

Installs Docker, generates secure passwords, configures Nginx + TLS (Let's Encrypt), sets up firewall + systemd + daily backups. Details: [Deployment](#deployment).

&nbsp;

## Highlights

- **Full DITA content model** — topics, concepts, tasks, references, glossary entries, and troubleshooting as first-class types with prolog, shortdesc, body sections, and related links.
- **DITA structured authoring** — type-aware editing with DITA element labels (`<conbody>`, `<prereq>`, `<steps>`, etc.), collapsible sections, and live DITA XML preview.
- **True content reuse** — conref, conkeyref, key maps, variables, content fragments, where-used tracking, and dependency graph analysis.
- **DITA maps + publishing** — hierarchical maps, bookmaps, nested maps, DITAVAL conditional profiling, multi-format output (HTML5, PDF, JSON).
- **Branching + versioning** — content branches, three-way diff, merge with conflict detection, baselines, releases, and rollback.
- **Review workflows** — state-machine workflows, reviewer assignment, inline comments, approval gates, notifications, and audit trail.
- **Localization** — multi-locale with fallback chains, XLIFF import/export, translation jobs, TMS integration, source change detection.
- **Access control** — RBAC (admin/author/reviewer/viewer), user groups, folder-level permissions, scoped API keys.
- **Taxonomy + search** — hierarchical taxonomy terms, content tagging, PostgreSQL full-text search, faceted filtering.
- **Integrations** — webhooks with HMAC signing, event logging, asset management, content comparison, batch ops, soft delete with trash.
- **Rich block editor** — TipTap/ProseMirror with tables, highlights, sub/superscript, code blocks, and structured authoring extensions.
- **One-command deploy** — full stack via Docker Compose, with automated cloud installers for AWS, Azure, and DigitalOcean.

&nbsp;

## Everything we built

### Content platform

- Content model with 6 DITA information types (topic, concept, task, reference, glossary, troubleshooting).
- CRUD API with automatic version history on every edit.
- Structured JSON storage (ProseMirror format) with DITA XML preview/export.
- Prolog metadata, short descriptions, body sections, related links.
- Content statuses: `draft` → `in_review` → `published` → `archived`.
- Slug-based content delivery API with locale and platform filtering.
- 100+ REST endpoints. Full Swagger/OpenAPI docs at `/api/docs`.

### Authoring

- Type-aware DITA structured authoring editor — each content type gets its spec-defined sections.
- TipTap/ProseMirror editor with full toolbar (bold, italic, underline, strikethrough, code, highlight, sub/superscript, headings, lists, blockquotes, code blocks, tables).
- Live DITA XML preview tab with copy-to-clipboard.
- Collapsible DITA sections with element labels and contextual hints.

### Reuse + maps

- Conref and conkeyref content references (embed, link, conref types).
- Where-used tracking and dependency graph analysis.
- Content fragments, variables, key maps.
- DITA maps (MAP, BOOKMAP) with nested entries (TOPICREF, CHAPTER, PART, APPENDIX, FRONTMATTER, BACKMATTER, MAPREF).
- DITAVAL conditional profiling (filter by audience, platform, custom attributes).

### Publishing

- Publishing profiles with multi-format output (HTML5, PDF, JSON).
- DITAVAL filtering at publish time.
- Hierarchical publication trees with ordered entries.
- Public delivery API with locale/platform filtering.

### Collaboration

- State-machine review workflows (draft → in_review → published → archived).
- Reviewer assignment from org members, inline comments with resolve/reopen.
- Review task dashboard with stats and notifications.
- Multi-locale content with fallback chains.
- XLIFF import/export, translation jobs, TMS integration hooks.
- Source change detection for translation sync.

### Infrastructure

- JWT authentication with org-scoped access.
- RBAC (admin, author, reviewer, viewer), user groups, folder-level permissions.
- API key management with scoped access.
- Content branches, three-way diff engine, merge with conflict detection.
- Baselines, releases, rollback, version comparison.
- Hierarchical taxonomy terms, content tagging.
- PostgreSQL full-text search with faceted filtering.
- Webhooks with HMAC signing, event logging.
- Asset management (upload, metadata, versioning).
- Batch operations, soft delete with trash and restore.

&nbsp;

## How it works

```
         Browser / Consumer Apps
               │
               ▼
┌───────────────────────────────┐
│       Nginx (TLS + proxy)     │
│   /      → React SPA          │
│   /api/  → NestJS backend     │
└──────────────┬────────────────┘
               │  :3000
               ▼
┌───────────────────────────────┐
│      NestJS Backend API       │
│                               │
│  Auth · Content · Maps        │
│  Reuse · Publications         │
│  Workflows · Localization     │
│  Taxonomy · Search            │
│  Branching · Integrations     │
│  Delivery                     │
└───────┬───────────┬───────────┘
        │           │
        ▼           ▼
   PostgreSQL    Redis 7
      16
```

Frontend is a React SPA served by Nginx. Nginx reverse-proxies `/api/` to the NestJS backend. PostgreSQL stores everything (content as JSONB, users, maps, workflows). Redis handles caching.

Dev mode: Vite dev server (:5173) + Node (:3000). Production: multi-stage Docker builds — frontend compiles to static files, backend compiles TS to JS.

&nbsp;

## Key subsystems

- **Content engine** — 6 DITA types, JSONB storage, automatic versioning, slug-based delivery.
- **Reuse engine** — conref/conkeyref resolution, where-used tracking, dependency graphs, key maps.
- **Map engine** — DITA maps + bookmaps, nested entries, DITAVAL profiling.
- **Publishing engine** — publication trees, multi-format output, conditional filtering.
- **Workflow engine** — state machine, reviewer assignment, comments, notifications.
- **Localization engine** — XLIFF, translation jobs, fallback chains, source change detection.
- **Search engine** — PostgreSQL full-text search, faceted filtering, taxonomy classification.
- **Branch engine** — content branches, three-way diff, merge, baselines, releases, rollback.
- **Auth engine** — JWT + Passport, org-scoped RBAC, user groups, API keys.
- **Integration layer** — webhooks (HMAC), event log, asset management, batch ops, trash.

&nbsp;

## DITA structured authoring

The editor adapts to your content type:

| Type | Root | Sections |
|---|---|---|
| Topic | `<topic>` | `<body>` |
| Concept | `<concept>` | `<conbody>` |
| Task | `<task>` | `<context>`, `<prereq>`, `<steps>`, `<result>`, `<postreq>`, `<example>` |
| Reference | `<reference>` | `<refbody>`, `<refsyn>`, `<properties>` |
| Glossary | `<glossentry>` | `<glossdef>` |
| Troubleshooting | `<troubleshooting>` | `<condition>`, `<cause>`, `<remedy>` |

&nbsp;

## Configuration

Minimal `.env` (Docker fills in defaults):

```bash
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=docmesh
DB_PASSWORD=docmesh_secret        # change in production
DB_NAME=docmesh
JWT_SECRET=dev-secret-change-me   # change in production — 64+ chars
JWT_EXPIRATION=7d
REDIS_HOST=redis
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
VITE_API_URL=http://localhost:3000/api
```

Copy `.env.example` to `.env` and update values. The compose file passes these to containers automatically.

&nbsp;

## API reference

All authenticated endpoints need a `Bearer` token. Register at `POST /api/auth/register`. Full interactive docs at `/api/docs` (Swagger UI).

### Auth

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

### Maps

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/maps` | List maps | Yes |
| `POST` | `/api/maps` | Create map | Yes |
| `GET` | `/api/maps/:id` | Get map with entries | Yes |
| `POST` | `/api/maps/:id/entries` | Add entry | Yes |

### Reviews

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/workflows/reviews` | Submit for review | Yes |
| `GET` | `/api/workflows/reviews` | My review tasks | Yes |
| `PATCH` | `/api/workflows/reviews/:id` | Approve/reject | Yes |
| `GET` | `/api/workflows/reviews/dashboard` | Dashboard stats | Yes |

### Delivery (public)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/deliver/:slug?lang=en&platform=web` | Fetch published content | No |

100+ endpoints total. See `/api/docs` for the complete reference.

&nbsp;

## Tech stack

| Layer | Technology |
|---|---|
| Backend | NestJS 10 (TypeScript 5.x) |
| Database | PostgreSQL 16 (JSONB, full-text search) |
| ORM | TypeORM 0.3 |
| Auth | Passport + JWT (org-scoped, RBAC) |
| Cache | Redis 7 |
| Frontend | React 18 + TipTap (ProseMirror) |
| Build | Vite 5 |
| Containers | Docker + Docker Compose |
| Proxy | Nginx (SPA routing, API proxy, TLS) |

&nbsp;

## Project structure

```
docmesh/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/            # JWT auth, register, login
│   │   ├── content/         # Content CRUD, versioning, DITA
│   │   ├── delivery/        # Public delivery API
│   │   ├── maps/            # DITA maps, entries, DITAVAL
│   │   ├── organizations/   # Multi-tenant orgs
│   │   ├── publications/    # Publication trees, profiles
│   │   ├── reuse/           # Conrefs, key maps, fragments
│   │   ├── users/           # Users, invitations
│   │   ├── workflows/       # Reviews, notifications
│   │   ├── localization/    # XLIFF, translations, locales
│   │   ├── taxonomy/        # Terms, tagging
│   │   ├── search/          # Full-text search, filtering
│   │   ├── branching/       # Branches, diff, merge, baselines
│   │   ├── integrations/    # Webhooks, API keys, assets, trash
│   │   └── common/          # Guards, decorators, utils
│   └── Dockerfile
├── web/                     # React + TipTap frontend
│   ├── src/
│   │   ├── components/      # Editor, layout, DITA toolbar
│   │   ├── pages/           # All app pages
│   │   └── contexts/        # Auth context
│   └── Dockerfile
├── deploy/                  # Deployment automation
│   ├── install.sh           # Cloud installer
│   ├── docker-compose.prod.yml
│   ├── nginx-ssl.conf
│   └── README-DEPLOY.md
├── docker-compose.yml
├── .env.example
└── ARCHITECTURE_ROADMAP.md
```

&nbsp;

## Deployment

The automated installer (`deploy/install.sh`) handles everything on Ubuntu/Debian. Works on AWS EC2, Azure VMs, DigitalOcean Droplets, or any server with SSH.

### Quick deploy

```bash
curl -fsSL https://raw.githubusercontent.com/your-username/docmesh/master/deploy/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh --domain docs.yourcompany.com --email admin@yourcompany.com
```

### Installer flags

| Flag | Description | Required |
|---|---|---|
| `--domain` | Your domain name | Yes |
| `--email` | Email for TLS certs | Yes |
| `--branch` | Git branch (default: `master`) | No |
| `--no-tls` | Skip TLS (HTTP only) | No |
| `--db-password` | Custom DB password | No |
| `--jwt-secret` | Custom JWT secret | No |

### AWS (EC2)

`t3.small` or larger, Ubuntu 22.04. Open ports 22/80/443. Attach Elastic IP. Point DNS, SSH in, run installer.

For HA: ALB + RDS PostgreSQL + Secrets Manager.

### Azure (VM)

`Standard_B2s` or larger, Ubuntu 22.04. NSG: allow 22/80/443. Static IP. Point DNS, SSH in, run installer.

For production: Azure Database for PostgreSQL + Key Vault.

### DigitalOcean (Droplet)

$12/mo (2 GB) or $24/mo (4 GB). Ubuntu 22.04, SSH key. Point DNS, SSH in, run installer.

Optional: managed PostgreSQL ($15/mo) + managed Redis ($10/mo).

### Manual deploy

```bash
curl -fsSL https://get.docker.com | sh
git clone https://github.com/your-username/docmesh.git /opt/docmesh
cd /opt/docmesh
cp .env.example .env
# Edit .env — set strong DB_PASSWORD, JWT_SECRET, VITE_API_URL
cp deploy/docker-compose.prod.yml .
docker compose -f docker-compose.prod.yml up --build -d
```

Then configure Nginx + TLS yourself — template in `deploy/nginx-ssl.conf`.

### Post-deploy checklist

- [ ] Verify `JWT_SECRET` and `DB_PASSWORD` are strong random values in `/opt/docmesh/.env`
- [ ] Confirm TLS certificate is valid at `https://yourdomain.com`
- [ ] Check firewall: `sudo ufw status` (only 22, 80, 443)
- [ ] Verify backups: `crontab -l` (daily PostgreSQL dumps)
- [ ] Test health: `curl https://yourdomain.com/api/auth/profile` → 401 means alive

Full deployment guide: [deploy/README-DEPLOY.md](deploy/README-DEPLOY.md).

&nbsp;

## Roadmap

- [ ] AI-assisted authoring and content suggestions
- [ ] Semantic search (vector embeddings)
- [ ] Real-time collaborative editing (Yjs + CRDTs)
- [ ] Mobile SDKs (iOS / Android)
- [ ] DITA Open Toolkit import/export
- [ ] Plugin / extension system
- [ ] Kubernetes Helm chart

&nbsp;

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. Fork, branch, commit, PR. Make sure things build and tests pass.

```bash
git checkout -b feature/my-feature
git commit -m 'Add my feature'
git push origin feature/my-feature
```

&nbsp;

## License

[MIT](LICENSE)

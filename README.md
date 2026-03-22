<p align="center">
  <img src="web/public/docmesh.svg" alt="DocMesh" width="80" />
</p>

<h1 align="center">DocMesh</h1>

<p align="center">
  <strong>Open-source Component Content Management System (CCMS)</strong><br/>
  Create, manage, and deliver structured knowledge via APIs.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#api-reference">API</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#roadmap">Roadmap</a> &middot;
  <a href="#contributing">Contributing</a>
</p>

---

## What is DocMesh?

DocMesh is an open-source CCMS built for developers and product teams. It breaks documentation into **reusable, structured components** and delivers them through a REST API — making it the backbone for in-app help systems, developer docs, customer support portals, and any application that needs dynamic content delivery.

Inspired by enterprise systems like SDL Knowledge Center (Tridion Docs), DocMesh brings the same structured authoring and multi-channel delivery model to an open, modern stack.

---

## Features

| | Feature | Description |
|---|---|---|
| **Structured Authoring** | Component content model | Topics, tasks, references, notes, and warnings as first-class content types |
| **Rich Editor** | TipTap block editor | WYSIWYG editing with headings, lists, quotes, code blocks, and more |
| **API-First Delivery** | REST API | Fetch published content by slug with locale and platform filtering |
| **Versioning** | Automatic version history | Every save creates a new version with full body snapshot |
| **Multi-Tenant** | Organization scoping | Complete data isolation per organization |
| **Publications** | Hierarchical content trees | Organize content into publications with ordered, nested entries |
| **Authentication** | JWT + bcrypt | Secure registration, login, and role-based token payload |
| **Swagger Docs** | OpenAPI 3.1 | Auto-generated interactive API documentation at `/api/docs` |
| **Dockerized** | Single command setup | Full stack runs via `docker compose up` |

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

### Option 2 — Local Development

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
│   │   ├── content/         # Content CRUD, versioning
│   │   ├── delivery/        # Public content delivery API
│   │   ├── organizations/   # Multi-tenant org management
│   │   ├── publications/    # Publication trees
│   │   ├── users/           # User management
│   │   └── common/          # Guards, decorators
│   └── Dockerfile
├── web/                     # React + TipTap frontend
│   ├── src/
│   │   ├── components/      # Editor, Layout
│   │   ├── pages/           # Dashboard, ContentEditor, Login
│   │   └── contexts/        # Auth context
│   └── Dockerfile
├── docker-compose.yml       # Full stack orchestration
└── ARCHITECTURE_ROADMAP.md  # Architecture decision document
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | **NestJS** (TypeScript) |
| Database | **PostgreSQL 16** (JSONB for content bodies) |
| ORM | **TypeORM** |
| Auth | **Passport + JWT** |
| Cache | **Redis** |
| Frontend | **React 18 + TipTap** (ProseMirror-based editor) |
| Build | **Vite** |
| Containerization | **Docker + Docker Compose** |

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

### Publications

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/publications` | List publications | Yes |
| `POST` | `/api/publications` | Create publication | Yes |
| `GET` | `/api/publications/:id` | Get with content tree | Yes |
| `DELETE` | `/api/publications/:id` | Delete publication | Yes |
| `POST` | `/api/publications/:id/entries` | Add entry | Yes |
| `DELETE` | `/api/publications/:id/entries/:eid` | Remove entry | Yes |

### Delivery (Public)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/deliver/:slug?lang=en&platform=web` | Fetch published content | No |

> Full interactive documentation available at `/api/docs` (Swagger UI).

---

## Content Model

DocMesh stores content as structured components:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "reset-password",
  "type": "task",
  "title": "Reset Password",
  "body": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Open the app and tap Forgot Password." }]
      }
    ]
  },
  "metadata": { "audience": "end-user", "platform": ["web", "mobile"] },
  "status": "published",
  "locale": "en"
}
```

**Content types:** `topic` · `task` · `reference` · `note` · `warning`

**Statuses:** `draft` → `in_review` → `published` → `archived`

---

## Architecture

```
┌─────────────────────┐       ┌─────────────────────┐
│   React + TipTap    │       │  Consumer Apps       │
│   (Web Editor)      │       │  (Web/Mobile/API)    │
└─────────┬───────────┘       └───────────┬──────────┘
          │                               │
          ▼                               ▼
┌─────────────────────────────────────────────────────┐
│                  NestJS Backend API                  │
│                                                     │
│  Auth · Content · Publications · Delivery · Search  │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    PostgreSQL      Redis        S3/MinIO
   (Content DB)   (Cache)    (Files — planned)
```

For a detailed architecture comparison and roadmap, see [ARCHITECTURE_ROADMAP.md](ARCHITECTURE_ROADMAP.md).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `docmesh` | Database user |
| `DB_PASSWORD` | `docmesh_secret` | Database password |
| `DB_NAME` | `docmesh` | Database name |
| `JWT_SECRET` | `dev-secret-change-me` | **Change in production** |
| `JWT_EXPIRATION` | `7d` | Token expiry |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `PORT` | `3000` | Backend listening port |

---

## Roadmap

### Phase 1 — Foundation (current)

- [x] Structured content model (topics, tasks, references, notes, warnings)
- [x] Content CRUD with REST API
- [x] Automatic version history
- [x] JWT authentication with org scoping
- [x] TipTap rich text editor
- [x] Content delivery API (public)
- [x] Publications with hierarchical entries
- [x] Swagger/OpenAPI documentation
- [x] Docker Compose deployment

### Phase 2 — Reuse & Collaboration

- [ ] Content references and transclusion (conref)
- [ ] "Where used" tracking
- [ ] Conditional publishing (audience, platform filtering)
- [ ] Role-based access control (Admin, Author, Reviewer, Viewer)
- [ ] Taxonomy and custom metadata schemas
- [ ] Full-text search (PostgreSQL)

### Phase 3 — Workflows & Localization

- [ ] Configurable review/approval workflows
- [ ] Multi-locale content with fallback chains
- [ ] Webhooks for external integrations
- [ ] PDF export from publications
- [ ] Content analytics and reuse dashboard

### Phase 4 — Intelligence & Scale

- [ ] AI-assisted authoring and suggestions
- [ ] Semantic search (vector / embeddings)
- [ ] Real-time collaborative editing (Yjs + CRDTs)
- [ ] Mobile SDKs (iOS / Android)
- [ ] DITA import/export
- [ ] Plugin / extension system

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
  <sub>Built with NestJS, React, TipTap, and PostgreSQL.</sub><br/>
  <sub>If you find DocMesh useful, please consider giving it a star.</sub>
</p>

# DocMesh — Architecture Options & Roadmap

> Decision document for the DocMesh CCMS platform.
> Inspired by SDL Knowledge Center (Tridion Docs), built for the modern developer ecosystem.

---

## Table of Contents

1. [SDL Knowledge Center — Feature Baseline](#1-sdl-knowledge-center--feature-baseline)
2. [DocMesh Core Requirements](#2-docmesh-core-requirements)
3. [Architecture Option A — Monolithic (Node.js + PostgreSQL)](#3-architecture-option-a--monolithic-nodejs--postgresql)
4. [Architecture Option B — Microservices (Node.js/Go + PostgreSQL + S3)](#4-architecture-option-b--microservices-nodejsgo--postgresql--s3)
5. [Architecture Option C — Headless CMS on Event-Driven Architecture](#5-architecture-option-c--headless-cms-on-event-driven-architecture)
6. [Architecture Option D — Java/Spring Boot Enterprise Stack](#6-architecture-option-d--javaspring-boot-enterprise-stack)
7. [Comparison Matrix](#6-comparison-matrix)
8. [Recommended Phased Roadmap (Per Option)](#7-recommended-phased-roadmap)
9. [Decision Criteria](#8-decision-criteria)

---

## 1. SDL Knowledge Center — Feature Baseline

SDL Knowledge Center (now RWS Tridion Docs) is an enterprise CCMS. DocMesh should match or improve upon these core capabilities:

| SDL KC Feature | Description | DocMesh Equivalent |
|---|---|---|
| **DITA Content Model** | Structured authoring using DITA topics (concept, task, reference) | Component content model (topics, tasks, references, notes) |
| **Content Reuse (conref/conkeyref)** | Reference fragments across documents | Content references & transclusion |
| **Maps & Publications** | Organize topics into hierarchical publications | Publication trees / content assemblies |
| **Versioning & Branching** | Full version history, branching for releases | Git-like versioning with branches |
| **Review Workflows** | Assign, review, approve content with status tracking | Configurable workflow engine |
| **Localization Management** | Translation management, language fallbacks, TMS integration | Multi-locale content with fallback chains |
| **Conditional Publishing** | Filter content by audience, platform, product | Variant-based conditional delivery |
| **Full-Text Search** | Search across all content objects | Full-text + semantic search |
| **Role-Based Access Control** | Granular permissions per user/group/folder | RBAC with team/org scoping |
| **Output Formats** | PDF, HTML5, responsive web | API-first (JSON/HTML) + PDF export |
| **Metadata & Taxonomy** | Classify content with custom metadata/taxonomies | Flexible tagging & taxonomy system |
| **Event System** | Hooks for external integrations | Webhooks + event bus |
| **Editor** | XML-based WYSIWYG editor | Modern web-based block editor |

---

## 2. DocMesh Core Requirements

Based on SDL KC capabilities and modern developer expectations:

### Must-Have (MVP)
- Structured content model (topics, tasks, references, notes, warnings)
- Content CRUD with REST API
- Hierarchical content organization (folders, publications)
- Basic content reuse (references/transclusion)
- Simple web-based authoring editor
- User authentication (JWT/OAuth2)
- Content versioning (at least linear history)
- Full-text search
- JSON + HTML content delivery API
- Multi-tenant or org-scoped data isolation

### Should-Have (Phase 2)
- Review/approval workflows
- Localization management with fallback
- Conditional/variant publishing
- RBAC with granular permissions
- Taxonomy and metadata system
- Webhooks for external integrations
- PDF export
- Content reuse analytics (where-used)

### Nice-to-Have (Phase 3)
- AI-assisted authoring (auto-summarize, suggest reuse)
- Semantic search (vector-based)
- Mobile SDKs (iOS/Android)
- Real-time collaborative editing
- Git-based content-as-code workflow
- Plugin/extension system
- TMS (Translation Management System) integration
- DITA import/export

---

## 3. Architecture Option A — Monolithic (Node.js + PostgreSQL)

### Philosophy
Single deployable unit. Fast to build, easy to reason about. Scale vertically first, extract services later if needed.

### Tech Stack
| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20+ (TypeScript) |
| **Framework** | NestJS (modular, DI, OpenAPI support) |
| **Database** | PostgreSQL 16 (JSONB for content, relational for structure) |
| **Search** | PostgreSQL full-text search → Elasticsearch later |
| **Cache** | Redis |
| **Auth** | Passport.js + JWT / OAuth2 (OIDC) |
| **File Storage** | Local FS → S3-compatible (MinIO for self-hosted) |
| **Editor Frontend** | React + TipTap (ProseMirror-based block editor) |
| **API** | REST (OpenAPI 3.1) + optional GraphQL (via NestJS) |
| **Deployment** | Docker Compose (dev) → single container + managed DB (prod) |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     DocMesh Monolith                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Content   │  │ Auth &   │  │ Search   │  │ Publish │ │
│  │ Module    │  │ RBAC     │  │ Module   │  │ Module  │ │
│  │          │  │ Module   │  │          │  │         │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │              │              │      │
│  ┌────▼──────────────▼──────────────▼──────────────▼────┐│
│  │              NestJS Application Core                  ││
│  │         (Middleware, Guards, Interceptors)             ││
│  └───────────────────────┬───────────────────────────────┘│
│                          │                                │
│  ┌───────────┐  ┌───────▼────────┐  ┌──────────────────┐│
│  │   Redis   │  │  PostgreSQL    │  │  File Storage    ││
│  │  (Cache)  │  │  (Content +    │  │  (S3 / MinIO)   ││
│  │           │  │   Metadata)    │  │                  ││
│  └───────────┘  └────────────────┘  └──────────────────┘│
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│  React + TipTap     │
│  (Editor Frontend)  │
└─────────────────────┘
```

### Content Data Model (PostgreSQL)

```
organizations
  ├── id, name, slug, settings (JSONB)

users
  ├── id, org_id, email, password_hash, role

content_items                          ← core entity
  ├── id (UUID)
  ├── org_id (FK)
  ├── slug (unique per org)
  ├── type (enum: topic, task, reference, note, warning)
  ├── title
  ├── body (JSONB — ProseMirror/TipTap doc tree)
  ├── metadata (JSONB — tags, taxonomy, custom fields)
  ├── status (enum: draft, in_review, published, archived)
  ├── locale (e.g. en-US)
  ├── parent_id (FK → content_items, for hierarchy)
  ├── sort_order
  ├── created_by, updated_by
  ├── created_at, updated_at

content_versions                       ← version history
  ├── id, content_item_id (FK)
  ├── version_number
  ├── body (JSONB snapshot)
  ├── metadata (JSONB snapshot)
  ├── change_summary
  ├── created_by, created_at

content_references                     ← reuse/transclusion
  ├── source_id (FK → content_items)
  ├── target_id (FK → content_items)
  ├── ref_type (enum: embed, link, conref)

publications                           ← maps/books
  ├── id, org_id, title, slug
  ├── root_content_id (FK → content_items)
  ├── locale, status

publication_entries                     ← ordered tree
  ├── publication_id, content_item_id
  ├── parent_entry_id, sort_order

conditions                             ← variant filtering
  ├── id, org_id, key, values (JSONB)

content_conditions                     ← applied conditions
  ├── content_item_id, condition_id, value

taxonomies / tags                      ← classification
  ├── standard tag + taxonomy tables

workflows                              ← review workflow
  ├── id, org_id, name, states (JSONB), transitions (JSONB)

workflow_instances
  ├── content_item_id, workflow_id, current_state, assignee_id
```

### Pros
- **Fastest to MVP** — single codebase, single deploy
- **Low operational cost** — one process, one DB, simple monitoring
- **Easy local dev** — `docker compose up` and you're running
- **NestJS modules** give internal separation for later extraction
- **PostgreSQL JSONB** handles semi-structured content without a separate doc store

### Cons
- Scaling ceiling — single process handles everything
- Search limited to PG full-text until Elasticsearch is added
- Harder to scale individual hot paths (e.g., delivery API vs authoring)
- Team size: works well until ~5-8 backend developers, then contention rises

### Best For
- Solo founder / small team (1-5 devs)
- Fastest path to working product
- Self-hosted / on-prem deployments
- Teams that value simplicity over theoretical scale

---

## 4. Architecture Option B — Microservices (Node.js/Go + PostgreSQL + S3)

### Philosophy
Separate concerns into independently deployable services from the start. Higher initial cost, but scales team and traffic independently.

### Tech Stack
| Layer | Technology |
|---|---|
| **API Gateway** | Kong / Traefik / custom (Node.js) |
| **Content Service** | Node.js (NestJS) + PostgreSQL |
| **Auth Service** | Node.js (NestJS) or Keycloak |
| **Search Service** | Go + Elasticsearch / OpenSearch |
| **Delivery Service** | Go (high-perf read path) |
| **Workflow Service** | Node.js + PostgreSQL |
| **Localization Service** | Node.js + PostgreSQL |
| **File Service** | Node.js + S3/MinIO |
| **Message Broker** | NATS / RabbitMQ |
| **Cache** | Redis |
| **Editor Frontend** | React + TipTap |
| **Deployment** | Kubernetes (Helm charts) / Docker Compose (dev) |

### Architecture Diagram

```
                    ┌─────────────────────┐
                    │   React + TipTap    │
                    │   (Editor / Portal) │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │    API Gateway       │
                    │  (Kong / Traefik)    │
                    └─────────┬───────────┘
                              │
        ┌────────────┬────────┼────────┬──────────────┐
        ▼            ▼        ▼        ▼              ▼
  ┌──────────┐ ┌─────────┐ ┌──────┐ ┌──────────┐ ┌─────────┐
  │ Content  │ │  Auth   │ │Search│ │ Workflow │ │ Delivery│
  │ Service  │ │ Service │ │ Svc  │ │ Service  │ │ Service │
  │ (NestJS) │ │(Keycloak│ │ (Go) │ │ (NestJS) │ │  (Go)   │
  └────┬─────┘ │/NestJS) │ └──┬───┘ └────┬─────┘ └────┬────┘
       │        └────┬────┘    │          │             │
       ▼             ▼         ▼          ▼             ▼
  ┌─────────┐  ┌─────────┐ ┌───────┐ ┌─────────┐ ┌─────────┐
  │  PG:    │  │  PG:    │ │Elastic│ │  PG:    │ │  Redis  │
  │ Content │  │  Auth   │ │Search │ │Workflow │ │ (Cache) │
  └─────────┘  └─────────┘ └───────┘ └─────────┘ └─────────┘
       │                                    ▲
       │          ┌──────────────┐          │
       └─────────►│  NATS /      │◄─────────┘
                  │  RabbitMQ    │
                  │ (Event Bus)  │
                  └──────────────┘
```

### Pros
- **Independent scaling** — scale delivery (reads) separately from authoring (writes)
- **Technology freedom** — Go for perf-critical paths, Node for productivity
- **Team autonomy** — separate teams own separate services
- **Resilience** — one service down doesn't take the whole system down
- **Better for SaaS** — can shard per tenant

### Cons
- **Much higher complexity** — distributed tracing, eventual consistency, service mesh
- **Slower to MVP** — need gateway, service discovery, message broker from day one
- **Operational cost** — Kubernetes expertise needed, more infrastructure
- **Data consistency** — cross-service transactions require sagas/choreography
- **Overkill** until you have significant scale or team size

### Best For
- Team of 5+ developers with microservices experience
- SaaS product expecting high scale
- Organizations with existing Kubernetes infrastructure
- When authoring load and delivery load differ significantly

---

## 5. Architecture Option C — Headless CMS on Event-Driven Architecture

### Philosophy
Treat content as events. Every change emits events that projections consume to build read models. Write and read sides are fully separated (CQRS). Ideal for multi-channel delivery at scale.

### Tech Stack
| Layer | Technology |
|---|---|
| **Write API (Commands)** | Node.js (NestJS) |
| **Event Store** | EventStoreDB / PostgreSQL (append-only) |
| **Read Projections** | Node.js workers |
| **Read API (Queries)** | Node.js / Go |
| **Delivery CDN** | Pre-rendered JSON to CDN (Cloudflare R2 / S3) |
| **Search** | Elasticsearch (projection consumer) |
| **Auth** | Auth0 / Keycloak (external) |
| **Cache** | Redis + CDN edge cache |
| **Editor Frontend** | React + TipTap |
| **Real-time** | WebSockets (Socket.io / native) |
| **Deployment** | Docker + managed services (or K8s) |

### Architecture Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│   React + TipTap    │       │  Consumer Apps       │
│   (Authoring UI)    │       │  (Web/Mobile/API)    │
└─────────┬───────────┘       └───────────┬──────────┘
          │                               │
          ▼                               ▼
┌─────────────────────┐       ┌──────────────────────┐
│   Write API         │       │   Read API           │
│   (Commands)        │       │   (Queries)          │
│   POST/PUT/DELETE   │       │   GET                │
└─────────┬───────────┘       └───────────▲──────────┘
          │                               │
          ▼                               │
┌─────────────────────┐       ┌───────────┴──────────┐
│   Event Store       │──────►│   Projection Workers │
│   (Append-only log) │       │                      │
│   - ContentCreated  │       │  ┌────────────────┐  │
│   - ContentUpdated  │       │  │ Search Index   │  │
│   - ContentPublished│       │  │ (Elasticsearch)│  │
│   - RefAdded        │       │  └────────────────┘  │
│   - WorkflowChanged │       │  ┌────────────────┐  │
│                     │       │  │ Read DB         │  │
│                     │       │  │ (PG / Mongo)   │  │
│                     │       │  └────────────────┘  │
│                     │       │  ┌────────────────┐  │
│                     │       │  │ CDN Cache       │  │
│                     │       │  │ (S3 + CF)      │  │
│                     │       │  └────────────────┘  │
└─────────────────────┘       └──────────────────────┘
          │
          ▼
┌─────────────────────┐
│   Webhook Dispatch  │───► External Systems
└─────────────────────┘
```

### Key Events
```
ContentCreated   { id, type, title, body, org_id, locale, created_by }
ContentUpdated   { id, changes, version, updated_by }
ContentPublished { id, version, locale, publication_id }
ContentArchived  { id, reason, archived_by }
RefCreated       { source_id, target_id, ref_type }
RefRemoved       { source_id, target_id }
WorkflowTransitioned { content_id, from_state, to_state, actor }
LocaleAdded      { content_id, locale, translated_body }
```

### Pros
- **Immutable audit trail** — every change is an event, perfect for compliance
- **Independent read/write scaling** — pre-compute delivery, scale reads to infinity via CDN
- **Real-time capable** — events can push to WebSockets for live updates
- **Multi-channel** — each consumer builds its own optimized read model
- **Time-travel** — replay events to any point in time
- **Natural webhook system** — events are already there

### Cons
- **Highest complexity** — CQRS/ES is a paradigm shift, steep learning curve
- **Eventual consistency** — writes don't immediately reflect in reads (can confuse authors)
- **Event versioning** — schema evolution of events is non-trivial
- **Debugging** — harder to trace issues across projections
- **Slowest to MVP** unless team has prior CQRS/ES experience

### Best For
- Teams with event-sourcing experience
- Products where audit trail and compliance are critical
- High read-to-write ratio (many consumers, few authors)
- Multi-channel delivery as a core requirement
- When real-time collaboration is planned early

---

## 6. Architecture Option D — Java/Spring Boot Enterprise Stack

### Philosophy
Enterprise-grade from day one. Mirrors SDL Knowledge Center's own enterprise lineage. Strong typing, mature ecosystem, proven at scale in large organizations.

### Tech Stack
| Layer | Technology |
|---|---|
| **Runtime** | Java 21 (LTS) |
| **Framework** | Spring Boot 3.x + Spring Security + Spring Data |
| **Database** | PostgreSQL 16 |
| **Search** | Elasticsearch / OpenSearch |
| **Cache** | Redis (Spring Cache abstraction) |
| **Auth** | Spring Security + Keycloak (OIDC/SAML) |
| **File Storage** | S3 / MinIO (via Spring Cloud AWS) |
| **API** | REST (Spring Web) + GraphQL (Spring for GraphQL) |
| **Workflow Engine** | Camunda 8 (embedded) or custom state machine |
| **Editor Frontend** | React + TipTap |
| **Build** | Gradle (Kotlin DSL) |
| **Deployment** | Docker → K8s / AWS ECS |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                   DocMesh (Spring Boot)                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Content      │  │  Publication │  │  Workflow Engine   │ │
│  │  Domain       │  │  Domain      │  │  (Camunda /       │ │
│  │  (Entities,   │  │  (Assemblies,│  │   State Machine)  │ │
│  │   Repos,      │  │   Delivery)  │  │                   │ │
│  │   Services)   │  │              │  │                   │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘ │
│         │                  │                    │            │
│  ┌──────▼──────────────────▼────────────────────▼──────────┐│
│  │              Spring Boot Application Core                ││
│  │  (Security, REST Controllers, GraphQL, Scheduled Tasks)  ││
│  └────────────────────────┬─────────────────────────────────┘│
│                           │                                  │
│  ┌──────────┐  ┌──────────▼────────┐  ┌──────────────────┐  │
│  │  Redis   │  │   PostgreSQL      │  │  Elasticsearch   │  │
│  │ (Cache)  │  │ (JPA Entities)    │  │  (Spring Data    │  │
│  │          │  │                   │  │   Elasticsearch)  │  │
│  └──────────┘  └───────────────────┘  └──────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  S3 / MinIO (File & Asset Storage)                       ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│  React + TipTap     │
│  (Editor Frontend)  │
└─────────────────────┘
```

### Pros
- **Enterprise familiarity** — Java/Spring is the standard in enterprises that use SDL KC today
- **Mature ecosystem** — Camunda for workflows, Spring Security for enterprise auth (SAML, LDAP, OIDC)
- **Strong typing** — compile-time safety, refactoring confidence
- **Battle-tested at scale** — Spring Boot runs in millions of production systems
- **Easier to sell to enterprises** — Java is a safer bet for procurement teams
- **Camunda** provides a production-grade BPMN workflow engine out of the box

### Cons
- **Heavier development** — more boilerplate than Node.js/NestJS
- **Slower iteration** — compile-test cycle longer than Node (mitigated by Spring DevTools)
- **Harder to attract modern developers** — some perceive Java as "old"
- **Memory footprint** — JVM baseline is higher than Node.js
- **Frontend/Backend gap** — different languages for front and back

### Best For
- Teams with Java/Spring experience
- Enterprise customers as primary market (banks, pharma, government)
- When workflow complexity is high (multi-level approvals, audit trails)
- Organizations already running JVM infrastructure
- When SAML/LDAP/enterprise SSO is a first-class requirement

---

## 7. Comparison Matrix

| Criterion | A: Monolith (Node) | B: Microservices | C: Event-Driven | D: Spring Boot |
|---|:---:|:---:|:---:|:---:|
| **Time to MVP** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **Operational Simplicity** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Scalability** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Team Size (ideal)** | 1–5 | 5–20 | 3–15 | 3–15 |
| **Dev Experience** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Enterprise Readiness** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Audit / Compliance** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Real-time / Collab** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Multi-channel Delivery** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Self-Hosted Friendly** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Learning Curve** | Low | High | Very High | Medium |
| **Infra Cost (start)** | $ | $$$$ | $$$ | $$ |

---

## 8. Recommended Phased Roadmap

### Phase 1 — Foundation (Months 1–3)

**Goal:** Working CCMS with basic authoring, content model, and API delivery.

| Milestone | A: Monolith | B: Microservices | C: Event-Driven | D: Spring Boot |
|---|---|---|---|---|
| Project setup | NestJS monorepo | K8s + Gateway + 2 services | NestJS + EventStoreDB | Spring Boot + Gradle |
| Content model | PG tables + JSONB | Content Service (PG) | Event schemas + projections | JPA entities + PG |
| CRUD API | REST controllers | Content Service REST | Command handlers + Read API | Spring REST controllers |
| Auth | Passport + JWT | Auth Service / Keycloak | Keycloak (external) | Spring Security + Keycloak |
| Basic editor | React + TipTap | React + TipTap | React + TipTap | React + TipTap |
| Content delivery | Same API, filtered | Delivery Service (Go) | Read API from projection | Same API, cached |
| Search | PG full-text | Elasticsearch | Elasticsearch projection | Elasticsearch |

**Deliverable:** Authors can create structured topics, organize them, and consumers can fetch content via API.

---

### Phase 2 — Reuse & Publishing (Months 4–6)

| Feature | Details |
|---|---|
| **Content References** | Embed/link/conref between content items. "Where used" tracking. |
| **Publications** | Group topics into ordered, hierarchical publications (like DITA maps). |
| **Versioning** | Version history with diff view. Ability to restore previous versions. |
| **Conditional Publishing** | Tag content with conditions (platform, audience). Filter at delivery time. |
| **Improved Editor** | Drag-and-drop reordering, inline reference insertion, markdown shortcuts. |
| **Basic RBAC** | Roles: Admin, Author, Reviewer, Consumer. Permissions per org/folder. |

---

### Phase 3 — Workflows & Localization (Months 7–10)

| Feature | Details |
|---|---|
| **Review Workflows** | Configurable state machine: Draft → In Review → Approved → Published. Assignment, comments, rejection. |
| **Localization** | Multi-locale content. Locale fallback chains (e.g., fr-CA → fr → en). Translation status tracking. |
| **Taxonomy & Metadata** | Custom taxonomies per org. Tag/classify content. Faceted search. |
| **Webhooks** | Emit events on publish, review state change, etc. Configurable per org. |
| **PDF Export** | Generate PDF from publication tree. Basic styling. |
| **Dashboard & Analytics** | Content coverage, reuse metrics, stale content detection. |

---

### Phase 4 — Scale & Intelligence (Months 11–15)

| Feature | Details |
|---|---|
| **AI-Assisted Authoring** | Summarization, rewrite suggestions, reuse detection via embeddings. |
| **Semantic Search** | Vector search (pgvector / Qdrant) for natural-language queries over content. |
| **Real-time Collaboration** | Operational transforms or CRDTs for concurrent editing (Yjs + TipTap). |
| **Mobile SDKs** | Native SDKs for iOS/Android to fetch and render content. |
| **Plugin System** | Extension points for custom content types, delivery transforms, auth providers. |
| **DITA Import/Export** | Import existing DITA content from SDL KC or other CCMS. Export to DITA. |
| **TMS Integration** | Integrate with translation management systems (memoQ, Phrase, etc.). |
| **Content-as-Code** | Git-based workflow: edit in markdown/MDX, sync to DocMesh via CI. |

---

## 9. Decision Criteria

Use this checklist to pick your architecture:

| Question | If Yes → |
|---|---|
| Is your team ≤ 3 devs? | **Option A** (Monolith) |
| Do you need an MVP in < 3 months? | **Option A** (Monolith) |
| Is your target audience enterprises (banks, pharma, govt)? | **Option D** (Spring Boot) |
| Does your team have strong Java/Spring experience? | **Option D** (Spring Boot) |
| Do you expect > 100K daily content reads? | **Option B or C** |
| Is audit trail / compliance a regulatory requirement? | **Option C** (Event-Driven) |
| Is real-time collaboration a Phase 1 requirement? | **Option C** (Event-Driven) |
| Does your team have Kubernetes + microservices experience? | **Option B** (Microservices) |
| Will different teams own different capabilities? | **Option B** (Microservices) |
| Do you want self-hosted simplicity above all? | **Option A** (Monolith) |

### Hybrid Recommendation

**Start with Option A, evolve toward B or C.**

Most successful open-source CCMS projects start as a well-structured monolith (NestJS modules = natural service boundaries), then extract hot paths (delivery, search) into separate services as scale demands. This gives you:

- Fast MVP delivery
- Low operational cost in early stages
- Clear extraction points when you need to scale
- Ability to introduce event-driven patterns incrementally (e.g., add an event bus for webhooks in Phase 3, then use it for CQRS separation if needed)

---

## Next Steps

1. **Pick an architecture** from the options above
2. **Define the content model** in detail (topic types, metadata schema)
3. **Set up the project scaffold** (monorepo, CI/CD, Docker)
4. **Build Phase 1** — content CRUD + basic editor + delivery API
5. **Validate with users** — get feedback before investing in Phase 2

---

*Document created: 2026-03-22*
*Status: Awaiting architecture decision*

# DocMesh — Comprehensive Feature Roadmap

> Full SDL Knowledge Center feature parity plan.
> Each feature is scoped, prioritized, and ready for implementation.

---

## Current State (Implemented)

| # | Feature | Status |
|---|---|---|
| 1 | Structured content model (topic, task, reference, note, warning) | Done |
| 2 | Content CRUD REST API with pagination & filtering | Done |
| 3 | Linear version history (auto-snapshot on every save) | Done |
| 4 | JWT authentication (register, login, profile) | Done |
| 5 | Multi-tenant organization scoping | Done |
| 6 | Publications with hierarchical entries | Done |
| 7 | Public content delivery API (by slug, locale, platform) | Done |
| 8 | TipTap rich text editor (WYSIWYG) | Done |
| 9 | Swagger / OpenAPI documentation | Done |
| 10 | Docker Compose deployment | Done |

---

## Roadmap — 8 Phases, 52 Features

### Phase 1 — DITA Content Model & Structured Authoring ✅ IMPLEMENTED
*Full DITA-style structured authoring in DocMesh.*

| # | Feature | Description | SDL KC Equivalent | Complexity |
|---|---|---|---|---|
| 1.1 | **DITA topic types** | Expand content types: Concept, Task, Reference, Glossary Entry, Troubleshooting | DITA topic specializations | Medium |
| 1.2 | **Task step model** | Structured steps with sub-steps, step results, info, notes inside tasks | DITA `<steps>` / `<substeps>` | Medium |
| 1.3 | **Short descriptions** | `shortdesc` field for every content item (used in link previews, search, TOC hover) | DITA `<shortdesc>` | Low |
| 1.4 | **Related links** | Typed relationships between content: parent, child, sibling, see-also, prerequisite | DITA `<related-links>`, `<reltable>` | Medium |
| 1.5 | **Prolog / metadata block** | Structured metadata: author, source, audience, category, keywords, permissions | DITA `<prolog>` | Medium |
| 1.6 | **Body sub-elements** | Sections, examples, code samples, tables, figures, definition lists as block types | DITA body elements | Medium |
| 1.7 | **Inline elements** | UI control, filepath, code phrase, system output, keyboard shortcut, API name | DITA inline domain elements | Low |
| 1.8 | **DITA import** | Import DITA XML files (.dita, .ditamap) → parse into DocMesh content model | Tridion Docs import | High |
| 1.9 | **DITA export** | Export DocMesh content back to valid DITA XML | Tridion Docs export | High |

---

### Phase 2 — Content Reuse & References
*SDL KC's most critical differentiator: reuse content fragments everywhere.*

| # | Feature | Description | SDL KC Equivalent | Complexity |
|---|---|---|---|---|
| 2.1 | **Content references (conref)** | Embed a fragment from one content item inside another (resolved at delivery) | DITA `conref` | High |
| 2.2 | **Key references (conkeyref)** | Indirect references via keys — remap content by changing key bindings | DITA `conkeyref` | High |
| 2.3 | **Key maps** | Define key → content mappings per publication or context | DITA `<keydef>` / `<map>` keys | Medium |
| 2.4 | **Variable system** | Reusable variables (product name, version, URL) that resolve per publication/context | SDL KC variables | Medium |
| 2.5 | **Content fragments** | Create standalone reusable fragments (warnings, legal text, notes) that are embeddable | SDL KC reusable components | Medium |
| 2.6 | **Where-used tracking** | Show everywhere a content item, fragment, or key is referenced | SDL KC "Used In" report | Medium |
| 2.7 | **Dependency graph** | Visualize reference chains: what depends on what, impact analysis before edits | SDL KC dependency view | Medium |
| 2.8 | **Broken reference detection** | Detect and report orphaned or broken references across all content | SDL KC link health | Low |

---

### Phase 3 — DITA Maps & Publishing
*Organize content into publications and produce multiple output formats.*

| # | Feature | Description | SDL KC Equivalent | Complexity |
|---|---|---|---|---|
| 3.1 | **DITA Map model** | Full map structure: topicref, topichead, topicgroup, navtitle, TOC control, print/no-print | DITA `<map>`, `<bookmap>` | High |
| 3.2 | **Bookmap support** | Extended map: front matter, chapters, parts, appendixes, back matter, glossary | DITA `<bookmap>` | Medium |
| 3.3 | **Nested map references** | Maps that include other maps (`<mapref>`) for modular publication assembly | DITA `<mapref>` | Medium |
| 3.4 | **Conditional filtering (DITAVAL)** | Filter content in/out at publish time based on audience, platform, product, otherprops | DITA `<ditaval>`, SDL KC conditions | High |
| 3.5 | **Publishing profiles** | Named configurations: output format + conditions + variables + branding | SDL KC output formats | Medium |
| 3.6 | **HTML5 output** | Publish a map to a responsive, navigable HTML5 site with TOC sidebar | Tridion Docs HTML5 | High |
| 3.7 | **PDF output** | Publish a map to formatted PDF via a template engine (e.g., paged.js or Puppeteer) | Tridion Docs PDF/print | High |
| 3.8 | **JSON output** | Publish a map to structured JSON for API consumers | DocMesh native | Medium |
| 3.9 | **Publish queue** | Async job-based publishing with status tracking, logs, retry | SDL KC publish pipeline | Medium |
| 3.10 | **Published output storage** | Store published outputs (HTML, PDF, JSON) in S3/MinIO, serve via CDN | SDL KC output repository | Medium |
| 3.11 | **Publish preview** | Preview unpublished content as it would appear in final output | SDL KC preview | Medium |

---

### Phase 4 — Versioning & Branching
*Enterprise-grade version control for content.*

| # | Feature | Description | SDL KC Equivalent | Complexity |
|---|---|---|---|---|
| 4.1 | **Version history with diff** | Side-by-side or inline diff between any two versions of a content item | SDL KC version compare | Medium |
| 4.2 | **Version labels / tags** | Label specific versions: "v2.1 Release", "Approved 2026-Q1" | SDL KC version labels | Low |
| 4.3 | **Branching** | Create content branches for parallel work on different releases | SDL KC branching | High |
| 4.4 | **Branch merging** | Merge changes from one branch into another with conflict detection | SDL KC merge | High |
| 4.5 | **Baselines / snapshots** | Freeze a set of content at specific versions to define a release baseline | SDL KC baselines | High |
| 4.6 | **Restore / rollback** | Revert a content item to any previous version | SDL KC rollback | Low |
| 4.7 | **Draft / release lifecycle** | Draft → Release Candidate → Released → Retired lifecycle per content item | SDL KC lifecycle states | Medium |
| 4.8 | **Release management** | Define releases, associate baselines, track content coverage per release | SDL KC release management | Medium |

---

### Phase 5 — Review Workflows & Collaboration
*Multi-step content review and approval processes.*

| # | Feature | Description | SDL KC Equivalent | Complexity |
|---|---|---|---|---|
| 5.1 | **Configurable workflow engine** | Define custom workflows: states, transitions, roles, conditions | SDL KC configurable workflows | High |
| 5.2 | **Built-in workflows** | Pre-built: Draft → Review → Approved → Published; Draft → SME Review → Tech Review → Published | SDL KC default workflows | Medium |
| 5.3 | **Reviewer assignment** | Assign one or more reviewers to a content item or set of items | SDL KC task assignment | Medium |
| 5.4 | **Inline review comments** | Comment on specific text ranges within content body (threaded) | SDL KC annotations | High |
| 5.5 | **Review dashboard** | Reviewer's inbox: items awaiting review, past reviews, deadlines | SDL KC review dashboard | Medium |
| 5.6 | **Approval gates** | Require all reviewers to approve before content can proceed to next state | SDL KC approval gates | Medium |
| 5.7 | **Due dates & reminders** | Set deadlines on review tasks, send email/notification reminders | SDL KC task tracking | Medium |
| 5.8 | **Audit trail** | Log every state change: who, when, from-state, to-state, comments | SDL KC audit log | Low |
| 5.9 | **Real-time collaborative editing** | Multiple users editing the same content simultaneously (CRDT/Yjs) | Modern enhancement | High |
| 5.10 | **Notifications** | In-app + email notifications for assignments, mentions, status changes | SDL KC notifications | Medium |

---

### Phase 6 — Localization & Translation Management
*Multi-language content with translation workflows.*

| # | Feature | Description | SDL KC Equivalent | Complexity |
|---|---|---|---|---|
| 6.1 | **Multi-locale content** | Each content item can exist in multiple locales (en, fr, de, ja, etc.) | SDL KC language versions | Medium |
| 6.2 | **Locale fallback chains** | Configurable fallback: fr-CA → fr → en (per org/publication) | SDL KC fallback | Medium |
| 6.3 | **Translation status tracking** | Per-item tracking: Not Translated → In Translation → Translated → Reviewed | SDL KC translation status | Medium |
| 6.4 | **Source change detection** | Flag translations as out-of-date when source locale is updated | SDL KC out-of-date detection | Medium |
| 6.5 | **TMS integration (API)** | Push content to translation management systems (memoQ, Phrase, Trados) | SDL KC TMS connectors | High |
| 6.6 | **XLIFF export/import** | Export translatable content as XLIFF 2.0, import translated XLIFF back | SDL KC XLIFF | Medium |
| 6.7 | **Side-by-side translation editor** | Editor showing source locale and target locale side by side | SDL KC translation view | Medium |
| 6.8 | **Language-specific metadata** | Locale-specific titles, short descriptions, keywords | SDL KC lang metadata | Low |
| 6.9 | **RTL support** | Right-to-left layout for Arabic, Hebrew, etc. | SDL KC RTL | Medium |

---

### Phase 7 — Access Control, Taxonomy & Search
*Enterprise-grade permissions, classification, and discovery.*

| # | Feature | Description | SDL KC Equivalent | Complexity |
|---|---|---|---|---|
| 7.1 | **Role-based access control** | Roles: Admin, Author, Reviewer, Publisher, Viewer with granular permissions | SDL KC RBAC | Medium |
| 7.2 | **Folder-level permissions** | Set permissions per folder/publication — inherit or override | SDL KC folder security | Medium |
| 7.3 | **User groups / teams** | Group users into teams, assign permissions to teams | SDL KC user groups | Medium |
| 7.4 | **SSO integration (OIDC/SAML)** | Enterprise SSO via Keycloak, Okta, Azure AD, Google | SDL KC LDAP/SSO | High |
| 7.5 | **API keys** | Service-to-service authentication for delivery consumers | SDL KC API auth | Low |
| 7.6 | **Taxonomy management** | Create hierarchical taxonomies (product, audience, category, technology) | SDL KC taxonomies | Medium |
| 7.7 | **Tagging** | Tag content items with taxonomy terms and free-form tags | SDL KC metadata | Low |
| 7.8 | **Full-text search** | Search across title, body, metadata with relevance ranking (PostgreSQL FTS) | SDL KC search | Medium |
| 7.9 | **Faceted search** | Filter search results by type, status, locale, taxonomy, date range | SDL KC filtered search | Medium |
| 7.10 | **Semantic / AI search** | Vector embeddings (pgvector) for natural-language queries | Modern enhancement | High |

---

### Phase 8 — Integrations, Analytics & Advanced Features
*Extensibility, intelligence, and operational visibility.*

| # | Feature | Description | SDL KC Equivalent | Complexity |
|---|---|---|---|---|
| 8.1 | **Webhooks** | HTTP callbacks on events: published, reviewed, translated, deleted | SDL KC event system | Medium |
| 8.2 | **Event log / activity stream** | Global feed of all changes across the organization | SDL KC event log | Medium |
| 8.3 | **Content analytics dashboard** | Reuse rate, stale content, coverage per publication, contributor stats | SDL KC reports | Medium |
| 8.4 | **Link / reference health report** | Broken links, orphaned content, circular references | SDL KC link checker | Medium |
| 8.5 | **AI-assisted authoring** | Suggest rewrites, generate summaries, detect reuse opportunities | Modern enhancement | High |
| 8.6 | **Content-as-code** | Sync content via Git (Markdown/MDX → DocMesh) for developer workflows | Modern enhancement | High |
| 8.7 | **Plugin / extension system** | Register custom content types, output formats, editor extensions | SDL KC extensions | High |
| 8.8 | **Batch operations** | Bulk update status, locale, metadata, move, delete across content | SDL KC bulk operations | Medium |
| 8.9 | **Mobile SDKs** | Native iOS/Android SDKs for fetching and rendering content | Modern enhancement | High |
| 8.10 | **Content comparison tool** | Compare any two content items side-by-side (not just versions) | SDL KC compare | Medium |
| 8.11 | **Image / asset management** | Upload, store, tag, and reference images and files within content | SDL KC asset management | Medium |
| 8.12 | **Trash / soft delete** | Deleted items go to trash, recoverable for 30 days | SDL KC recycle bin | Low |

---

### Phase 9 — Desktop Application (Electron)
*Standalone native desktop app for Windows, macOS, and Linux.*

| # | Feature | Description | Complexity |
|---|---|---|---|
| 9.1 | **Electron shell** | Wrap the React web app in Electron for native desktop delivery | Done |
| 9.2 | **Windows installer (NSIS)** | Build `.exe` installer with install path selection, shortcuts | Done |
| 9.3 | **macOS bundle (DMG)** | Build `.dmg` for macOS (x64 + Apple Silicon) | Done |
| 9.4 | **Linux packages (AppImage/deb)** | Build `.AppImage` and `.deb` for Linux | Done |
| 9.5 | **Custom protocol handler** | `docmesh://` protocol for SPA routing in production builds | Done |
| 9.6 | **Auto-updater** | Check for and install updates automatically (electron-updater) | Medium |
| 9.7 | **Native OS integration** | System tray, native notifications, file associations (.dita, .ditamap) | Medium |
| 9.8 | **Offline mode** | Cache content locally for offline authoring, sync when reconnected | High |
| 9.9 | **Local file system access** | Open/save DITA files directly from/to local disk | Medium |
| 9.10 | **Code signing** | Sign binaries for Windows (EV cert) and macOS (Apple Developer ID) | Medium |

---

## Summary — Feature Count by Phase

| Phase | Focus Area | Features | Key Deliverable |
|---|---|---|---|
| **Phase 1** | DITA Content Model & Structured Authoring | 9 | Full DITA topic types, import/export |
| **Phase 2** | Content Reuse & References | 8 | conref, conkeyref, variables, where-used |
| **Phase 3** | DITA Maps & Publishing | 11 | Maps, DITAVAL filters, HTML5/PDF/JSON output |
| **Phase 4** | Versioning & Branching | 8 | Diff, branches, baselines, releases |
| **Phase 5** | Review Workflows & Collaboration | 10 | Custom workflows, inline comments, real-time editing |
| **Phase 6** | Localization & Translation | 9 | Multi-locale, TMS integration, XLIFF |
| **Phase 7** | Access Control, Taxonomy & Search | 10 | RBAC, SSO, taxonomies, semantic search |
| **Phase 8** | Integrations, Analytics & Advanced | 12 | Webhooks, AI authoring, plugins, asset mgmt |
| **Phase 9** | Desktop Application (Electron) | 10 | Native apps for Windows, macOS, Linux |
| | **Total** | **87 features** | |

---

## Implementation Priority Matrix

Features recommended to implement first within each phase:

### Quick Wins (Low complexity, high value)
- 1.3 Short descriptions
- 1.7 Inline elements
- 2.6 Where-used tracking
- 4.2 Version labels
- 4.6 Restore / rollback
- 5.8 Audit trail
- 7.5 API keys
- 7.7 Tagging
- 8.12 Trash / soft delete

### High Impact (Worth the complexity)
- 2.1 Content references (conref) — core CCMS capability
- 3.4 Conditional filtering (DITAVAL) — critical for multi-audience delivery
- 3.6 HTML5 output — primary output format
- 4.1 Version diff — essential for authors
- 5.1 Workflow engine — enterprise requirement
- 6.1 Multi-locale content — globalization baseline
- 7.1 RBAC — security baseline

### Strategic (Long-term differentiators)
- 1.8/1.9 DITA import/export — migration path from SDL KC
- 5.9 Real-time collaborative editing — modern UX
- 8.5 AI-assisted authoring — competitive advantage
- 8.6 Content-as-code — developer workflow

---

## Suggested Implementation Order

```
Phase 1 (features 1.1–1.7)     ← start here
    ↓
Phase 2 (2.1–2.8)              ← content reuse
    ↓
Phase 4 (4.1–4.6)              ← versioning depth
    ↓
Phase 7 (7.1, 7.5–7.9)        ← RBAC + search
    ↓
Phase 3 (3.1–3.11)             ← maps + publishing
    ↓
Phase 5 (5.1–5.8)              ← workflows
    ↓
Phase 6 (6.1–6.9)              ← localization
    ↓
Phase 8 (8.1–8.12)             ← integrations + AI
    ↓
Phase 1.8–1.9                  ← DITA import/export (after model is stable)
Phase 4.3–4.5                  ← branching/baselines (after versioning)
Phase 5.9                      ← real-time collab (after workflows)
```

---

## Next Step

**Pick a phase (or specific feature) to implement next.**

Recommended starting point: **Phase 1 — DITA Content Model** — this expands the content model that everything else builds on.

---

*Document created: 2026-03-22*
*Status: Awaiting feature selection*

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

export interface OrgUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export interface TaskStep {
  id: string;
  stepNumber: number;
  title: string;
  body: Record<string, unknown>;
  stepResult: string;
  info: string;
  parentStepId: string | null;
  subSteps?: TaskStep[];
}

export interface RelatedLink {
  id: string;
  targetItemId: string;
  targetItem?: { id: string; title: string; slug: string; type: string };
  relationType: string;
  navTitle: string;
  sortOrder: number;
}

export interface Prolog {
  author?: string;
  source?: string;
  audience?: string;
  category?: string;
  keywords?: string[];
  permissions?: string;
}

export interface ContentItem {
  id: string;
  slug: string;
  type: 'topic' | 'concept' | 'task' | 'reference' | 'glossary' | 'troubleshooting';
  title: string;
  shortDescription: string;
  body: Record<string, unknown>;
  metadata: Record<string, unknown>;
  prolog: Prolog;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  locale: string;
  parentId: string | null;
  sortOrder: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  steps?: TaskStep[];
  relatedLinks?: RelatedLink[];
}

export interface ContentListResponse {
  items: ContentItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

/* ── Publications ── */
export interface PublicationEntry {
  id: string;
  contentItemId: string;
  contentItem?: ContentItem;
  parentEntryId: string | null;
  sortOrder: number;
  children?: PublicationEntry[];
}

export interface Publication {
  id: string;
  title: string;
  slug: string;
  locale: string;
  entries: PublicationEntry[];
  createdAt: string;
  updatedAt: string;
}

/* ── Review Workflows ── */
export interface ReviewTask {
  id: string;
  contentItemId: string;
  contentItem?: ContentItem;
  workflowInstanceId: string | null;
  assigneeId: string;
  assignedBy: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
  instructions: string;
  reviewNotes: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewComment {
  id: string;
  contentItemId: string;
  reviewTaskId: string | null;
  authorId: string;
  body: string;
  textRange: { from: number; to: number } | null;
  parentCommentId: string | null;
  resolved: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
}

/* ── Access Control ── */
export interface UserGroup {
  id: string;
  name: string;
  description: string;
  members?: OrgUser[];
  createdAt: string;
}

export interface Permission {
  id: string;
  role: string;
  resource: string;
  action: string;
  allowed: boolean;
}

/* ── Templates & Snippets ── */
export interface ContentTemplate {
  id: string;
  title: string;
  slug: string;
  description: string;
  contentType: string;
  body: Record<string, unknown>;
  metadata: Record<string, unknown>;
  prolog: Record<string, unknown>;
  ditaSections: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Snippet {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  body: Record<string, unknown>;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Quality Scoring ── */
export interface QualityScore {
  id: string;
  contentItemId: string;
  overallScore: number;
  readabilityScore: number;
  fleschKincaidGrade: number;
  wordCount: number;
  avgSentenceLength: number;
  structureScore: number;
  completenessScore: number;
  brokenLinks: number;
  issues: { type: string; severity: string; message: string; field?: string }[];
  scoredAt: string;
}

export interface QualityStats {
  totalScored: number;
  avgScore: number;
  avgReadability: number;
  totalBrokenLinks: number;
  totalIssues: number;
}

/* ── Audit Log ── */
export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  details: Record<string, unknown>;
  fromState: string | null;
  toState: string | null;
  createdAt: string;
}

export interface AuditListResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface StalenessStats {
  totalCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  staleCount: number;
}

/* ── Collaboration ── */
export interface ApprovalStep {
  stepNumber: number;
  title: string;
  assigneeIds: string[];
  requiredApprovals: number;
  parallel: boolean;
  status: string;
  approvedBy: string[];
  rejectedBy: string[];
  completedAt: string | null;
}

export interface ApprovalChain {
  id: string;
  contentItemId: string;
  title: string;
  status: string;
  currentStep: number;
  steps: ApprovalStep[];
  createdBy: string;
  createdAt: string;
}

export interface Discussion {
  id: string;
  contentItemId: string;
  body: string;
  authorId: string;
  parentId: string | null;
  sectionRef: { sectionId: string; from: number; to: number } | null;
  mentions: string[];
  resolved: boolean;
  createdAt: string;
}

export interface ContentLockInfo {
  id: string;
  contentItemId: string;
  lockedBy: string;
  reason: string;
  lockType: string;
  lockedAt: string;
  expiresAt: string | null;
}

export interface PresenceInfo {
  id: string;
  userId: string;
  userName: string;
  contentItemId: string | null;
  status: string;
  lastSeen: string;
}

/* ── Publishing & Delivery ── */
export interface OutputTemplate {
  id: string;
  name: string;
  format: string;
  htmlTemplate: string;
  cssStyles: string;
  variables: Record<string, string>;
  coverPageHtml: string;
  headerHtml: string;
  footerHtml: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledPublishItem {
  id: string;
  contentItemId: string | null;
  publicationId: string | null;
  scheduledAt: string;
  status: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface CdnConfigInfo {
  id: string;
  provider: string;
  baseUrl: string;
  zoneId: string;
  defaultTtl: number;
  ttlOverrides: Record<string, number>;
  enabled: boolean;
}

export interface SiteBuildInfo {
  id: string;
  publicationId: string;
  templateId: string | null;
  status: string;
  theme: string;
  outputUrl: string;
  fileCount: number;
  totalSizeBytes: number;
  buildLog: { timestamp: string; message: string }[];
  builtBy: string;
  createdAt: string;
  completedAt: string | null;
}

/* ── Platform & Ecosystem ── */
export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  source: string;
  status: string;
  hooks: string[];
  config: Record<string, unknown>;
  installedBy: string;
  createdAt: string;
}

export interface GitSyncConfigInfo {
  id: string;
  provider: string;
  repoUrl: string;
  branch: string;
  direction: string;
  contentFormat: string;
  syncPath: string;
  enabled: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  createdAt: string;
}

export interface WebhookInfo {
  id: string;
  platform: string;
  name: string;
  webhookUrl: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
}

export interface AnalyticsDashboard {
  totalViews: number;
  totalSearches: number;
  topViewed: { entityId: string; views: string }[];
  authorStats: { authorId: string; itemCount: string }[];
  eventBreakdown: { eventType: string; count: string }[];
  period: string;
}

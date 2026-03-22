export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  organizationId: string;
  organizationName: string;
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

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  organizationId: string;
  organizationName: string;
}

export interface ContentItem {
  id: string;
  slug: string;
  type: 'topic' | 'task' | 'reference' | 'note' | 'warning';
  title: string;
  body: Record<string, unknown>;
  metadata: Record<string, unknown>;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  locale: string;
  parentId: string | null;
  sortOrder: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
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

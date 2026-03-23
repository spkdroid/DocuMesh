import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { Publication, ContentItem, ContentListResponse } from '../types';
import './Publications.css';

export default function Publications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState('');
  const navigate = useNavigate();

  const fetchPublications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Publication[]>('/publications');
      setPublications(data);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.post('/publications', { title, slug: slug || undefined });
      setTitle('');
      setSlug('');
      setShowCreate(false);
      fetchPublications();
    } catch {
      alert('Failed to create publication');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this publication and all its entries?')) return;
    await api.delete(`/publications/${id}`);
    fetchPublications();
  };

  const handleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    try {
      const { data } = await api.get<Publication>(`/publications/${id}`);
      setPublications((prev) =>
        prev.map((p) => (p.id === id ? { ...p, entries: data.entries } : p)),
      );
      setExpanded(id);
    } catch {
      /* handled */
    }
  };

  const openAddContent = async (pubId: string) => {
    setAddingTo(pubId);
    try {
      const { data } = await api.get<ContentListResponse>('/content', {
        params: { limit: 100 },
      });
      setContentItems(data.items);
    } catch {
      /* handled */
    }
  };

  const handleAddEntry = async (pubId: string) => {
    if (!selectedContent) return;
    try {
      await api.post(`/publications/${pubId}/entries`, {
        contentItemId: selectedContent,
      });
      setAddingTo(null);
      setSelectedContent('');
      handleExpand(pubId);
    } catch {
      alert('Failed to add entry');
    }
  };

  const handleRemoveEntry = async (pubId: string, entryId: string) => {
    await api.delete(`/publications/${pubId}/entries/${entryId}`);
    handleExpand(pubId);
  };

  return (
    <div className="publications-page">
      <div className="page-header">
        <div>
          <h1>Publications</h1>
          <p className="text-secondary">
            Organize content into publishable collections
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreate(!showCreate)}
        >
          + New Publication
        </button>
      </div>

      {showCreate && (
        <div className="create-card">
          <h3>Create Publication</h3>
          <div className="create-form">
            <input
              type="text"
              placeholder="Publication title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Slug (optional, auto-generated)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <div className="create-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={creating || !title.trim()}
                onClick={handleCreate}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : publications.length === 0 ? (
        <div className="empty-state">
          <p>No publications yet.</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
          >
            Create your first publication
          </button>
        </div>
      ) : (
        <div className="pub-list">
          {publications.map((pub) => (
            <div key={pub.id} className="pub-card">
              <div className="pub-row">
                <div
                  className="pub-info"
                  onClick={() => handleExpand(pub.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="pub-expand">
                    {expanded === pub.id ? '▾' : '▸'}
                  </span>
                  <div>
                    <h3 className="pub-title">{pub.title}</h3>
                    <span className="text-secondary pub-meta">
                      {pub.slug} · {pub.locale} · Updated{' '}
                      {new Date(pub.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="pub-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openAddContent(pub.id)}
                  >
                    + Add Content
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(pub.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {addingTo === pub.id && (
                <div className="add-entry-row">
                  <select
                    value={selectedContent}
                    onChange={(e) => setSelectedContent(e.target.value)}
                  >
                    <option value="">Select content to add...</option>
                    {contentItems.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.type})
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAddEntry(pub.id)}
                    disabled={!selectedContent}
                  >
                    Add
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setAddingTo(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {expanded === pub.id && (
                <div className="pub-entries">
                  {(!pub.entries || pub.entries.length === 0) ? (
                    <p className="text-secondary entry-empty">
                      No entries yet — add content to this publication.
                    </p>
                  ) : (
                    <table className="entries-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pub.entries.map((entry) => (
                          <tr key={entry.id}>
                            <td
                              className="title-cell"
                              style={{ cursor: 'pointer' }}
                              onClick={() =>
                                entry.contentItem &&
                                navigate(`/content/${entry.contentItemId}`)
                              }
                            >
                              {entry.contentItem?.title || entry.contentItemId}
                            </td>
                            <td>
                              <span className="badge badge-draft">
                                {entry.contentItem?.type}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge badge-${entry.contentItem?.status}`}
                              >
                                {entry.contentItem?.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() =>
                                  handleRemoveEntry(pub.id, entry.id)
                                }
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { Snippet } from '../types';
import './Snippets.css';

export default function Snippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'general', tags: '' });

  const fetchSnippets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category) params.category = category;
      const { data } = await api.get<Snippet[]>('/templates/snippets/all', { params });
      setSnippets(data);
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchSnippets(); }, [fetchSnippets]);

  const handleSave = async () => {
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    if (editId) {
      await api.patch(`/templates/snippets/${editId}`, payload);
    } else {
      await api.post('/templates/snippets', payload);
    }
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', description: '', category: 'general', tags: '' });
    fetchSnippets();
  };

  const handleEdit = (s: Snippet) => {
    setEditId(s.id);
    setForm({ title: s.title, description: s.description, category: s.category, tags: s.tags.join(', ') });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this snippet?')) return;
    await api.delete(`/templates/snippets/${id}`);
    fetchSnippets();
  };

  const categories = [...new Set(snippets.map((s) => s.category))];

  return (
    <div className="snippets-page">
      <div className="page-header">
        <div>
          <h1>Snippet Library</h1>
          <p className="text-secondary">Reusable text blocks</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', description: '', category: 'general', tags: '' }); }}>
          + New Snippet
        </button>
      </div>

      <div className="page-filters">
        <input
          type="text"
          placeholder="Search snippets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="snippet-form card">
          <h3>{editId ? 'Edit Snippet' : 'New Snippet'}</h3>
          <input type="text" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input type="text" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input type="text" placeholder="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : snippets.length === 0 ? (
        <div className="empty-state"><p>No snippets yet.</p></div>
      ) : (
        <div className="snippets-grid">
          {snippets.map((s) => (
            <div key={s.id} className="snippet-card card">
              <div className="snippet-card-header">
                <h3>{s.title}</h3>
                <span className="badge badge-draft">{s.category}</span>
              </div>
              <p className="text-secondary">{s.description || 'No description'}</p>
              {s.tags.length > 0 && (
                <div className="snippet-tags">
                  {s.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
              <div className="snippet-card-footer">
                <span className="text-secondary">{new Date(s.updatedAt).toLocaleDateString()}</span>
                <div className="snippet-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(s)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { ContentTemplate } from '../types';
import './Templates.css';

export default function Templates() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', contentType: 'topic', description: '' });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const { data } = await api.get<ContentTemplate[]>('/templates', { params });
      setTemplates(data);
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = async () => {
    if (editId) {
      await api.patch(`/templates/${editId}`, form);
    } else {
      await api.post('/templates', form);
    }
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', contentType: 'topic', description: '' });
    fetchTemplates();
  };

  const handleEdit = (t: ContentTemplate) => {
    setEditId(t.id);
    setForm({ title: t.title, contentType: t.contentType, description: t.description });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await api.delete(`/templates/${id}`);
    fetchTemplates();
  };

  return (
    <div className="templates-page">
      <div className="page-header">
        <div>
          <h1>Templates</h1>
          <p className="text-secondary">Reusable content blueprints</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', contentType: 'topic', description: '' }); }}>
          + New Template
        </button>
      </div>

      <div className="page-filters">
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div className="template-form card">
          <h3>{editId ? 'Edit Template' : 'New Template'}</h3>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <select
            value={form.contentType}
            onChange={(e) => setForm({ ...form, contentType: e.target.value })}
          >
            <option value="topic">Topic</option>
            <option value="concept">Concept</option>
            <option value="task">Task</option>
            <option value="reference">Reference</option>
            <option value="glossary">Glossary</option>
            <option value="troubleshooting">Troubleshooting</option>
          </select>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <p>No templates yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map((t) => (
            <div key={t.id} className="template-card card">
              <div className="template-card-header">
                <h3>{t.title}</h3>
                <span className="badge badge-draft">{t.contentType}</span>
              </div>
              <p className="text-secondary">{t.description || 'No description'}</p>
              <div className="template-card-footer">
                <span className="text-secondary">
                  {new Date(t.updatedAt).toLocaleDateString()}
                </span>
                <div className="template-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(t)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

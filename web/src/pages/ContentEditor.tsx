import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Editor from '../components/Editor';
import type { ContentItem } from '../types';
import './ContentEditor.css';

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('topic');
  const [status, setStatus] = useState<string>('draft');
  const [locale, setLocale] = useState('en');
  const [body, setBody] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!id) return;
    api.get<ContentItem>(`/content/${id}`).then(({ data }) => {
      setTitle(data.title);
      setType(data.type);
      setStatus(data.status);
      setLocale(data.locale);
      setBody(data.body);
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/content', { type, title, body, locale });
      } else {
        await api.patch(`/content/${id}`, { title, body, status, locale });
      }
      navigate('/dashboard');
    } catch {
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="content-editor-page">
      <form onSubmit={handleSubmit}>
        <div className="editor-header">
          <h1>{isNew ? 'New Content' : 'Edit Content'}</h1>
          <div className="editor-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="editor-meta">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Content title"
            />
          </div>

          <div className="meta-row">
            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={!isNew}
              >
                <option value="topic">Topic</option>
                <option value="task">Task</option>
                <option value="reference">Reference</option>
                <option value="note">Note</option>
                <option value="warning">Warning</option>
              </select>
            </div>

            {!isNew && (
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="locale">Locale</label>
              <input
                id="locale"
                type="text"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                placeholder="en"
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Body</label>
          <Editor content={body} onChange={setBody} />
        </div>
      </form>
    </div>
  );
}

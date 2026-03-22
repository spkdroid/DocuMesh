import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Editor from '../components/Editor';
import type { ContentItem, Prolog } from '../types';
import './ContentEditor.css';

interface StepFormData {
  key: string;
  stepNumber: number;
  title: string;
  body: Record<string, unknown>;
  stepResult: string;
  info: string;
}

let stepKeyCounter = 0;

function createEmptyStep(stepNumber: number): StepFormData {
  return {
    key: `step-${++stepKeyCounter}`,
    stepNumber,
    title: '',
    body: {},
    stepResult: '',
    info: '',
  };
}

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [type, setType] = useState<string>('topic');
  const [status, setStatus] = useState<string>('draft');
  const [locale, setLocale] = useState('en');
  const [body, setBody] = useState<Record<string, unknown>>({});
  const [prolog, setProlog] = useState<Prolog>({});
  const [steps, setSteps] = useState<StepFormData[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [activeTab, setActiveTab] = useState<'body' | 'prolog' | 'steps'>('body');

  useEffect(() => {
    if (!id) return;
    api.get<ContentItem>(`/content/${id}`).then(({ data }) => {
      setTitle(data.title);
      setShortDescription(data.shortDescription || '');
      setType(data.type);
      setStatus(data.status);
      setLocale(data.locale);
      setBody(data.body);
      setProlog(data.prolog || {});
      if (data.steps?.length) {
        setSteps(
          data.steps.map((s) => ({
            key: `step-${++stepKeyCounter}`,
            stepNumber: s.stepNumber,
            title: s.title,
            body: s.body,
            stepResult: s.stepResult || '',
            info: s.info || '',
          })),
        );
      }
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        type,
        title,
        shortDescription,
        body,
        locale,
        prolog,
      };

      if (type === 'task' || type === 'troubleshooting') {
        payload.steps = steps.map((s, i) => ({
          stepNumber: i + 1,
          title: s.title,
          body: s.body,
          stepResult: s.stepResult,
          info: s.info,
        }));
      }

      if (isNew) {
        await api.post('/content', payload);
      } else {
        await api.patch(`/content/${id}`, { ...payload, status });
      }
      navigate('/dashboard');
    } catch {
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const showStepsTab = type === 'task' || type === 'troubleshooting';

  const addStep = () => {
    setSteps((prev) => [...prev, createEmptyStep(prev.length + 1)]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof StepFormData, value: unknown) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
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

          <div className="form-group">
            <label htmlFor="shortDescription">Short Description</label>
            <textarea
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief description for previews and search results"
              rows={2}
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
                <option value="concept">Concept</option>
                <option value="task">Task</option>
                <option value="reference">Reference</option>
                <option value="glossary">Glossary</option>
                <option value="troubleshooting">Troubleshooting</option>
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

        {/* Tabs */}
        <div className="editor-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => setActiveTab('body')}
          >
            Body
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'prolog' ? 'active' : ''}`}
            onClick={() => setActiveTab('prolog')}
          >
            Prolog / Metadata
          </button>
          {showStepsTab && (
            <button
              type="button"
              className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
              onClick={() => setActiveTab('steps')}
            >
              Steps ({steps.length})
            </button>
          )}
        </div>

        {/* Body Tab */}
        {activeTab === 'body' && (
          <div className="form-group">
            <Editor content={body} onChange={setBody} />
          </div>
        )}

        {/* Prolog Tab */}
        {activeTab === 'prolog' && (
          <div className="prolog-editor">
            <div className="prolog-grid">
              <div className="form-group">
                <label htmlFor="prolog-author">Author</label>
                <input
                  id="prolog-author"
                  type="text"
                  value={prolog.author || ''}
                  onChange={(e) => setProlog({ ...prolog, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-source">Source</label>
                <input
                  id="prolog-source"
                  type="text"
                  value={prolog.source || ''}
                  onChange={(e) => setProlog({ ...prolog, source: e.target.value })}
                  placeholder="Source reference"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-audience">Audience</label>
                <input
                  id="prolog-audience"
                  type="text"
                  value={prolog.audience || ''}
                  onChange={(e) => setProlog({ ...prolog, audience: e.target.value })}
                  placeholder="e.g. administrators, developers"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-category">Category</label>
                <input
                  id="prolog-category"
                  type="text"
                  value={prolog.category || ''}
                  onChange={(e) => setProlog({ ...prolog, category: e.target.value })}
                  placeholder="e.g. Configuration, Installation"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-permissions">Permissions</label>
                <input
                  id="prolog-permissions"
                  type="text"
                  value={prolog.permissions || ''}
                  onChange={(e) => setProlog({ ...prolog, permissions: e.target.value })}
                  placeholder="e.g. internal, public"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-keywords">Keywords (comma-separated)</label>
                <input
                  id="prolog-keywords"
                  type="text"
                  value={(prolog.keywords || []).join(', ')}
                  onChange={(e) =>
                    setProlog({
                      ...prolog,
                      keywords: e.target.value
                        .split(',')
                        .map((k) => k.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="keyword1, keyword2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Steps Tab */}
        {activeTab === 'steps' && showStepsTab && (
          <div className="steps-editor">
            {steps.map((step, index) => (
              <div key={step.key} className="step-card">
                <div className="step-header">
                  <span className="step-number">Step {index + 1}</span>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeStep(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="form-group">
                  <label>Step Title</label>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => updateStep(index, 'title', e.target.value)}
                    placeholder="What the user should do"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Step Result</label>
                  <input
                    type="text"
                    value={step.stepResult}
                    onChange={(e) => updateStep(index, 'stepResult', e.target.value)}
                    placeholder="What happens after this step"
                  />
                </div>
                <div className="form-group">
                  <label>Additional Info</label>
                  <textarea
                    value={step.info}
                    onChange={(e) => updateStep(index, 'info', e.target.value)}
                    placeholder="Extra notes, tips, or warnings for this step"
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addStep}>
              + Add Step
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './SiteBuilder.css';

interface SiteBuild {
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

interface OutputTemplate {
  id: string;
  name: string;
  format: string;
  htmlTemplate: string;
  cssStyles: string;
  variables: Record<string, string>;
  createdAt: string;
}

export default function SiteBuilder() {
  const [builds, setBuilds] = useState<SiteBuild[]>([]);
  const [templates, setTemplates] = useState<OutputTemplate[]>([]);
  const [selected, setSelected] = useState<SiteBuild | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'builds' | 'templates'>('builds');

  /* build form */
  const [pubId, setPubId] = useState('');
  const [tplId, setTplId] = useState('');
  const [theme, setTheme] = useState('default');

  /* template form */
  const [showTplForm, setShowTplForm] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplHtml, setTplHtml] = useState('<html><head><style>{{styles}}</style></head><body>{{content}}</body></html>');
  const [tplCss, setTplCss] = useState('body { font-family: system-ui; max-width: 900px; margin: 0 auto; padding: 2rem; }');
  const [previewHtml, setPreviewHtml] = useState('');

  const loadBuilds = useCallback(async () => {
    const { data } = await api.get('/publishing/builds');
    setBuilds(data);
  }, []);

  const loadTemplates = useCallback(async () => {
    const { data } = await api.get('/publishing/templates');
    setTemplates(data);
  }, []);

  useEffect(() => {
    Promise.all([loadBuilds(), loadTemplates()]).finally(() => setLoading(false));
  }, [loadBuilds, loadTemplates]);

  const triggerBuild = async () => {
    if (!pubId) return;
    await api.post('/publishing/builds', { publicationId: pubId, templateId: tplId || undefined, theme });
    setPubId('');
    loadBuilds();
  };

  const createTemplate = async () => {
    await api.post('/publishing/templates', { name: tplName, format: 'html', htmlTemplate: tplHtml, cssStyles: tplCss });
    setShowTplForm(false);
    setTplName('');
    loadTemplates();
  };

  const preview = async (id: string) => {
    const { data } = await api.get(`/publishing/templates/${id}/preview`);
    setPreviewHtml(data.html);
  };

  const deleteTpl = async (id: string) => {
    await api.delete(`/publishing/templates/${id}`);
    loadTemplates();
  };

  const statusColor = (s: string) =>
    s === 'completed' ? '#059669' : s === 'failed' ? '#dc2626' : s === 'building' ? '#d97706' : '#6b7280';

  return (
    <div className="site-builder-page">
      <h1>Publishing & Delivery</h1>

      <div className="tabs">
        <button className={tab === 'builds' ? 'active' : ''} onClick={() => setTab('builds')}>Site Builds</button>
        <button className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>Output Templates</button>
      </div>

      {loading ? <p>Loading…</p> : tab === 'builds' ? (
        <>
          <div className="build-form card">
            <h3>Trigger New Build</h3>
            <div className="form-row">
              <input placeholder="Publication ID" value={pubId} onChange={e => setPubId(e.target.value)} />
              <select value={tplId} onChange={e => setTplId(e.target.value)}>
                <option value="">Default template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="default">Clean Docs</option>
                <option value="api-reference">API Reference</option>
                <option value="kb">Knowledge Base</option>
              </select>
              <button className="btn btn-primary" onClick={triggerBuild}>Build</button>
            </div>
          </div>

          <div className="builds-grid">
            <div className="build-list">
              {builds.length === 0 ? <p className="empty">No builds yet.</p> : builds.map(b => (
                <div key={b.id} className={`build-card ${selected?.id === b.id ? 'active' : ''}`} onClick={() => setSelected(b)}>
                  <div className="build-status" style={{ color: statusColor(b.status) }}>{b.status}</div>
                  <small>{new Date(b.createdAt).toLocaleString()}</small>
                  <div className="build-meta">{b.fileCount} pages &middot; {(b.totalSizeBytes / 1024).toFixed(1)} KB</div>
                </div>
              ))}
            </div>

            {selected && (
              <div className="build-detail card">
                <h3>Build Details</h3>
                <p><strong>Status: </strong><span style={{ color: statusColor(selected.status) }}>{selected.status}</span></p>
                <p><strong>Theme:</strong> {selected.theme}</p>
                <p><strong>Files:</strong> {selected.fileCount} &middot; <strong>Size:</strong> {(selected.totalSizeBytes / 1024).toFixed(1)} KB</p>
                {selected.outputUrl && <p><strong>Output:</strong> {selected.outputUrl}</p>}
                <h4>Build Log</h4>
                <ul className="build-log">
                  {selected.buildLog.map((entry, i) => (
                    <li key={i}><small>{new Date(entry.timestamp).toLocaleTimeString()}</small> {entry.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <button className="btn btn-primary" onClick={() => setShowTplForm(!showTplForm)} style={{ marginBottom: '1rem' }}>
            {showTplForm ? 'Cancel' : '+ New Template'}
          </button>

          {showTplForm && (
            <div className="card form-card">
              <label>Name</label>
              <input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="My Theme" />
              <label>HTML Template</label>
              <textarea rows={8} value={tplHtml} onChange={e => setTplHtml(e.target.value)} />
              <label>CSS Styles</label>
              <textarea rows={4} value={tplCss} onChange={e => setTplCss(e.target.value)} />
              <button className="btn btn-primary" onClick={createTemplate}>Create</button>
            </div>
          )}

          {previewHtml && (
            <div className="card preview-card">
              <h3>Preview <button className="btn-link" onClick={() => setPreviewHtml('')}>Close</button></h3>
              <iframe title="preview" srcDoc={previewHtml} style={{ width: '100%', height: 400, border: '1px solid #e5e7eb', borderRadius: 8 }} />
            </div>
          )}

          <div className="tpl-list">
            {templates.length === 0 ? <p className="empty">No templates yet.</p> : templates.map(t => (
              <div key={t.id} className="tpl-card card">
                <strong>{t.name}</strong> <span className="badge badge-info">{t.format}</span>
                <div className="tpl-actions">
                  <button className="btn-link" onClick={() => preview(t.id)}>Preview</button>
                  <button className="btn-link danger" onClick={() => deleteTpl(t.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

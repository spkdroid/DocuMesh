import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './GitSync.css';

interface GitSyncConfig {
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

export default function GitSync() {
  const [configs, setConfigs] = useState<GitSyncConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [provider, setProvider] = useState('github');
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [direction, setDirection] = useState('bidirectional');
  const [contentFormat, setContentFormat] = useState('markdown');
  const [syncPath, setSyncPath] = useState('docs/');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/platform/git-sync'); setConfigs(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!repoUrl) return;
    await api.post('/platform/git-sync', { provider, repoUrl, branch, direction, contentFormat, syncPath });
    setShowForm(false);
    setRepoUrl('');
    load();
  };

  const trigger = async (id: string) => {
    await api.post(`/platform/git-sync/${id}/trigger`);
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/platform/git-sync/${id}`);
    load();
  };

  return (
    <div className="gitsync-page">
      <div className="page-header">
        <h1>Git Sync</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Repo'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <label>Provider</label>
          <select value={provider} onChange={e => setProvider(e.target.value)}>
            <option value="github">GitHub</option>
            <option value="gitlab">GitLab</option>
          </select>
          <label>Repository URL</label>
          <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/org/docs.git" />
          <label>Branch</label>
          <input value={branch} onChange={e => setBranch(e.target.value)} />
          <label>Direction</label>
          <select value={direction} onChange={e => setDirection(e.target.value)}>
            <option value="bidirectional">Bidirectional</option>
            <option value="push">Push only</option>
            <option value="pull">Pull only</option>
          </select>
          <label>Content Format</label>
          <select value={contentFormat} onChange={e => setContentFormat(e.target.value)}>
            <option value="markdown">Markdown</option>
            <option value="dita-xml">DITA XML</option>
            <option value="json">JSON</option>
          </select>
          <label>Sync Path</label>
          <input value={syncPath} onChange={e => setSyncPath(e.target.value)} />
          <button className="btn btn-primary" onClick={create}>Create</button>
        </div>
      )}

      {loading ? <p>Loading…</p> : configs.length === 0 ? (
        <p className="empty">No Git sync configurations.</p>
      ) : (
        <div className="sync-list">
          {configs.map(c => (
            <div key={c.id} className="sync-card card">
              <div className="sync-info">
                <div className="sync-repo">
                  <span className={`provider-badge ${c.provider}`}>{c.provider}</span>
                  {c.repoUrl}
                </div>
                <div className="sync-meta">
                  Branch: <strong>{c.branch}</strong> &middot;
                  Direction: <strong>{c.direction}</strong> &middot;
                  Format: <strong>{c.contentFormat}</strong> &middot;
                  Path: <strong>{c.syncPath}</strong>
                </div>
                {c.lastSyncAt && (
                  <div className="sync-status">
                    Last sync: {new Date(c.lastSyncAt).toLocaleString()} — {c.lastSyncStatus}
                  </div>
                )}
              </div>
              <div className="sync-actions">
                <button className="btn btn-primary btn-sm" onClick={() => trigger(c.id)}>Sync Now</button>
                <button className="btn-link danger" onClick={() => remove(c.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

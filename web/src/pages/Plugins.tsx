import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './Plugins.css';

interface Plugin {
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

export default function Plugins() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [hooksStr, setHooksStr] = useState('pre-save, post-publish');
  const [desc, setDesc] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/platform/plugins'); setPlugins(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const install = async () => {
    if (!name) return;
    await api.post('/platform/plugins', {
      name,
      source,
      description: desc,
      hooks: hooksStr.split(',').map(h => h.trim()).filter(Boolean),
    });
    setShowForm(false);
    setName(''); setSource(''); setDesc('');
    load();
  };

  const toggle = async (p: Plugin) => {
    await api.put(`/platform/plugins/${p.id}`, {
      status: p.status === 'active' ? 'disabled' : 'active',
    });
    load();
  };

  const uninstall = async (id: string) => {
    await api.delete(`/platform/plugins/${id}`);
    load();
  };

  return (
    <div className="plugins-page">
      <div className="page-header">
        <h1>Plugins & Extensions</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Install Plugin'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="docmesh-spellcheck" />
          <label>Source (registry or git URL)</label>
          <input value={source} onChange={e => setSource(e.target.value)} placeholder="https://github.com/…" />
          <label>Hooks (comma-separated)</label>
          <input value={hooksStr} onChange={e => setHooksStr(e.target.value)} />
          <label>Description</label>
          <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} />
          <button className="btn btn-primary" onClick={install}>Install</button>
        </div>
      )}

      {loading ? <p>Loading…</p> : plugins.length === 0 ? (
        <p className="empty">No plugins installed.</p>
      ) : (
        <div className="plugin-list">
          {plugins.map(p => (
            <div key={p.id} className="plugin-card card">
              <div className="plugin-info">
                <div className="plugin-name">{p.name} <span className="plugin-ver">v{p.version}</span></div>
                <div className="plugin-desc">{p.description || 'No description'}</div>
                <div className="plugin-hooks">
                  {p.hooks.map(h => <span key={h} className="hook-badge">{h}</span>)}
                </div>
              </div>
              <div className="plugin-actions">
                <span className={`status-dot ${p.status}`} />
                <button className="btn btn-secondary btn-sm" onClick={() => toggle(p)}>
                  {p.status === 'active' ? 'Disable' : 'Enable'}
                </button>
                <button className="btn-link danger" onClick={() => uninstall(p.id)}>Uninstall</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

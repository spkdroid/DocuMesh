import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './Webhooks.css';

interface Webhook {
  id: string;
  platform: string;
  name: string;
  webhookUrl: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
}

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [platform, setPlatform] = useState('slack');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [eventsStr, setEventsStr] = useState('content.published, review.approved');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/platform/webhooks'); setWebhooks(data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name || !url) return;
    await api.post('/platform/webhooks', {
      platform,
      name,
      webhookUrl: url,
      events: eventsStr.split(',').map(e => e.trim()).filter(Boolean),
    });
    setShowForm(false);
    setName(''); setUrl('');
    load();
  };

  const toggle = async (wh: Webhook) => {
    await api.put(`/platform/webhooks/${wh.id}`, { enabled: !wh.enabled });
    load();
  };

  const test = async (id: string) => {
    const { data } = await api.post(`/platform/webhooks/test/${id}`);
    alert(`Dispatched to ${data.dispatched} webhook(s).`);
  };

  const remove = async (id: string) => {
    await api.delete(`/platform/webhooks/${id}`);
    load();
  };

  return (
    <div className="webhooks-page">
      <div className="page-header">
        <h1>Webhooks & Bots</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Webhook'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <label>Platform</label>
          <select value={platform} onChange={e => setPlatform(e.target.value)}>
            <option value="slack">Slack</option>
            <option value="teams">Microsoft Teams</option>
            <option value="custom">Custom</option>
          </select>
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Content Notifications" />
          <label>Webhook URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hooks.slack.com/…" />
          <label>Events (comma-separated)</label>
          <input value={eventsStr} onChange={e => setEventsStr(e.target.value)} />
          <button className="btn btn-primary" onClick={create}>Create</button>
        </div>
      )}

      {loading ? <p>Loading…</p> : webhooks.length === 0 ? (
        <p className="empty">No webhooks configured.</p>
      ) : (
        <div className="wh-list">
          {webhooks.map(wh => (
            <div key={wh.id} className="wh-card card">
              <div className="wh-info">
                <div className="wh-name">
                  <span className={`platform-badge ${wh.platform}`}>{wh.platform}</span>
                  {wh.name}
                  <span className={`status-pill ${wh.enabled ? 'on' : 'off'}`}>{wh.enabled ? 'ON' : 'OFF'}</span>
                </div>
                <div className="wh-events">
                  {wh.events.map(ev => <span key={ev} className="event-tag">{ev}</span>)}
                </div>
              </div>
              <div className="wh-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => toggle(wh)}>
                  {wh.enabled ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => test(wh.id)}>Test</button>
                <button className="btn-link danger" onClick={() => remove(wh.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

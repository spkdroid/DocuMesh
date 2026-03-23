import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './ScheduledPublish.css';

interface Schedule {
  id: string;
  contentItemId: string | null;
  publicationId: string | null;
  scheduledAt: string;
  status: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export default function ScheduledPublish() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [contentItemId, setContentItemId] = useState('');
  const [publicationId, setPublicationId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/publishing/schedules');
      setSchedules(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!scheduledAt) return;
    await api.post('/publishing/schedules', {
      contentItemId: contentItemId || undefined,
      publicationId: publicationId || undefined,
      scheduledAt,
      notes,
    });
    setShowForm(false);
    setContentItemId('');
    setPublicationId('');
    setScheduledAt('');
    setNotes('');
    load();
  };

  const cancel = async (id: string) => {
    await api.put(`/publishing/schedules/${id}/cancel`);
    load();
  };

  const process = async () => {
    const { data } = await api.post('/publishing/schedules/process');
    alert(`Processed ${data} scheduled publishes.`);
    load();
  };

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = { pending: 'badge-warn', published: 'badge-success', cancelled: 'badge-muted', failed: 'badge-danger' };
    return <span className={`badge ${cls[s] || 'badge-muted'}`}>{s}</span>;
  };

  return (
    <div className="scheduled-page">
      <div className="page-header">
        <h1>Scheduled Publishing</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={process}>Process Due</button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Schedule'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card form-card">
          <label>Content Item ID (optional)</label>
          <input value={contentItemId} onChange={e => setContentItemId(e.target.value)} placeholder="uuid" />
          <label>Publication ID (optional)</label>
          <input value={publicationId} onChange={e => setPublicationId(e.target.value)} placeholder="uuid" />
          <label>Scheduled At</label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
          <label>Notes</label>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Release notes…" />
          <button className="btn btn-primary" onClick={create}>Schedule</button>
        </div>
      )}

      {loading ? <p>Loading…</p> : schedules.length === 0 ? (
        <p className="empty">No scheduled publishes.</p>
      ) : (
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Scheduled At</th>
              <th>Target</th>
              <th>Status</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(s => (
              <tr key={s.id}>
                <td>{new Date(s.scheduledAt).toLocaleString()}</td>
                <td>
                  {s.contentItemId && <span>Content: {s.contentItemId.slice(0, 8)}…</span>}
                  {s.publicationId && <span>Pub: {s.publicationId.slice(0, 8)}…</span>}
                </td>
                <td>{statusBadge(s.status)}</td>
                <td>{s.notes || '—'}</td>
                <td>
                  {s.status === 'pending' && (
                    <button className="btn-link danger" onClick={() => cancel(s.id)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

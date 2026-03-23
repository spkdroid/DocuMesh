import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { AuditEntry, AuditListResponse } from '../types';
import './AuditLog.css';

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [stats, setStats] = useState<{ totalEntries: number; recentCount: number; actionCounts: { action: string; count: string }[] } | null>(null);

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 50 };
      if (entityType) params.entityType = entityType;
      if (action) params.action = action;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const { data } = await api.get<AuditListResponse>('/workflows/audit/dashboard', { params });
      setEntries(data.items);
      setTotal(data.total);
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action, fromDate, toDate]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/workflows/audit/stats');
      setStats(data);
    } catch {
      /* */
    }
  }, []);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleExport = async (format: 'json' | 'csv') => {
    const params: Record<string, string> = { format };
    if (entityType) params.entityType = entityType;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    const { data } = await api.get('/workflows/audit/export', { params });

    const blob = new Blob(
      [typeof data === 'string' ? data : JSON.stringify(data, null, 2)],
      { type: format === 'csv' ? 'text/csv' : 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="audit-page">
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p className="text-secondary">{total} entries</p>
        </div>
        <div className="export-buttons">
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('csv')}>Export CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('json')}>Export JSON</button>
        </div>
      </div>

      {stats && (
        <div className="audit-stats">
          <div className="stat-card card">
            <div className="stat-value">{stats.totalEntries}</div>
            <div className="stat-label">Total Events</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{stats.recentCount}</div>
            <div className="stat-label">Last 24h</div>
          </div>
          {stats.actionCounts.slice(0, 4).map((ac) => (
            <div key={ac.action} className="stat-card card">
              <div className="stat-value">{ac.count}</div>
              <div className="stat-label">{ac.action.replace(/_/g, ' ')}</div>
            </div>
          ))}
        </div>
      )}

      <div className="page-filters">
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }}>
          <option value="">All entity types</option>
          <option value="content_item">Content Item</option>
          <option value="workflow_instance">Workflow</option>
          <option value="review_task">Review Task</option>
          <option value="publication">Publication</option>
        </select>
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          <option value="CREATED">Created</option>
          <option value="UPDATED">Updated</option>
          <option value="DELETED">Deleted</option>
          <option value="STATUS_CHANGED">Status Changed</option>
          <option value="WORKFLOW_TRANSITION">Workflow Transition</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} placeholder="From date" />
        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} placeholder="To date" />
      </div>

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="empty-state"><p>No audit entries found.</p></div>
      ) : (
        <>
          <table className="content-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>From</th>
                <th>To</th>
                <th>User</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td><span className={`badge badge-${e.action.toLowerCase()}`}>{e.action.replace(/_/g, ' ')}</span></td>
                  <td>{e.entityType}</td>
                  <td className="text-secondary" title={e.entityId}>{e.entityId.substring(0, 8)}...</td>
                  <td>{e.fromState || '-'}</td>
                  <td>{e.toState || '-'}</td>
                  <td className="text-secondary" title={e.userId}>{e.userId.substring(0, 8)}...</td>
                  <td className="text-secondary">{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="text-secondary">Page {page} of {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

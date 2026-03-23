import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './Analytics.css';

interface DashboardData {
  totalViews: number;
  totalSearches: number;
  topViewed: { entityId: string; views: string }[];
  authorStats: { authorId: string; itemCount: string }[];
  eventBreakdown: { eventType: string; count: string }[];
  period: string;
}

export default function Analytics() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/platform/analytics/dashboard');
      setDashboard(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="analytics-page"><p>Loading…</p></div>;
  if (!dashboard) return <div className="analytics-page"><p className="empty">No analytics data.</p></div>;

  return (
    <div className="analytics-page">
      <h1>Analytics Dashboard</h1>
      <p className="period">Last {dashboard.period}</p>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-value">{dashboard.totalViews}</div>
          <div className="stat-label">Content Views</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{dashboard.totalSearches}</div>
          <div className="stat-label">Search Queries</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{dashboard.eventBreakdown.length}</div>
          <div className="stat-label">Event Types</div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card">
          <h3>Top Viewed Content</h3>
          {dashboard.topViewed.length === 0 ? <p className="empty">No view data yet.</p> : (
            <table className="analytics-table">
              <thead><tr><th>Content ID</th><th>Views</th></tr></thead>
              <tbody>
                {dashboard.topViewed.map((v, i) => (
                  <tr key={i}><td>{v.entityId?.slice(0, 12)}…</td><td>{v.views}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>Author Productivity</h3>
          {dashboard.authorStats.length === 0 ? <p className="empty">No author data.</p> : (
            <table className="analytics-table">
              <thead><tr><th>Author</th><th>Items Created</th></tr></thead>
              <tbody>
                {dashboard.authorStats.map((a, i) => (
                  <tr key={i}><td>{a.authorId?.slice(0, 12)}…</td><td>{a.itemCount}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>Event Breakdown</h3>
          {dashboard.eventBreakdown.length === 0 ? <p className="empty">No events tracked.</p> : (
            <table className="analytics-table">
              <thead><tr><th>Event Type</th><th>Count</th></tr></thead>
              <tbody>
                {dashboard.eventBreakdown.map((e, i) => (
                  <tr key={i}><td>{e.eventType}</td><td>{e.count}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

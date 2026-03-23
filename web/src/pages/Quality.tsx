import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import type { QualityScore, QualityStats } from '../types';
import './Quality.css';

export default function Quality() {
  const [scores, setScores] = useState<QualityScore[]>([]);
  const [stats, setStats] = useState<QualityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scoresRes, statsRes] = await Promise.all([
        api.get<QualityScore[]>('/quality/scores'),
        api.get<QualityStats>('/quality/stats'),
      ]);
      setScores(scoresRes.data);
      setStats(statsRes.data);
    } catch {
      /* interceptor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleScoreAll = async () => {
    setScoring(true);
    try {
      await api.post('/quality/score-all');
      await fetchData();
    } finally {
      setScoring(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-good';
    if (score >= 60) return 'score-ok';
    return 'score-bad';
  };

  return (
    <div className="quality-page">
      <div className="page-header">
        <div>
          <h1>Quality Dashboard</h1>
          <p className="text-secondary">Content quality metrics and scoring</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleScoreAll}
          disabled={scoring}
        >
          {scoring ? 'Scoring...' : 'Score All Content'}
        </button>
      </div>

      {stats && (
        <div className="quality-stats">
          <div className="stat-card card">
            <div className="stat-value">{stats.totalScored}</div>
            <div className="stat-label">Items Scored</div>
          </div>
          <div className={`stat-card card ${getScoreColor(stats.avgScore)}`}>
            <div className="stat-value">{stats.avgScore}</div>
            <div className="stat-label">Avg Score</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{stats.avgReadability}</div>
            <div className="stat-label">Avg Readability</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{stats.totalBrokenLinks}</div>
            <div className="stat-label">Broken Links</div>
          </div>
          <div className="stat-card card">
            <div className="stat-value">{stats.totalIssues}</div>
            <div className="stat-label">Total Issues</div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : scores.length === 0 ? (
        <div className="empty-state">
          <p>No scores yet. Click "Score All Content" to analyze your content.</p>
        </div>
      ) : (
        <table className="content-table">
          <thead>
            <tr>
              <th>Content ID</th>
              <th>Overall</th>
              <th>Readability</th>
              <th>Structure</th>
              <th>Completeness</th>
              <th>Words</th>
              <th>Links</th>
              <th>Issues</th>
              <th>Scored</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s) => (
              <tr key={s.id}>
                <td className="text-secondary" title={s.contentItemId}>{s.contentItemId.substring(0, 8)}...</td>
                <td><span className={`score-badge ${getScoreColor(s.overallScore)}`}>{s.overallScore}</span></td>
                <td>{s.readabilityScore.toFixed(0)}</td>
                <td>{s.structureScore}</td>
                <td>{s.completenessScore}</td>
                <td>{s.wordCount}</td>
                <td>{s.brokenLinks > 0 ? <span className="text-danger">{s.brokenLinks}</span> : '0'}</td>
                <td>{s.issues.length}</td>
                <td className="text-secondary">{new Date(s.scoredAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

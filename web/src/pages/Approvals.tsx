import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './Approvals.css';

interface ApprovalStep {
  stepNumber: number;
  title: string;
  assigneeIds: string[];
  requiredApprovals: number;
  parallel: boolean;
  status: string;
  approvedBy: string[];
  rejectedBy: string[];
  completedAt: string | null;
}

interface ApprovalChain {
  id: string;
  contentItemId: string;
  title: string;
  status: string;
  currentStep: number;
  steps: ApprovalStep[];
  createdBy: string;
  createdAt: string;
}

export default function Approvals() {
  const [chains, setChains] = useState<ApprovalChain[]>([]);
  const [selected, setSelected] = useState<ApprovalChain | null>(null);
  const [loading, setLoading] = useState(true);

  /* form state */
  const [title, setTitle] = useState('');
  const [contentItemId, setContentItemId] = useState('');
  const [stepsJson, setStepsJson] = useState('[\n  { "stepNumber": 0, "title": "Tech Review", "assigneeIds": [], "requiredApprovals": 1, "parallel": false }\n]');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/collaboration/approvals');
      setChains(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    let steps: unknown[];
    try { steps = JSON.parse(stepsJson); } catch { alert('Invalid JSON for steps'); return; }
    await api.post('/collaboration/approvals', { contentItemId, title, steps });
    setShowForm(false);
    setTitle('');
    setContentItemId('');
    load();
  };

  const advance = async (chainId: string, decision: string) => {
    await api.put(`/collaboration/approvals/${chainId}/advance`, { decision });
    load();
    if (selected?.id === chainId) {
      const { data } = await api.get(`/collaboration/approvals/${chainId}`);
      setSelected(data);
    }
  };

  const cancel = async (chainId: string) => {
    await api.put(`/collaboration/approvals/${chainId}/cancel`);
    load();
    setSelected(null);
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { active: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger', pending: 'badge-warn', approved: 'badge-success', rejected: 'badge-danger', skipped: 'badge-muted' };
    return <span className={`badge ${map[s] || 'badge-muted'}`}>{s}</span>;
  };

  return (
    <div className="approvals-page">
      <div className="page-header">
        <h1>Approval Chains</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Chain'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <label>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Publication Approval" />
          <label>Content Item ID</label>
          <input value={contentItemId} onChange={e => setContentItemId(e.target.value)} placeholder="uuid" />
          <label>Steps (JSON)</label>
          <textarea rows={6} value={stepsJson} onChange={e => setStepsJson(e.target.value)} />
          <button className="btn btn-primary" onClick={create}>Create</button>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : chains.length === 0 ? (
        <p className="empty">No approval chains yet.</p>
      ) : (
        <div className="approvals-grid">
          <div className="chain-list">
            {chains.map(c => (
              <div key={c.id} className={`chain-card ${selected?.id === c.id ? 'active' : ''}`} onClick={() => setSelected(c)}>
                <strong>{c.title}</strong>
                <div className="chain-meta">
                  {statusBadge(c.status)} &middot; Step {c.currentStep + 1}/{c.steps.length}
                </div>
                <small>{new Date(c.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>

          {selected && (
            <div className="chain-detail card">
              <h2>{selected.title} {statusBadge(selected.status)}</h2>
              <p><strong>Content:</strong> {selected.contentItemId}</p>
              <h3>Steps</h3>
              <ol className="step-list">
                {selected.steps.map((s, i) => (
                  <li key={i} className={i === selected.currentStep && selected.status === 'active' ? 'current-step' : ''}>
                    <div className="step-header">
                      <strong>{s.title}</strong> {statusBadge(s.status)}
                    </div>
                    <div className="step-meta">
                      Assignees: {s.assigneeIds.length || 'none'} &middot;
                      Approved: {s.approvedBy.length}/{s.requiredApprovals}
                      {s.completedAt && <> &middot; Completed {new Date(s.completedAt).toLocaleDateString()}</>}
                    </div>
                  </li>
                ))}
              </ol>

              {selected.status === 'active' && (
                <div className="chain-actions">
                  <button className="btn btn-primary" onClick={() => advance(selected.id, 'approved')}>Approve Current Step</button>
                  <button className="btn btn-danger" onClick={() => advance(selected.id, 'rejected')}>Reject</button>
                  <button className="btn btn-secondary" onClick={() => cancel(selected.id)}>Cancel Chain</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

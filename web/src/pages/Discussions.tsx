import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './Discussions.css';

interface Discussion {
  id: string;
  contentItemId: string;
  body: string;
  authorId: string;
  parentId: string | null;
  sectionRef: { sectionId: string; from: number; to: number } | null;
  mentions: string[];
  resolved: boolean;
  createdAt: string;
}

export default function Discussions() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [contentItemId, setContentItemId] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  /* new comment */
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contentItemId) return;
    setLoading(true);
    try {
      const { data } = await api.get('/collaboration/discussions', { params: { contentItemId } });
      setDiscussions(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, [contentItemId]);

  useEffect(() => {
    if (searched) load();
  }, [searched, load]);

  const post = async () => {
    if (!body.trim() || !contentItemId) return;
    await api.post('/collaboration/discussions', {
      contentItemId,
      body,
      parentId: replyTo,
    });
    setBody('');
    setReplyTo(null);
    load();
  };

  const resolve = async (id: string) => {
    await api.put(`/collaboration/discussions/${id}/resolve`);
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/collaboration/discussions/${id}`);
    load();
  };

  /* Build thread tree */
  const roots = discussions.filter(d => !d.parentId);
  const replies = (parentId: string) => discussions.filter(d => d.parentId === parentId);

  return (
    <div className="discussions-page">
      <h1>Discussions</h1>

      <div className="search-bar">
        <input
          placeholder="Content Item ID"
          value={contentItemId}
          onChange={e => setContentItemId(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => { setSearched(true); load(); }}>
          Load
        </button>
      </div>

      {loading && <p>Loading…</p>}

      {searched && !loading && discussions.length === 0 && (
        <p className="empty">No discussions for this content item.</p>
      )}

      <div className="thread-list">
        {roots.map(d => (
          <div key={d.id} className={`thread-card ${d.resolved ? 'resolved' : ''}`}>
            <div className="disc-header">
              <strong>{d.authorId}</strong>
              <small>{new Date(d.createdAt).toLocaleString()}</small>
              {d.resolved && <span className="badge badge-success">Resolved</span>}
              {d.sectionRef && <span className="badge badge-info">Section ref</span>}
            </div>
            <p className="disc-body">{d.body}</p>
            <div className="disc-actions">
              {!d.resolved && <button className="btn-link" onClick={() => resolve(d.id)}>Resolve</button>}
              <button className="btn-link" onClick={() => setReplyTo(d.id)}>Reply</button>
              <button className="btn-link danger" onClick={() => remove(d.id)}>Delete</button>
            </div>

            {/* Replies */}
            {replies(d.id).map(r => (
              <div key={r.id} className="reply-card">
                <div className="disc-header">
                  <strong>{r.authorId}</strong>
                  <small>{new Date(r.createdAt).toLocaleString()}</small>
                </div>
                <p className="disc-body">{r.body}</p>
                <div className="disc-actions">
                  <button className="btn-link danger" onClick={() => remove(r.id)}>Delete</button>
                </div>
              </div>
            ))}

            {replyTo === d.id && (
              <div className="reply-form">
                <textarea rows={2} placeholder="Reply…" value={body} onChange={e => setBody(e.target.value)} />
                <div className="reply-btns">
                  <button className="btn btn-primary btn-sm" onClick={post}>Post Reply</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setReplyTo(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {searched && (
        <div className="new-comment card">
          <h3>New Comment</h3>
          <textarea rows={3} placeholder="Write a comment…" value={replyTo ? '' : body} onChange={e => { setReplyTo(null); setBody(e.target.value); }} />
          <button className="btn btn-primary" onClick={post} disabled={!body.trim()}>Post</button>
        </div>
      )}
    </div>
  );
}

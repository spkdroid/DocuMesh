import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import type { ReviewTask, ReviewComment, Notification } from '../types';
import './Reviews.css';

type Tab = 'my-reviews' | 'all' | 'comments' | 'notifications';

export default function Reviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('my-reviews');
  const [myTasks, setMyTasks] = useState<ReviewTask[]>([]);
  const [allTasks, setAllTasks] = useState<ReviewTask[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  /* action state */
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ReviewTask[]>('/workflows/reviews/my');
      setMyTasks(data);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ReviewTask[]>('/workflows/reviews/all');
      setAllTasks(data);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Notification[]>('/workflows/notifications');
      setNotifications(data);
    } catch { /* */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'my-reviews') fetchMyTasks();
    else if (tab === 'all') fetchAllTasks();
    else if (tab === 'notifications') fetchNotifications();
  }, [tab, fetchMyTasks, fetchAllTasks, fetchNotifications]);

  const updateTask = async (taskId: string, status: string, notes?: string) => {
    try {
      await api.patch(`/workflows/reviews/${taskId}`, {
        status,
        ...(notes ? { reviewNotes: notes } : {}),
      });
      setUpdatingId(null);
      setReviewNotes('');
      if (tab === 'my-reviews') fetchMyTasks();
      else fetchAllTasks();
    } catch {
      alert('Failed to update review');
    }
  };

  const markNotificationRead = async (id: string) => {
    await api.patch(`/workflows/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await api.post('/workflows/notifications/read-all');
    fetchNotifications();
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'approved': return 'published';
      case 'rejected': return 'archived';
      case 'in_progress': return 'in_review';
      case 'completed': return 'published';
      default: return 'draft';
    }
  };

  const renderTasks = (tasks: ReviewTask[]) =>
    tasks.length === 0 ? (
      <div className="empty-state">
        <p>No review tasks found.</p>
      </div>
    ) : (
      <table className="content-table">
        <thead>
          <tr>
            <th>Content</th>
            <th>Status</th>
            <th>Instructions</th>
            <th>Due</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td
                className="title-cell"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/content/${t.contentItemId}`)}
              >
                {t.contentItem?.title || t.contentItemId}
              </td>
              <td>
                <span className={`badge badge-${statusColor(t.status)}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </td>
              <td className="text-secondary" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.instructions || '—'}
              </td>
              <td className="text-secondary">
                {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
              </td>
              <td>
                {t.status === 'pending' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => updateTask(t.id, 'in_progress')}
                  >
                    Start Review
                  </button>
                )}
                {t.status === 'in_progress' && updatingId !== t.id && (
                  <div className="review-action-group">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => setUpdatingId(t.id)}
                    >
                      Complete
                    </button>
                  </div>
                )}
                {t.status === 'in_progress' && updatingId === t.id && (
                  <div className="review-complete-form">
                    <textarea
                      placeholder="Review notes..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={2}
                    />
                    <div className="review-complete-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => updateTask(t.id, 'approved', reviewNotes)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => updateTask(t.id, 'rejected', reviewNotes)}
                      >
                        Reject
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setUpdatingId(null); setReviewNotes(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {(t.status === 'approved' || t.status === 'rejected' || t.status === 'completed') && (
                  <span className="text-secondary" style={{ fontSize: 12 }}>
                    {t.reviewNotes || 'Done'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <div className="reviews-page">
      <div className="page-header">
        <div>
          <h1>Reviews</h1>
          <p className="text-secondary">
            Manage review tasks, approvals, and notifications
          </p>
        </div>
      </div>

      <div className="review-tabs">
        <button
          className={`tab-btn ${tab === 'my-reviews' ? 'active' : ''}`}
          onClick={() => setTab('my-reviews')}
        >
          My Reviews
        </button>
        <button
          className={`tab-btn ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Reviews
        </button>
        <button
          className={`tab-btn ${tab === 'notifications' ? 'active' : ''}`}
          onClick={() => setTab('notifications')}
        >
          Notifications
          {notifications.filter((n) => !n.read).length > 0 && (
            <span className="notif-badge">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : (
        <>
          {tab === 'my-reviews' && renderTasks(myTasks)}
          {tab === 'all' && renderTasks(allTasks)}
          {tab === 'notifications' && (
            <div className="notifications-panel">
              {notifications.length > 0 && (
                <div className="notif-header">
                  <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                    Mark all read
                  </button>
                </div>
              )}
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <p>No notifications.</p>
                </div>
              ) : (
                <div className="notif-list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notif-item ${n.read ? '' : 'unread'}`}
                      onClick={() => {
                        if (!n.read) markNotificationRead(n.id);
                        if (n.entityType === 'content' && n.entityId) {
                          navigate(`/content/${n.entityId}`);
                        }
                      }}
                    >
                      <div className="notif-dot">{n.read ? '' : '●'}</div>
                      <div>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-message text-secondary">
                          {n.message}
                        </div>
                        <div className="notif-time text-secondary">
                          {new Date(n.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

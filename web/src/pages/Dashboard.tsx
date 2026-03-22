import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { ContentItem, ContentListResponse } from '../types';
import './Dashboard.css';

export default function Dashboard() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchContent = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get<ContentListResponse>('/content', {
        params,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content item?')) return;
    await api.delete(`/content/${id}`);
    fetchContent();
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Content</h1>
          <p className="text-secondary">{total} items</p>
        </div>
        <Link to="/content/new" className="btn btn-primary">
          + New Content
        </Link>
      </div>

      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All types</option>
          <option value="topic">Topic</option>
          <option value="task">Task</option>
          <option value="reference">Reference</option>
          <option value="note">Note</option>
          <option value="warning">Warning</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_review">In Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No content found.</p>
          <Link to="/content/new" className="btn btn-primary">
            Create your first content
          </Link>
        </div>
      ) : (
        <>
          <table className="content-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Locale</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="content-row"
                  onClick={() => navigate(`/content/${item.id}`)}
                >
                  <td className="title-cell">{item.title}</td>
                  <td>
                    <span className="badge badge-draft">{item.type}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${item.status}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{item.locale}</td>
                  <td className="text-secondary">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

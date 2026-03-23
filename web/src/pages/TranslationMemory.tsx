import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './TranslationMemory.css';

interface TmEntry {
  id: string;
  sourceLocale: string;
  targetLocale: string;
  sourceText: string;
  targetText: string;
  matchScore: number;
  createdAt: string;
}

export default function TranslationMemoryPage() {
  const [entries, setEntries] = useState<TmEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sourceLocale: 'en', targetLocale: 'fr', sourceText: '', targetText: '' });
  const [lookupForm, setLookupForm] = useState({ sourceLocale: 'en', targetLocale: 'fr', sourceText: '' });
  const [lookupResults, setLookupResults] = useState<TmEntry[]>([]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<TmEntry[]>('/ai/translation-memory');
      setEntries(data);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleAdd = async () => {
    await api.post('/ai/translation-memory', form);
    setShowForm(false);
    setForm({ sourceLocale: 'en', targetLocale: 'fr', sourceText: '', targetText: '' });
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await api.delete(`/ai/translation-memory/${id}`);
    fetchEntries();
  };

  const handleLookup = async () => {
    if (!lookupForm.sourceText.trim()) return;
    const { data } = await api.post<TmEntry[]>('/ai/translation-memory/lookup', { ...lookupForm, minScore: 50 });
    setLookupResults(data);
  };

  return (
    <div className="tm-page">
      <div className="page-header">
        <div>
          <h1>Translation Memory</h1>
          <p className="text-secondary">Store and match translated segments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Entry</button>
      </div>

      {showForm && (
        <div className="tm-form card">
          <h3>New Translation Memory Entry</h3>
          <div className="tm-form-row">
            <input type="text" placeholder="Source locale" value={form.sourceLocale} onChange={(e) => setForm({ ...form, sourceLocale: e.target.value })} />
            <input type="text" placeholder="Target locale" value={form.targetLocale} onChange={(e) => setForm({ ...form, targetLocale: e.target.value })} />
          </div>
          <textarea placeholder="Source text" value={form.sourceText} onChange={(e) => setForm({ ...form, sourceText: e.target.value })} />
          <textarea placeholder="Target text (translated)" value={form.targetText} onChange={(e) => setForm({ ...form, targetText: e.target.value })} />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleAdd}>Save</button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="tm-lookup card">
        <h3>Fuzzy Match Lookup</h3>
        <div className="tm-form-row">
          <input type="text" placeholder="Source locale" value={lookupForm.sourceLocale} onChange={(e) => setLookupForm({ ...lookupForm, sourceLocale: e.target.value })} />
          <input type="text" placeholder="Target locale" value={lookupForm.targetLocale} onChange={(e) => setLookupForm({ ...lookupForm, targetLocale: e.target.value })} />
        </div>
        <textarea placeholder="Source text to match" value={lookupForm.sourceText} onChange={(e) => setLookupForm({ ...lookupForm, sourceText: e.target.value })} />
        <button className="btn btn-primary" onClick={handleLookup}>Find Matches</button>
        {lookupResults.length > 0 && (
          <table className="content-table">
            <thead><tr><th>Match %</th><th>Source</th><th>Translation</th></tr></thead>
            <tbody>
              {lookupResults.map((r) => (
                <tr key={r.id}>
                  <td><span className="badge badge-draft">{r.matchScore}%</span></td>
                  <td>{r.sourceText}</td>
                  <td>{r.targetText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {loading ? (
        <p className="text-secondary">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="empty-state"><p>No translation memory entries yet.</p></div>
      ) : (
        <table className="content-table">
          <thead>
            <tr><th>Source</th><th>Target</th><th>Source Text</th><th>Translation</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{e.sourceLocale}</td>
                <td>{e.targetLocale}</td>
                <td>{e.sourceText.substring(0, 80)}{e.sourceText.length > 80 ? '...' : ''}</td>
                <td>{e.targetText.substring(0, 80)}{e.targetText.length > 80 ? '...' : ''}</td>
                <td className="text-secondary">{new Date(e.createdAt).toLocaleDateString()}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

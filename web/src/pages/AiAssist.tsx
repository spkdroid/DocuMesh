import { useState } from 'react';
import api from '../api/client';
import './AiAssist.css';

interface SearchResult {
  contentItemId: string;
  title: string;
  score: number;
}

export default function AiAssist() {
  const [action, setAction] = useState('complete');
  const [text, setText] = useState('');
  const [audience, setAudience] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [embedResult, setEmbedResult] = useState('');

  const handleComplete = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/ai/complete', { action, text, audience: audience || undefined });
      setResult(data.result);
    } catch {
      setResult('Error: AI request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const { data } = await api.post<SearchResult[]>('/ai/search', { query: searchQuery, limit: 10 });
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleEmbedAll = async () => {
    setEmbedLoading(true);
    try {
      const { data } = await api.post('/ai/embed-all');
      setEmbedResult(`Embedded ${data.embedded} of ${data.total} items`);
    } catch {
      setEmbedResult('Embedding failed.');
    } finally {
      setEmbedLoading(false);
    }
  };

  return (
    <div className="ai-page">
      <div className="page-header">
        <h1>AI Assistant</h1>
        <p className="text-secondary">AI-powered writing help and semantic search</p>
      </div>

      <div className="ai-sections">
        <div className="ai-section card">
          <h2>AI Writing</h2>
          <div className="ai-controls">
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="complete">Complete text</option>
              <option value="rewrite">Rewrite for audience</option>
              <option value="summarize">Summarize</option>
              <option value="generate_shortdesc">Generate short description</option>
              <option value="generate_prolog">Generate prolog metadata</option>
            </select>
            {action === 'rewrite' && (
              <input
                type="text"
                placeholder="Target audience (e.g., developers)"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            )}
          </div>
          <textarea
            rows={6}
            placeholder="Enter your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleComplete} disabled={loading}>
            {loading ? 'Processing...' : 'Run AI'}
          </button>
          {result && (
            <div className="ai-result">
              <h3>Result</h3>
              <pre>{result}</pre>
            </div>
          )}
        </div>

        <div className="ai-section card">
          <h2>Semantic Search</h2>
          <div className="search-row">
            <input
              type="text"
              placeholder="Search by meaning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-primary" onClick={handleSearch} disabled={searchLoading}>
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <table className="content-table">
              <thead>
                <tr><th>Title</th><th>Similarity</th></tr>
              </thead>
              <tbody>
                {searchResults.map((r) => (
                  <tr key={r.contentItemId}>
                    <td>{r.title}</td>
                    <td>{(r.score * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="ai-section card">
          <h2>Embeddings</h2>
          <p className="text-secondary">Generate vector embeddings for all content to enable semantic search.</p>
          <button className="btn btn-secondary" onClick={handleEmbedAll} disabled={embedLoading}>
            {embedLoading ? 'Embedding...' : 'Embed All Content'}
          </button>
          {embedResult && <p className="text-secondary">{embedResult}</p>}
        </div>
      </div>
    </div>
  );
}

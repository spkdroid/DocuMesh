import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import Editor from '../components/Editor';
import type { ContentItem, Prolog, ReviewComment, OrgUser } from '../types';
import './ContentEditor.css';

interface StepFormData {
  key: string;
  stepNumber: number;
  title: string;
  body: Record<string, unknown>;
  stepResult: string;
  info: string;
}

let stepKeyCounter = 0;

function createEmptyStep(stepNumber: number): StepFormData {
  return {
    key: `step-${++stepKeyCounter}`,
    stepNumber,
    title: '',
    body: {},
    stepResult: '',
    info: '',
  };
}

/* DITA element labels by content type */
const DITA_LABELS: Record<string, { tag: string; desc: string; sections: { key: string; tag: string; label: string; hint: string; required?: boolean }[] }> = {
  topic: {
    tag: 'topic',
    desc: 'A general-purpose DITA topic.',
    sections: [
      { key: 'body', tag: 'body', label: 'Topic Body', hint: 'Main content of this topic.', required: true },
    ],
  },
  concept: {
    tag: 'concept',
    desc: 'Explains what something is — background knowledge the reader needs.',
    sections: [
      { key: 'body', tag: 'conbody', label: 'Concept Body', hint: 'Descriptive content explaining the concept. Use paragraphs, lists, tables, and images.', required: true },
    ],
  },
  task: {
    tag: 'task',
    desc: 'Step-by-step instructions for accomplishing a goal.',
    sections: [
      { key: 'context', tag: 'context', label: 'Context', hint: 'Background information the user needs before starting. Why and when to perform this task.' },
      { key: 'prereq', tag: 'prereq', label: 'Prerequisites', hint: 'Things the user must have or do before starting (tools, access, prior steps).' },
      { key: 'body', tag: 'steps', label: 'Steps', hint: 'Use the Steps panel below to add ordered steps.', required: true },
      { key: 'result', tag: 'result', label: 'Result', hint: 'What the user should see or have achieved after completing all the steps.' },
      { key: 'postreq', tag: 'postreq', label: 'What to do next', hint: 'Follow-up actions or links to related tasks.' },
      { key: 'example', tag: 'example', label: 'Example', hint: 'A worked example demonstrating the task.' },
    ],
  },
  reference: {
    tag: 'reference',
    desc: 'Factual, look-up material such as API specs, commands, or parameter tables.',
    sections: [
      { key: 'body', tag: 'refbody', label: 'Reference Body', hint: 'Reference content. Use tables for properties, parameters, or specifications.', required: true },
      { key: 'refsyn', tag: 'refsyn', label: 'Syntax', hint: 'Syntax or command signature. Use code blocks for CLI commands or API signatures.' },
      { key: 'properties', tag: 'properties', label: 'Properties Table', hint: 'Use a table to list property names, types, and descriptions.' },
    ],
  },
  glossary: {
    tag: 'glossentry',
    desc: 'A glossary entry with a term and its definition.',
    sections: [
      { key: 'body', tag: 'glossdef', label: 'Definition', hint: 'The full definition of this glossary term.', required: true },
    ],
  },
  troubleshooting: {
    tag: 'troubleshooting',
    desc: 'Describes a problem and provides a diagnosis and remedy.',
    sections: [
      { key: 'condition', tag: 'condition', label: 'Condition / Symptom', hint: 'Describe what the user sees or experiences (error messages, unexpected behavior).' },
      { key: 'cause', tag: 'cause', label: 'Cause', hint: 'Explain why the problem occurs.' },
      { key: 'body', tag: 'remedy', label: 'Remedy Steps', hint: 'Use the Steps panel below to add the fix steps.', required: true },
    ],
  },
};

/* Generate DITA XML preview from structured data */
function generateDitaXml(
  contentType: string,
  titleText: string,
  shortDesc: string,
  body: Record<string, unknown>,
  extra: Record<string, Record<string, unknown>>,
  prologData: Prolog,
  steps: StepFormData[],
): string {
  const info = DITA_LABELS[contentType] || DITA_LABELS.topic;
  const tag = info.tag;
  const bodyTag = info.sections.find((s) => s.key === 'body')?.tag || 'body';

  const prosemirrorToXml = (json: Record<string, unknown>, indent = '    '): string => {
    if (!json || !json.content) return `${indent}<p/>`;
    const nodes = json.content as Array<Record<string, unknown>>;
    return nodes.map((node) => {
      const t = node.type as string;
      if (t === 'paragraph') {
        const text = inlineToXml(node);
        return `${indent}<p>${text}</p>`;
      }
      if (t === 'heading') {
        const level = (node.attrs as Record<string, number>)?.level || 2;
        const text = inlineToXml(node);
        if (level <= 2) return `${indent}<p><b>${text}</b></p>`;
        return `${indent}<p><b>${text}</b></p>`;
      }
      if (t === 'bulletList') {
        const items = (node.content as Array<Record<string, unknown>> || [])
          .map((li) => `${indent}  <li>${inlineToXml(li)}</li>`).join('\n');
        return `${indent}<ul>\n${items}\n${indent}</ul>`;
      }
      if (t === 'orderedList') {
        const items = (node.content as Array<Record<string, unknown>> || [])
          .map((li) => `${indent}  <li>${inlineToXml(li)}</li>`).join('\n');
        return `${indent}<ol>\n${items}\n${indent}</ol>`;
      }
      if (t === 'codeBlock') {
        return `${indent}<codeblock>${inlineToXml(node)}</codeblock>`;
      }
      if (t === 'blockquote') {
        return `${indent}<note>${inlineToXml(node)}</note>`;
      }
      if (t === 'table') {
        return `${indent}<simpletable><!-- table content --></simpletable>`;
      }
      return `${indent}<p>${inlineToXml(node)}</p>`;
    }).join('\n');
  };

  const inlineToXml = (node: Record<string, unknown>): string => {
    if (!node.content) return '';
    const children = node.content as Array<Record<string, unknown>>;
    return children.map((child) => {
      if (child.type === 'text') {
        let text = escapeXml(child.text as string);
        const marks = (child.marks as Array<Record<string, string>>) || [];
        marks.forEach((m) => {
          if (m.type === 'bold') text = `<b>${text}</b>`;
          if (m.type === 'italic') text = `<i>${text}</i>`;
          if (m.type === 'underline') text = `<u>${text}</u>`;
          if (m.type === 'code') text = `<codeph>${text}</codeph>`;
        });
        return text;
      }
      if (child.type === 'paragraph') return inlineToXml(child);
      if (child.type === 'listItem') return inlineToXml(child);
      return '';
    }).join('');
  };

  const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<!DOCTYPE ${tag} PUBLIC "-//OASIS//DTD DITA ${tag.charAt(0).toUpperCase() + tag.slice(1)}//EN" "${tag}.dtd">\n`;
  xml += `<${tag} id="${titleText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'untitled'}">\n`;
  xml += `  <title>${escapeXml(titleText)}</title>\n`;

  if (shortDesc) {
    xml += `  <shortdesc>${escapeXml(shortDesc)}</shortdesc>\n`;
  }

  // Prolog
  if (prologData.author || prologData.keywords?.length || prologData.audience) {
    xml += `  <prolog>\n`;
    if (prologData.author) xml += `    <author>${escapeXml(prologData.author)}</author>\n`;
    if (prologData.keywords?.length) {
      xml += `    <metadata>\n      <keywords>\n`;
      prologData.keywords.forEach((k) => { xml += `        <keyword>${escapeXml(k)}</keyword>\n`; });
      xml += `      </keywords>\n    </metadata>\n`;
    }
    if (prologData.audience) xml += `    <audience type="${escapeXml(prologData.audience)}"/>\n`;
    xml += `  </prolog>\n`;
  }

  // Body
  xml += `  <${bodyTag}>\n`;

  // Pre-body sections (context, prereq, condition, cause, refsyn)
  for (const section of info.sections) {
    if (section.key === 'body') continue;
    if (['context', 'prereq', 'condition', 'cause', 'refsyn'].includes(section.key)) {
      const sectionContent = extra[section.key];
      if (sectionContent && (sectionContent.content as unknown[])?.length) {
        xml += `    <${section.tag}>\n`;
        xml += prosemirrorToXml(sectionContent, '      ');
        xml += `\n    </${section.tag}>\n`;
      }
    }
  }

  // Steps (for task/troubleshooting)
  if ((contentType === 'task' || contentType === 'troubleshooting') && steps.length > 0) {
    xml += `    <steps>\n`;
    steps.forEach((s) => {
      xml += `      <step>\n`;
      xml += `        <cmd>${escapeXml(s.title)}</cmd>\n`;
      if (s.stepResult) xml += `        <stepresult>${escapeXml(s.stepResult)}</stepresult>\n`;
      if (s.info) xml += `        <info>${escapeXml(s.info)}</info>\n`;
      xml += `      </step>\n`;
    });
    xml += `    </steps>\n`;
  }

  // Main body content (for non-task types)
  if (contentType !== 'task' && contentType !== 'troubleshooting') {
    if (body && (body.content as unknown[])?.length) {
      xml += prosemirrorToXml(body, '    ');
      xml += '\n';
    }
  }

  // Post-body sections (result, postreq, example, properties)
  for (const section of info.sections) {
    if (section.key === 'body') continue;
    if (['result', 'postreq', 'example', 'properties'].includes(section.key)) {
      const sectionContent = extra[section.key];
      if (sectionContent && (sectionContent.content as unknown[])?.length) {
        xml += `    <${section.tag}>\n`;
        xml += prosemirrorToXml(sectionContent, '      ');
        xml += `\n    </${section.tag}>\n`;
      }
    }
  }

  xml += `  </${bodyTag}>\n`;
  xml += `</${tag}>`;
  return xml;
}

export default function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id;

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [type, setType] = useState<string>('topic');
  const [status, setStatus] = useState<string>('draft');
  const [locale, setLocale] = useState('en');
  const [body, setBody] = useState<Record<string, unknown>>({});
  const [prolog, setProlog] = useState<Prolog>({});
  const [steps, setSteps] = useState<StepFormData[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [activeTab, setActiveTab] = useState<'structure' | 'prolog' | 'xml' | 'review'>('structure');

  /* Extra DITA sections stored in metadata.ditaSections */
  const [ditaSections, setDitaSections] = useState<Record<string, Record<string, unknown>>>({});

  /* Review panel state */
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [reviewAssignee, setReviewAssignee] = useState('');
  const [reviewInstructions, setReviewInstructions] = useState('');
  const [reviewDueDate, setReviewDueDate] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgUser[]>([]);

  /* Collapsed sections */
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const updateDitaSection = useCallback((key: string, value: Record<string, unknown>) => {
    setDitaSections((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* Fetch org members for reviewer dropdown */
  useEffect(() => {
    api.get<OrgUser[]>('/users')
      .then(({ data }) => setOrgMembers(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    api.get<ContentItem>(`/content/${id}`).then(({ data }) => {
      setTitle(data.title);
      setShortDescription(data.shortDescription || '');
      setType(data.type);
      setStatus(data.status);
      setLocale(data.locale);
      setBody(data.body);
      setProlog(data.prolog || {});
      if (data.metadata?.ditaSections) {
        setDitaSections(data.metadata.ditaSections as Record<string, Record<string, unknown>>);
      }
      if (data.steps?.length) {
        setSteps(
          data.steps.map((s) => ({
            key: `step-${++stepKeyCounter}`,
            stepNumber: s.stepNumber,
            title: s.title,
            body: s.body,
            stepResult: s.stepResult || '',
            info: s.info || '',
          })),
        );
      }
      setLoading(false);
    });
  }, [id]);

  /* Fetch comments when review tab is opened */
  useEffect(() => {
    if (activeTab === 'review' && id) {
      api.get<ReviewComment[]>(`/workflows/comments/${id}`)
        .then(({ data }) => setComments(data))
        .catch(() => {});
    }
  }, [activeTab, id]);

  const submitForReview = async () => {
    if (!id || !reviewAssignee.trim()) return;
    setSubmittingReview(true);
    try {
      /* Set content status to in_review */
      await api.patch(`/content/${id}`, { status: 'in_review' });
      setStatus('in_review');

      /* Create a review task */
      await api.post('/workflows/reviews', {
        contentItemId: id,
        assigneeId: reviewAssignee,
        instructions: reviewInstructions || undefined,
        dueDate: reviewDueDate || undefined,
      });

      setShowReviewPanel(false);
      setReviewAssignee('');
      setReviewInstructions('');
      setReviewDueDate('');
      alert('Content submitted for review successfully!');
    } catch {
      alert('Failed to submit for review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const postComment = async () => {
    if (!id || !newComment.trim()) return;
    setPostingComment(true);
    try {
      await api.post('/workflows/comments', {
        contentItemId: id,
        body: newComment,
      });
      setNewComment('');
      const { data } = await api.get<ReviewComment[]>(`/workflows/comments/${id}`);
      setComments(data);
    } catch {
      alert('Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const resolveComment = async (commentId: string, resolved: boolean) => {
    try {
      await api.patch(`/workflows/comments/${commentId}/resolve`, { resolved });
      const { data } = await api.get<ReviewComment[]>(`/workflows/comments/${id}`);
      setComments(data);
    } catch { /* */ }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        type,
        title,
        shortDescription,
        body,
        locale,
        prolog,
        metadata: { ditaSections },
      };

      if (type === 'task' || type === 'troubleshooting') {
        payload.steps = steps.map((s, i) => ({
          stepNumber: i + 1,
          title: s.title,
          body: s.body,
          stepResult: s.stepResult,
          info: s.info,
        }));
      }

      if (isNew) {
        await api.post('/content', payload);
      } else {
        await api.patch(`/content/${id}`, { ...payload, status });
      }
      navigate('/dashboard');
    } catch {
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const showStepsTab = type === 'task' || type === 'troubleshooting';
  const ditaInfo = DITA_LABELS[type] || DITA_LABELS.topic;

  const addStep = () => {
    setSteps((prev) => [...prev, createEmptyStep(prev.length + 1)]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof StepFormData, value: unknown) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="content-editor-page">
      <form onSubmit={handleSubmit}>
        <div className="editor-header">
          <div>
            <h1>{isNew ? 'New Content' : 'Edit Content'}</h1>
            <div className="dita-type-badge">
              <span className="dita-tag">&lt;{ditaInfo.tag}&gt;</span>
              <span className="text-secondary">{ditaInfo.desc}</span>
            </div>
          </div>
          <div className="editor-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </button>
            {!isNew && status === 'draft' && (
              <button
                type="button"
                className="btn btn-review"
                onClick={() => setShowReviewPanel(!showReviewPanel)}
              >
                Submit for Review
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Submit for Review panel */}
        {showReviewPanel && (
          <div className="review-panel">
            <h3>Submit for Review</h3>
            <p className="text-secondary" style={{ fontSize: 13, marginBottom: 12 }}>
              Select a team member to review this content. The status will be changed to "In Review".
            </p>
            <div className="review-panel-form">
              <div className="form-group">
                <label>Assign Reviewer</label>
                <select
                  value={reviewAssignee}
                  onChange={(e) => setReviewAssignee(e.target.value)}
                >
                  <option value="">Select a reviewer...</option>
                  {orgMembers
                    .filter((m) => m.id !== user?.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} ({m.email}) — {m.role}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Instructions (optional)</label>
                <textarea
                  placeholder="What should the reviewer focus on?"
                  value={reviewInstructions}
                  onChange={(e) => setReviewInstructions(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Due Date (optional)</label>
                <input
                  type="date"
                  value={reviewDueDate}
                  onChange={(e) => setReviewDueDate(e.target.value)}
                />
              </div>
              <div className="create-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReviewPanel(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submittingReview || !reviewAssignee.trim()}
                  onClick={submitForReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!isNew && status === 'in_review' && (
          <div className="review-status-banner">
            &#9998; This content is currently <strong>in review</strong>.
          </div>
        )}

        {/* DITA-structured metadata */}
        <div className="editor-meta">
          <div className="dita-section-header" onClick={() => toggleSection('meta')} style={{ cursor: 'pointer' }}>
            <span className="dita-tag-inline">&lt;title&gt;</span>
            <span className="section-toggle">{collapsedSections.meta ? '▸' : '▾'}</span>
          </div>
          {!collapsedSections.meta && (
            <>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Content title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="shortDescription">
                  Short Description <span className="dita-tag-inline">&lt;shortdesc&gt;</span>
                </label>
                <textarea
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="A brief description that appears in search results, link previews, and at the top of the rendered topic."
                  rows={2}
                />
              </div>

              <div className="meta-row">
                <div className="form-group">
                  <label htmlFor="type">Content Type</label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={!isNew}
                  >
                    <option value="topic">Topic</option>
                    <option value="concept">Concept</option>
                    <option value="task">Task</option>
                    <option value="reference">Reference</option>
                    <option value="glossary">Glossary Entry</option>
                    <option value="troubleshooting">Troubleshooting</option>
                  </select>
                </div>

                {!isNew && (
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="in_review">In Review</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="locale">Locale</label>
                  <input
                    id="locale"
                    type="text"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                    placeholder="en"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="editor-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('structure')}
          >
            <span className="dita-tag-inline">&lt;{ditaInfo.sections.find(s => s.key === 'body')?.tag || 'body'}&gt;</span>
            {' '}Content
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'prolog' ? 'active' : ''}`}
            onClick={() => setActiveTab('prolog')}
          >
            <span className="dita-tag-inline">&lt;prolog&gt;</span>
            {' '}Metadata
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'xml' ? 'active' : ''}`}
            onClick={() => setActiveTab('xml')}
          >
            DITA XML
          </button>
          {!isNew && (
            <button
              type="button"
              className={`tab-btn ${activeTab === 'review' ? 'active' : ''}`}
              onClick={() => setActiveTab('review')}
            >
              Comments
            </button>
          )}
        </div>

        {/* === Structure Tab: DITA-aware sections === */}
        {activeTab === 'structure' && (
          <div className="dita-structure">
            {ditaInfo.sections.map((section) => {
              const isStepsSection = section.key === 'body' && showStepsTab;
              const isCollapsed = collapsedSections[section.key];

              return (
                <div key={section.key} className={`dita-section ${section.required ? 'required' : ''}`}>
                  <div className="dita-section-header" onClick={() => toggleSection(section.key)}>
                    <div className="dita-section-label">
                      <span className="dita-tag-inline">&lt;{section.tag}&gt;</span>
                      <span className="dita-section-name">{section.label}</span>
                      {section.required && <span className="dita-required">required</span>}
                    </div>
                    <span className="section-toggle">{isCollapsed ? '▸' : '▾'}</span>
                  </div>

                  {!isCollapsed && (
                    <div className="dita-section-body">
                      <p className="dita-section-hint">{section.hint}</p>

                      {/* Steps section for task/troubleshooting */}
                      {isStepsSection ? (
                        <div className="steps-editor">
                          {steps.map((step, index) => (
                            <div key={step.key} className="step-card">
                              <div className="step-header">
                                <span className="step-number">
                                  <span className="dita-tag-inline">&lt;step&gt;</span> Step {index + 1}
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  onClick={() => removeStep(index)}
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="form-group">
                                <label>
                                  <span className="dita-tag-inline">&lt;cmd&gt;</span> Command
                                </label>
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => updateStep(index, 'title', e.target.value)}
                                  placeholder="What the user should do"
                                  required
                                />
                              </div>
                              <div className="form-group">
                                <label>
                                  <span className="dita-tag-inline">&lt;stepresult&gt;</span> Step Result
                                </label>
                                <input
                                  type="text"
                                  value={step.stepResult}
                                  onChange={(e) => updateStep(index, 'stepResult', e.target.value)}
                                  placeholder="What happens after this step"
                                />
                              </div>
                              <div className="form-group">
                                <label>
                                  <span className="dita-tag-inline">&lt;info&gt;</span> Additional Info
                                </label>
                                <textarea
                                  value={step.info}
                                  onChange={(e) => updateStep(index, 'info', e.target.value)}
                                  placeholder="Extra notes, tips, or warnings"
                                  rows={2}
                                />
                              </div>
                            </div>
                          ))}
                          <button type="button" className="btn btn-secondary" onClick={addStep}>
                            + Add Step
                          </button>
                        </div>
                      ) : section.key === 'body' ? (
                        /* Main body editor */
                        <Editor content={body} onChange={setBody} />
                      ) : (
                        /* Extra DITA section editors */
                        <Editor
                          content={ditaSections[section.key] || {}}
                          onChange={(json) => updateDitaSection(section.key, json)}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* === Prolog Tab === */}
        {activeTab === 'prolog' && (
          <div className="prolog-editor">
            <div className="prolog-grid">
              <div className="form-group">
                <label htmlFor="prolog-author">Author</label>
                <input
                  id="prolog-author"
                  type="text"
                  value={prolog.author || ''}
                  onChange={(e) => setProlog({ ...prolog, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-source">Source</label>
                <input
                  id="prolog-source"
                  type="text"
                  value={prolog.source || ''}
                  onChange={(e) => setProlog({ ...prolog, source: e.target.value })}
                  placeholder="Source reference"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-audience">Audience</label>
                <input
                  id="prolog-audience"
                  type="text"
                  value={prolog.audience || ''}
                  onChange={(e) => setProlog({ ...prolog, audience: e.target.value })}
                  placeholder="e.g. administrators, developers"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-category">Category</label>
                <input
                  id="prolog-category"
                  type="text"
                  value={prolog.category || ''}
                  onChange={(e) => setProlog({ ...prolog, category: e.target.value })}
                  placeholder="e.g. Configuration, Installation"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-permissions">Permissions</label>
                <input
                  id="prolog-permissions"
                  type="text"
                  value={prolog.permissions || ''}
                  onChange={(e) => setProlog({ ...prolog, permissions: e.target.value })}
                  placeholder="e.g. internal, public"
                />
              </div>
              <div className="form-group">
                <label htmlFor="prolog-keywords">Keywords (comma-separated)</label>
                <input
                  id="prolog-keywords"
                  type="text"
                  value={(prolog.keywords || []).join(', ')}
                  onChange={(e) =>
                    setProlog({
                      ...prolog,
                      keywords: e.target.value
                        .split(',')
                        .map((k) => k.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="keyword1, keyword2"
                />
              </div>
            </div>
          </div>
        )}

        {/* XML Preview Tab */}
        {activeTab === 'xml' && (
          <div className="xml-preview">
            <div className="xml-preview-header">
              <span className="dita-tag-inline">&lt;?xml version="1.0"?&gt;</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const xml = generateDitaXml(type, title, shortDescription, body, ditaSections, prolog, steps);
                  navigator.clipboard.writeText(xml);
                }}
              >
                Copy XML
              </button>
            </div>
            <pre className="xml-code">
              <code>{generateDitaXml(type, title, shortDescription, body, ditaSections, prolog, steps)}</code>
            </pre>
          </div>
        )}

        {/* Review/Comments Tab */}
        {activeTab === 'review' && !isNew && (
          <div className="comments-panel">
            <div className="comment-compose">
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={postingComment || !newComment.trim()}
                onClick={postComment}
              >
                {postingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>

            {comments.length === 0 ? (
              <p className="text-secondary" style={{ textAlign: 'center', padding: 24 }}>
                No comments yet.
              </p>
            ) : (
              <div className="comment-list">
                {comments.map((c) => (
                  <div key={c.id} className={`comment-item ${c.resolved ? 'resolved' : ''}`}>
                    <div className="comment-header">
                      <span className="comment-author">{c.authorId.slice(0, 8)}...</span>
                      <span className="comment-time text-secondary">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                      {c.resolved && <span className="badge badge-published">Resolved</span>}
                    </div>
                    <div className="comment-body">{c.body}</div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => resolveComment(c.id, !c.resolved)}
                    >
                      {c.resolved ? 'Reopen' : 'Resolve'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

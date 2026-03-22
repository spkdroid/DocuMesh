import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Underline from '@tiptap/extension-underline';
import './Editor.css';

interface EditorProps {
  content: Record<string, unknown>;
  onChange: (json: Record<string, unknown>) => void;
}

export default function Editor({ content, onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your content...',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      Subscript,
      Superscript,
      Underline,
    ],
    content: content as Parameters<typeof useEditor>[0] extends { content: infer C } ? C : never,
    onUpdate({ editor: e }) {
      onChange(e.getJSON() as Record<string, unknown>);
    },
  });

  if (!editor) return null;

  return (
    <div className="editor-wrapper">
      <div className="editor-toolbar">
        {/* Text formatting */}
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('code') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          &lt;&gt;
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('highlight') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          HL
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('subscript') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          title="Subscript"
        >
          X<sub>2</sub>
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('superscript') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          title="Superscript"
        >
          X<sup>2</sup>
        </button>

        <span className="toolbar-separator" />

        {/* Headings */}
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('heading', { level: 4 }) ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          title="Heading 4"
        >
          H4
        </button>

        <span className="toolbar-separator" />

        {/* Lists */}
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          &bull; List
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          1. List
        </button>

        <span className="toolbar-separator" />

        {/* Blocks */}
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote / Note"
        >
          &ldquo; Quote
        </button>
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          &lt;/&gt; Code
        </button>
        <button
          type="button"
          className="toolbar-btn"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule / Section Divider"
        >
          &#8212;
        </button>

        <span className="toolbar-separator" />

        {/* Table */}
        <button
          type="button"
          className="toolbar-btn"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          title="Insert Table"
        >
          Table
        </button>
        {editor.isActive('table') && (
          <>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              title="Add Column"
            >
              +Col
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              title="Add Row"
            >
              +Row
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => editor.chain().focus().deleteTable().run()}
              title="Delete Table"
            >
              &#10005;Table
            </button>
          </>
        )}
      </div>
      <EditorContent editor={editor} className="editor-content" />
    </div>
  );
}

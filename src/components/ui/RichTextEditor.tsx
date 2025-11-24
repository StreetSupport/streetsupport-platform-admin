'use client';

import React, { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  EditorState,
  UNDO_COMMAND,
  REDO_COMMAND,
  LexicalEditor,
  $createParagraphNode,
  $isElementNode,
  $isDecoratorNode,
} from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { 
  HeadingNode, 
  QuoteNode, 
  $createHeadingNode
} from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import { LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import DOMPurify from 'dompurify';
import { Button } from './Button';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  minHeight?: string;
  label?: string;
  required?: boolean;
  helpText?: string;
  resetKey?: string | number; // Change this key to force editor reset (e.g., when Cancel is clicked)
}

// Sanitize content
const sanitizeContent = (content: string): string => {
  return DOMPurify.sanitize(content, {
    KEEP_CONTENT: true,
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

// Toolbar Component
function ToolbarPlugin({ disabled }: { disabled: boolean }) {
  const [editor] = useLexicalComposerContext();

  const handleBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  };

  const handleItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  };

  const handleUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  };

  const handleBulletList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const handleNumberedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const handleLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const handleUndo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const handleRedo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  return (
    <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50">
      {/* Headings */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h1')}
        disabled={disabled}
        className="px-3 py-1 text-sm"
        title="Heading 1"
      >
        H1
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h2')}
        disabled={disabled}
        className="px-3 py-1 text-sm"
        title="Heading 2"
      >
        H2
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatHeading('h3')}
        disabled={disabled}
        className="px-3 py-1 text-sm"
        title="Heading 3"
      >
        H3
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text Formatting */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleBold}
        disabled={disabled}
        className="px-3 py-1"
        title="Bold"
      >
        <strong>B</strong>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleItalic}
        disabled={disabled}
        className="px-3 py-1"
        title="Italic"
      >
        <em>I</em>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleUnderline}
        disabled={disabled}
        className="px-3 py-1"
        title="Underline"
      >
        <u>U</u>
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleBulletList}
        disabled={disabled}
        className="px-3 py-1"
        title="Bullet List"
      >
        • List
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleNumberedList}
        disabled={disabled}
        className="px-3 py-1"
        title="Numbered List"
      >
        1. List
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleLink}
        disabled={disabled}
        className="px-3 py-1"
        title="Add Link"
      >
        🔗 Link
      </Button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleUndo}
        disabled={disabled}
        className="px-3 py-1"
        title="Undo"
      >
        ↶
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleRedo}
        disabled={disabled}
        className="px-3 py-1"
        title="Redo"
      >
        ↷
      </Button>
    </div>
  );
}

// Plugin to set initial content only on mount
function InitialContentPlugin({ initialHtml }: { initialHtml: string }) {
  const [editor] = useLexicalComposerContext();
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    // Only set initial content once on mount
    if (!isInitialized) {
      setIsInitialized(true);
      
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(initialHtml || '<p></p>', 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();

        // Only append valid nodes (ElementNode or DecoratorNode)
        nodes.forEach((node) => {
          if ($isElementNode(node) || $isDecoratorNode(node)) {
            root.append(node);
          } else {
            // Wrap text nodes in a paragraph
            const paragraph = $createParagraphNode();
            paragraph.append(node);
            root.append(paragraph);
          }
        });

        // If no nodes were added, add an empty paragraph
        if (root.getChildrenSize() === 0) {
          root.append($createParagraphNode());
        }
      });
    }
  }, [editor, isInitialized, initialHtml]);
  
  return null;
}

/**
 * Modern Rich Text Editor Component using Lexical
 * 
 * Features:
 * - React 19 compatible
 * - Clean HTML output without unnecessary wrapper elements
 * - Rich text formatting (bold, italic, underline, lists, links, headings H1-H4)
 * - XSS protection using DOMPurify
 * - Fully clickable toolbar buttons
 * - Responsive design
 * - Accessible (WCAG AA)
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  error,
  disabled = false,
  minHeight = '200px',
  label,
  required = false,
  helpText,
  resetKey,
}) => {
  const initialConfig = {
    namespace: 'RichTextEditor',
    theme: {
      paragraph: 'mb-2',
      heading: {
        h1: 'text-3xl font-bold mb-4 mt-6',
        h2: 'text-2xl font-bold mb-3 mt-5',
        h3: 'text-xl font-bold mb-2 mt-4',
      },
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
      },
      list: {
        ul: 'list-disc list-inside mb-2',
        ol: 'list-decimal list-inside mb-2',
        listitem: 'ml-4',
      },
      link: 'text-blue-600 underline',
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode],
    editable: !disabled,
    onError: (error: Error) => {
      console.error('Lexical Error:', error);
    },
  };

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      const sanitized = sanitizeContent(htmlString);
      onChange(sanitized);
    });
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <LexicalComposer key={resetKey} initialConfig={initialConfig}>
        <div className={`border rounded-md ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'opacity-60' : ''}`}>
          <ToolbarPlugin disabled={disabled} />
          
          <div className="relative" style={{ minHeight }}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="prose max-w-none p-4 outline-none"
                  style={{ minHeight }}
                />
              }
              placeholder={
                <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>

          <OnChangePlugin onChange={handleChange} />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <InitialContentPlugin initialHtml={value} />
        </div>
      </LexicalComposer>

      {helpText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Utility function to sanitize HTML for display
 */
export const sanitizeHtmlForDisplay = (html: string): string => {
  return sanitizeContent(html);
};

export default RichTextEditor;

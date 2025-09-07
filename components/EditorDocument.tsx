'use client';

import { forwardRef, useEffect, useCallback, useState } from 'react';
import AddPageButton from './AddPageButton';

interface EditorDocumentProps {
  content: string;
  onContentChange: (content: string) => void;
}

const EditorDocument = forwardRef<HTMLDivElement, EditorDocumentProps>(
  ({ content, onContentChange }, ref) => {
    const [pages, setPages] = useState<number[]>([1]);
    // Tooltips removed: comments shown in the right rail only
    
    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      onContentChange(target.innerHTML);
    }, [onContentChange]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Handle Tab key
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    };

    useEffect(() => {
      // Set initial content if provided
      if (ref && 'current' in ref && ref.current && !ref.current.innerHTML && content) {
        ref.current.innerHTML = content;
      }
    }, [content, ref]);

    // Sync external content updates (e.g., AI highlighting) to the editor
    useEffect(() => {
      if (ref && 'current' in ref && ref.current && content) {
        if (ref.current.innerHTML !== content) {
          ref.current.innerHTML = content;
        }
      }
    }, [content, ref]);


    const handleAddPage = () => {
      setPages([...pages, pages.length + 1]);
    };

    return (
      <div className="flex flex-col items-center py-8 px-4">
        {pages.map((pageNum, index) => (
          <div key={pageNum} className="w-full max-w-4xl mb-4">
            <div className="bg-white shadow-lg rounded-sm" style={{ minHeight: '1056px' }}>
              <div
                ref={index === 0 ? ref : undefined}
                contentEditable
                suppressContentEditableWarning
                className="outline-none p-24 min-h-full"
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  color: '#202124',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                data-placeholder="Start typing..."
              />
            </div>
          </div>
        ))}
        <AddPageButton onAddPage={handleAddPage} />
        
        <style jsx>{`
          :global(.analysis-chunk) {
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
            padding: 0 2px;
            border-radius: 3px;
          }
          :global(.line-annotated) {
            position: relative;
            box-decoration-break: clone;
            -webkit-box-decoration-break: clone;
            border-radius: 3px;
            transition: background-color .12s ease, box-shadow .12s ease;
          }
          /* Highlight only when focused via the rail */
          :global(.line-annotated.focused) {
            background: #fff59d; /* Google Docs-like yellow */
            box-shadow: inset 0 0 0 2px rgba(59,130,246,.6);
          }
          :global(.comment-highlight.focused), :global(.line-annotated.focused) {
            box-shadow: inset 0 0 0 2px #3b82f6;
            transition: box-shadow .2s ease;
          }
          /* tooltip styles removed (rail-only comments) */
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #999;
            pointer-events: none;
            display: block;
          }
          
          [contenteditable] {
            caret-color: #1a73e8;
          }
          
          [contenteditable]:focus {
            outline: none;
          }
          
          @media print {
            .bg-gray-100 {
              background: white !important;
            }
            
            div[contenteditable] {
              padding: 0 !important;
            }
            
            .shadow-lg {
              box-shadow: none !important;
            }
          }
        `}</style>
      </div>
    );
  }
);

EditorDocument.displayName = 'EditorDocument';

export default EditorDocument;

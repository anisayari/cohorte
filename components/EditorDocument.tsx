'use client';

import { forwardRef, useEffect, useCallback } from 'react';

interface EditorDocumentProps {
  content: string;
  onContentChange: (content: string) => void;
}

const EditorDocument = forwardRef<HTMLDivElement, EditorDocumentProps>(
  ({ content, onContentChange }, ref) => {
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

    return (
      <div className="flex justify-center py-8 px-4">
        <div className="w-full max-w-4xl">
          <div className="bg-white shadow-lg rounded-sm" style={{ minHeight: '1056px' }}>
            <div
              ref={ref}
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
              data-placeholder="Commencez à écrire..."
            />
          </div>
          
          <style jsx>{`
            .analysis-chunk {
              box-decoration-break: clone;
              -webkit-box-decoration-break: clone;
              padding: 0 2px;
              border-radius: 3px;
            }
            .analysis-good {
              background: #dcfce7; /* green-100 */
              color: #064e3b; /* green-900 */
            }
            .analysis-neutral {
              background: #fef9c3; /* yellow-100 */
              color: #713f12; /* amber-900 */
            }
            .analysis-bad {
              background: #fee2e2; /* red-200 */
              color: #7f1d1d; /* red-900 */
            }
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
      </div>
    );
  }
);

EditorDocument.displayName = 'EditorDocument';

export default EditorDocument;

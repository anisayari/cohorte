'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CommentStorage, CommentThread as CommentThreadType } from '@/lib/comment-storage';
import CommentThread from './CommentThread';

interface CommentSystemProps {
  documentId: string;
  editorRef: React.RefObject<HTMLDivElement>;
  personas?: any[];
  onAnalyzeSelection?: (text: string, threadId: string) => void;
}

export default function CommentSystem({
  documentId,
  editorRef,
  personas = [],
  onAnalyzeSelection
}: CommentSystemProps) {
  const [threads, setThreads] = useState<CommentThreadType[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [threadPosition, setThreadPosition] = useState({ top: 0, left: 0 });
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    loadThreads();
    const interval = setInterval(loadThreads, 3000);
    return () => clearInterval(interval);
  }, [documentId]);

  useEffect(() => {
    if (threads.length > 0 && showHighlights) {
      applyHighlights();
    } else {
      removeHighlights();
    }
  }, [threads, showHighlights]);

  const loadThreads = () => {
    const loadedThreads = CommentStorage.getAllThreads(documentId);
    setThreads(loadedThreads);
  };

  const applyHighlights = () => {
    if (!editorRef.current) return;

    // Remove existing highlights
    removeHighlights();

    const content = editorRef.current.innerHTML;
    let highlightedContent = content;

    // Sort threads by start offset in reverse to avoid offset issues
    const sortedThreads = [...threads].sort((a, b) => b.startOffset - a.startOffset);

    sortedThreads.forEach(thread => {
      if (!thread.resolved || showHighlights) {
        const color = thread.resolved ? '#E0E0E0' : thread.color;
        const opacity = thread.resolved ? '0.5' : '0.3';
        
        // Create highlight span with data attributes
        const highlightSpan = `<span 
          class="comment-highlight" 
          data-thread-id="${thread.id}"
          style="background-color: ${color}; opacity: ${opacity}; cursor: pointer; position: relative;"
        >${thread.highlightedText}<span 
          class="comment-indicator"
          style="position: absolute; top: -8px; right: -8px; width: 16px; height: 16px; 
                 background: ${thread.resolved ? '#9E9E9E' : '#FFA726'}; 
                 border-radius: 50%; display: inline-flex; align-items: center; 
                 justify-content: center; font-size: 10px; color: white; 
                 box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
        >${thread.comments.length}</span></span>`;

        // Simple text replacement (in production, use proper DOM manipulation)
        highlightedContent = highlightedContent.replace(thread.highlightedText, highlightSpan);
      }
    });

    editorRef.current.innerHTML = highlightedContent;

    // Add click handlers to highlights
    const highlights = editorRef.current.querySelectorAll('.comment-highlight');
    highlights.forEach(highlight => {
      highlight.addEventListener('click', (e) => {
        e.stopPropagation();
        const threadId = (highlight as HTMLElement).dataset.threadId;
        if (threadId) {
          openThread(threadId, e as MouseEvent);
        }
      });
    });
  };

  const removeHighlights = () => {
    if (!editorRef.current) return;
    
    const highlights = editorRef.current.querySelectorAll('.comment-highlight');
    highlights.forEach(highlight => {
      const text = highlight.textContent || '';
      const textNode = document.createTextNode(text);
      highlight.parentNode?.replaceChild(textNode, highlight);
    });
  };

  const handleAddComment = () => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) {
      alert('Please select text to add a comment');
      return;
    }

    const selectedText = selection.toString();
    const range = selection.getRangeAt(0);
    
    // Calculate offset in the editor
    const startOffset = getTextOffset(editorRef.current!, range.startContainer, range.startOffset);
    const endOffset = startOffset + selectedText.length;

    // Create new thread
    const colors = ['#FFE082', '#FFCCBC', '#C5E1A5', '#B3E5FC', '#F8BBD0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const thread = CommentStorage.createThread(
      documentId,
      startOffset,
      endOffset,
      selectedText,
      randomColor
    );

    CommentStorage.saveThread(thread);
    loadThreads();

    // Open the thread for adding first comment
    setActiveThreadId(thread.id);
    
    // Position the thread near the selection
    const rect = range.getBoundingClientRect();
    setThreadPosition({
      top: rect.bottom + window.scrollY + 10,
      left: rect.left + window.scrollX
    });

    // Clear selection
    selection.removeAllRanges();
    setIsAddingComment(false);
  };

  const getTextOffset = (root: Node, node: Node, offset: number): number => {
    let textOffset = 0;
    let currentNode: Node | null = root;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null
    );

    while (currentNode = walker.nextNode()) {
      if (currentNode === node) {
        return textOffset + offset;
      }
      textOffset += (currentNode as Text).length;
    }

    return textOffset;
  };

  const openThread = (threadId: string, event: MouseEvent) => {
    setActiveThreadId(threadId);
    setThreadPosition({
      top: event.clientY + window.scrollY + 10,
      left: event.clientX + window.scrollX
    });
  };

  const handleAddCommentToThread = (threadId: string, text: string) => {
    CommentStorage.addComment(threadId, {
      text,
      author: 'User',
      authorType: 'user'
    });
    loadThreads();
  };

  const handleResolveThread = (threadId: string) => {
    CommentStorage.resolveThread(threadId);
    loadThreads();
  };

  const handleUnresolveThread = (threadId: string) => {
    CommentStorage.unresolveThread(threadId);
    loadThreads();
  };

  const handleDeleteThread = (threadId: string) => {
    CommentStorage.deleteThread(threadId);
    setActiveThreadId(null);
    loadThreads();
  };

  const handleDeleteComment = (threadId: string, commentId: string) => {
    CommentStorage.deleteComment(threadId, commentId);
    loadThreads();
  };

  const handleAnalyzeWithAI = () => {
    const thread = threads.find(t => t.id === activeThreadId);
    if (thread && onAnalyzeSelection) {
      onAnalyzeSelection(thread.highlightedText, thread.id);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <>

      {/* Active comment thread */}
      {activeThread && (
        <CommentThread
          thread={activeThread}
          position={threadPosition}
          onAddComment={(text) => handleAddCommentToThread(activeThread.id, text)}
          onResolve={() => handleResolveThread(activeThread.id)}
          onUnresolve={() => handleUnresolveThread(activeThread.id)}
          onDelete={() => handleDeleteThread(activeThread.id)}
          onDeleteComment={(commentId) => handleDeleteComment(activeThread.id, commentId)}
          onClose={() => setActiveThreadId(null)}
          personas={personas}
        />
      )}

    </>
  );
}

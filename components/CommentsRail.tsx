'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { CommentStorage, CommentThread as CommentThreadType } from '@/lib/comment-storage';

type CommentsRailProps = {
  documentId: string;
  editorRef: React.RefObject<HTMLDivElement>;
  rightOffsetPx?: number; // space to keep from right edge (e.g., persona sidebar width)
};

type PositionedComment = {
  thread: CommentThreadType;
  comment: CommentThreadType['comments'][number];
  top: number; // viewport top in px for fixed positioning
};

export default function CommentsRail({ documentId, editorRef, rightOffsetPx = 336 }: CommentsRailProps) {
  const [items, setItems] = useState<PositionedComment[]>([]);
  // No manual replies; AI-only comments

  const loadThreads = useCallback(() => CommentStorage.getAllThreads(documentId), [documentId]);

  const computePositions = useCallback((threads: CommentThreadType[]) => {
    const el = editorRef.current;
    if (!el) return [] as PositionedComment[];
    const out: PositionedComment[] = [];
    for (const t of threads) {
      let span = el.querySelector(`.line-annotated[data-thread-id="${t.id}"]`) as HTMLElement | null;
      if (!span) span = el.querySelector(`.comment-highlight[data-thread-id=\"${t.id}\"]`) as HTMLElement | null;
      if (!span) continue;
      const rect = span.getBoundingClientRect();
      const base = Math.max(80, rect.top + window.scrollY);
      const gap = 88; // px between stacked comments on same line
      t.comments.forEach((c, idx) => {
        out.push({ thread: t, comment: c, top: base + idx * gap });
      });
    }
    // keep stable order by top
    out.sort((a, b) => a.top - b.top);
    return out;
  }, [editorRef]);

  const refresh = useCallback(() => {
    const threads = loadThreads();
    // Sort by visual order but render in normal flow to avoid overlap
    const pos = computePositions(threads);
    setItems(pos);
  }, [loadThreads, computePositions]);

  useEffect(() => {
    refresh();
    const onScroll = () => refresh();
    const onResize = () => refresh();
    const onThreads = () => refresh();
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    window.addEventListener('threadsUpdated', onThreads as any);
    const id = setInterval(refresh, 2500);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('threadsUpdated', onThreads as any);
      clearInterval(id);
    };
  }, [refresh]);

  const focusThread = (t: CommentThreadType) => {
    const el = editorRef.current;
    if (!el) return;
    // Clear any previous focus highlight
    el.querySelectorAll('.line-annotated.focused').forEach((n) => n.classList.remove('focused'));
    let span = el.querySelector(`.line-annotated[data-thread-id="${t.id}"]`) as HTMLElement | null;
    if (!span) span = el.querySelector(`.comment-highlight[data-thread-id="${t.id}"]`) as HTMLElement | null;
    if (!span) return;
    span.scrollIntoView({ behavior: 'smooth', block: 'center' });
    span.classList.add('focused');
    setTimeout(() => span.classList.remove('focused'), 1600);
  };

  // No manual replies — AI-only comments

  if (items.length === 0) return null;

  return (
    <div
      className="comments-rail fixed z-30"
      style={{ right: rightOffsetPx, top: 80, width: 340, height: 'calc(100vh - 100px)', overflowY: 'auto' }}
    >
      {items.map(({ thread, comment }) => (
        <div
          key={`${thread.id}_${comment.id}`}
          className="rail-card"
          onClick={() => focusThread(thread)}
        >
          <div className="rc-head">
            <div className="rc-author">
              <div className="rc-avatar">{(comment.author || '').slice(0,1).toUpperCase()}</div>
              <span>{comment.author || 'Comment'}</span>
            </div>
            <div className="rc-time">{new Date(comment.timestamp || thread.updatedAt).toLocaleTimeString()}</div>
          </div>
          <div className="rc-text">{comment.text || thread.highlightedText}</div>
        </div>
      ))}

      <style jsx>{`
        .rail-card {
          width: 100%;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          padding: 10px 12px;
          margin-bottom: 10px;
          cursor: pointer;
        }
        .rc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .rc-author { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 12px; color: #111827; }
        .rc-avatar { width: 20px; height: 20px; border-radius: 9999px; background: #111827; color: white; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; }
        .rc-time { font-size: 11px; color: #6b7280; }
        .rc-text { font-size: 13px; color: #1f2937; }
        @media (max-width: 1200px) {
          .comments-rail { display: none; }
        }
      `}</style>
    </div>
  );
}

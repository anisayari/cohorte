'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Check, MoreVertical, Trash2, User, Bot } from 'lucide-react';
import { CommentThread as CommentThreadType, Comment } from '@/lib/comment-storage';

interface CommentThreadProps {
  thread: CommentThreadType;
  position: { top: number; left: number };
  onAddComment: (text: string) => void;
  onResolve: () => void;
  onUnresolve: () => void;
  onDelete: () => void;
  onDeleteComment: (commentId: string) => void;
  onClose: () => void;
  personas?: {first_name: string; last_name: string}[];
}

export default function CommentThread({
  thread,
  position,
  onAddComment,
  onResolve,
  onUnresolve,
  onDelete,
  onDeleteComment,
  onClose,
  personas = []
}: CommentThreadProps) {
  const [commentText, setCommentText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (threadRef.current && !threadRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
    }
  };

  const getAuthorName = (comment: Comment) => {
    if (comment.authorType === 'user') return 'You';
    if (comment.personaId && personas.length > 0) {
      const persona = personas.find(p => p.id === comment.personaId);
      if (persona) return `${persona.first_name} ${persona.last_name}`;
    }
    return comment.author;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      ref={threadRef}
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 w-80 z-50"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        maxHeight: '500px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-800">
            {thread.resolved ? 'Resolved' : 'Comments'}
          </span>
          {thread.resolved && (
            <Check className="w-4 h-4 text-green-600" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-gray-100 rounded transition-colors relative"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36 z-10">
                {!thread.resolved ? (
                  <button
                    onClick={() => {
                      onResolve();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700"
                  >
                    Mark as resolved
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onUnresolve();
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700"
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-red-600"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </div>
                </button>
              </div>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Highlighted text */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Selected text:</p>
        <p className="text-sm text-gray-800 italic">&quot;{thread.highlightedText}&quot;</p>
      </div>

      {/* Comments */}
      <div className="flex-1 overflow-y-auto max-h-64 p-3 space-y-3">
        {thread.comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No comments yet. Start the discussion!
          </p>
        ) : (
          thread.comments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-full ${
                  comment.authorType === 'user' 
                    ? 'bg-gray-200' 
                    : 'bg-gray-100'
                }`}>
                  {comment.authorType === 'user' ? (
                    <User className="w-3.5 h-3.5 text-gray-700" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-800">
                      {getAuthorName(comment)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.text}</p>
                </div>
                <button
                  onClick={() => onDeleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment form */}
      {!thread.resolved && (
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className={`p-2 rounded-lg transition-colors ${
                commentText.trim()
                  ? 'bg-gray-800 hover:bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

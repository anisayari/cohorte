'use client';

import React, { useState, useEffect } from 'react';
import { ConversationStorage, Conversation } from '@/lib/conversation-storage';
import { ChevronLeft, ChevronRight, Plus, FileText, MoreVertical, Trash2, Edit3, Square, CheckSquare } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface ConversationSidebarProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ConversationSidebar({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  isOpen,
  onToggle
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = () => {
    const convs = ConversationStorage.getAllConversations();
    setConversations(convs.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
  };

  const handleDelete = (id: string) => {
    setSelectedIds(new Set([id]));
    setConfirmDeleteOpen(true);
    setMenuOpenId(null);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size > 0) {
      setConfirmDeleteOpen(true);
    }
  };

  const confirmDelete = () => {
    selectedIds.forEach(id => {
      ConversationStorage.deleteConversation(id);
      if (currentConversationId === id) {
        onNewConversation();
      }
    });
    loadConversations();
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(conversations.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
    setMenuOpenId(null);
  };

  const saveTitle = (id: string) => {
    if (editTitle.trim()) {
      ConversationStorage.updateConversationTitle(id, editTitle.trim());
      loadConversations();
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <div 
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-40 shadow-sm ${
          isOpen ? 'w-72' : 'w-0'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-100">
            <button
              onClick={onNewConversation}
              className="w-full flex items-center justify-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm shadow-sm mb-3"
            >
              <Plus className="w-4 h-4" />
              <span>New Script</span>
            </button>
            {conversations.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {selectMode && selectedIds.size > 0 
                    ? `${selectedIds.size} selected`
                    : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`
                  }
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectMode(!selectMode);
                      if (selectMode) {
                        setSelectedIds(new Set());
                      }
                    }}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                      selectMode 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectMode ? 'Cancel' : 'Select'}
                  </button>
                  {selectMode && (
                    <>
                      <button
                        onClick={selectedIds.size === conversations.length ? deselectAll : selectAll}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        {selectedIds.size === conversations.length ? 'Deselect all' : 'Select all'}
                      </button>
                      {selectedIds.size > 0 && (
                        <button
                          onClick={handleDeleteSelected}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {conversations.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">No conversations</p>
              </div>
            ) : (
              <div className="px-3">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      if (selectMode) {
                        toggleSelection(conv.id);
                      } else {
                        onSelectConversation(conv.id);
                      }
                    }}
                    className={`group relative mb-1 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedIds.has(conv.id)
                        ? 'bg-gray-100 border border-gray-300'
                        : currentConversationId === conv.id
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTitle(conv.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-white border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="font-medium text-gray-800 text-sm truncate">
                              {conv.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-xs text-gray-500">
                                {conv.messages.length} msg
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDate(conv.updatedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="relative">
                            {selectMode ? (
                              <div className="p-1">
                                {selectedIds.has(conv.id) ? (
                                  <CheckSquare className="w-5 h-5 text-gray-800" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-lg transition-all duration-200"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </button>
                            )}
                            {menuOpenId === conv.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-32 z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditing(conv.id, conv.title);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Rename
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(conv.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`fixed top-20 bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-md border border-gray-200 transition-all duration-300 z-30 ${
          isOpen ? 'left-[17.5rem]' : 'left-4'
        }`}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete conversations"
        message={`Do you really want to delete ${selectedIds.size} conversation${selectedIds.size !== 1 ? 's' : ''}?`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}

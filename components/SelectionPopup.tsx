'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Edit3, MessageSquare } from 'lucide-react';
import Tooltip from './Tooltip';

interface SelectionPopupProps {
  onAnalyze: (text: string) => void;
  onRephrase: (text: string) => void;
  onComment: (text: string) => void;
}

export default function SelectionPopup({
  onAnalyze,
  onRephrase,
  onComment
}: SelectionPopupProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const text = selection.toString();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setSelectedText(text);
        setPosition({
          top: rect.top + window.scrollY - 45,
          left: rect.left + rect.width / 2 + window.scrollX
        });
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        const selection = window.getSelection();
        if (selection && !selection.toString()) {
          setVisible(false);
        }
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('selectionchange', handleSelection);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('selectionchange', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action: 'analyze' | 'rephrase' | 'comment') => {
    if (!selectedText) return;
    
    switch(action) {
      case 'analyze':
        onAnalyze(selectedText);
        break;
      case 'rephrase':
        onRephrase(selectedText);
        break;
      case 'comment':
        onComment(selectedText);
        break;
    }
    
    // Clear selection after action
    window.getSelection()?.removeAllRanges();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-[60] -translate-x-1/2 animate-fadeIn"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`
      }}
    >
      <div className="backdrop-blur-xl bg-white/90 border border-white/20 rounded-xl shadow-xl flex items-center gap-1 p-1">
        <Tooltip text="Analyze with personas" position="bottom">
          <button
            onClick={() => handleAction('analyze')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <BarChart3 className="w-4 h-4 text-gray-700 group-hover:text-gray-900" />
          </button>
        </Tooltip>
        
        <div className="w-px h-5 bg-gray-200" />
        
        <Tooltip text="Rephrase text" position="bottom">
          <button
            onClick={() => handleAction('rephrase')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <Edit3 className="w-4 h-4 text-gray-700 group-hover:text-gray-900" />
          </button>
        </Tooltip>
        
        <div className="w-px h-5 bg-gray-200" />
        
        <Tooltip text="Add comment" position="bottom">
          <button
            onClick={() => handleAction('comment')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <MessageSquare className="w-4 h-4 text-gray-700 group-hover:text-gray-900" />
          </button>
        </Tooltip>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
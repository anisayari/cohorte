'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Check } from 'lucide-react';

interface Persona {
  first_name: string;
  last_name: string;
  profession: string;
}

interface PersonaCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  personas: Persona[];
  selectedText: string;
  onConfirm: (selectedPersonas: number[]) => void;
}

export default function PersonaCommentModal({ 
  isOpen, 
  onClose, 
  personas, 
  selectedText,
  onConfirm 
}: PersonaCommentModalProps) {
  const [selectedPersonas, setSelectedPersonas] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const handleTogglePersona = (index: number) => {
    const newSelected = new Set(selectedPersonas);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPersonas(newSelected);
  };

  const handleConfirm = () => {
    if (selectedPersonas.size > 0) {
      onConfirm(Array.from(selectedPersonas));
      setSelectedPersonas(new Set());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Add comment</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Selected text preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Selected text:</p>
            <p className="text-sm text-gray-700 italic">&quot;{selectedText.slice(0, 200)}{selectedText.length > 200 ? '...' : ''}&quot;</p>
          </div>

          {/* Persona selection */}
          {personas.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select personas to comment
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                {personas.map((persona, index) => (
                  <button
                    key={index}
                    onClick={() => handleTogglePersona(index)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      selectedPersonas.has(index)
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-xs font-medium shrink-0">
                      {persona.first_name[0]}{persona.last_name[0]}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {persona.first_name} {persona.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {persona.profession}
                      </p>
                    </div>
                    {selectedPersonas.has(index) && (
                      <Check className="w-4 h-4 text-gray-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected personas will analyze and comment on this text
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No personas available</p>
              <p className="text-gray-400 text-xs mt-2">Generate personas first to enable comments</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedPersonas.size === 0}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedPersonas.size > 0
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Add comment
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Users, User, ChevronRight, ChevronLeft, Trash2, Check, Square, CheckSquare } from 'lucide-react';
import PersonaDetailsModal from './PersonaDetailsModal';
import ConfirmModal from './ConfirmModal';

interface PersonaSidebarProps {
  personas: any[];
  isOpen: boolean;
  onToggle: () => void;
  onDeletePersonas?: (indices: number[]) => void;
}

export default function PersonaSidebar({ personas, isOpen, onToggle, onDeletePersonas }: PersonaSidebarProps) {
  const [selectedPersona, setSelectedPersona] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handlePersonaClick = (persona: any, index: number) => {
    if (selectMode) {
      toggleSelection(index);
    } else {
      setSelectedPersona(persona);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPersona(null);
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const selectAll = () => {
    setSelectedIndices(new Set(personas.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleDeleteSelected = () => {
    if (selectedIndices.size > 0) {
      setConfirmDeleteOpen(true);
    }
  };

  const confirmDelete = () => {
    if (onDeletePersonas) {
      onDeletePersonas(Array.from(selectedIndices));
      setSelectedIndices(new Set());
      setSelectMode(false);
    }
  };

  return (
    <>
      <div 
        className={`fixed right-0 top-0 h-full bg-white border-l border-gray-200 transition-all duration-300 z-40 shadow-sm ${
          isOpen ? 'w-80' : 'w-0'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Personas générés</h3>
              </div>
              {personas.length > 0 && onDeletePersonas && (
                <button
                  onClick={() => {
                    setSelectMode(!selectMode);
                    if (selectMode) {
                      setSelectedIndices(new Set());
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    selectMode 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {selectMode ? 'Annuler' : 'Sélectionner'}
                </button>
              )}
            </div>
            {personas.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {selectMode && selectedIndices.size > 0 
                    ? `${selectedIndices.size} sélectionné${selectedIndices.size > 1 ? 's' : ''}`
                    : `${personas.length} persona${personas.length > 1 ? 's' : ''}`
                  }
                </p>
                {selectMode && (
                  <div className="flex gap-2">
                    <button
                      onClick={selectedIndices.size === personas.length ? deselectAll : selectAll}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      {selectedIndices.size === personas.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                    {selectedIndices.size > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {personas.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <User className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">Aucun persona généré</p>
                <p className="text-gray-400 text-xs mt-2">
                  Utilisez le bouton "Générer des populations" pour créer des personas
                </p>
              </div>
            ) : (
              <div className="px-3 space-y-2">
                {personas.map((persona, index) => (
                  <div
                    key={index}
                    className={`group p-3 rounded-xl transition-all duration-200 border ${
                      selectedIndices.has(index) 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                    } relative`}
                  >
                    <div 
                      onClick={() => handlePersonaClick(persona, index)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-xs">
                            {persona.first_name[0]}{persona.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {persona.first_name} {persona.last_name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {persona.age} ans • {persona.city}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {persona.mini_description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {persona.profession}
                          </span>
                          {persona.values?.slice(0, 2).map((value: string, i: number) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                              {value}
                            </span>
                          ))}
                        </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {selectMode ? (
                            <div className="p-1">
                              {selectedIndices.has(index) ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    </div>
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
          isOpen ? 'right-[19rem]' : 'right-4'
        }`}
      >
        {isOpen ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>

      <PersonaDetailsModal 
        isOpen={modalOpen}
        onClose={closeModal}
        persona={selectedPersona}
      />
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer les personas"
        message={`Voulez-vous vraiment supprimer ${selectedIndices.size} persona${selectedIndices.size > 1 ? 's' : ''} ?`}
        confirmText="Supprimer"
        type="danger"
      />
    </>
  );
}
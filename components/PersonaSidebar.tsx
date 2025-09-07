'use client';

import React, { useState } from 'react';
import { Users, User, ChevronRight, ChevronLeft, Trash2, Square, CheckSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import PersonaDetailsModal from './PersonaDetailsModal';
import ConfirmModal from './ConfirmModal';
import Tooltip from './Tooltip';

interface Persona {
  first_name: string;
  last_name: string;
  age?: number;
  city: string;
  profession: string;
  values?: string[];
  mini_description?: string;
}

interface PersonaSidebarProps {
  personas: Persona[];
  isOpen: boolean;
  onToggle: () => void;
  onDeletePersonas?: (indices: number[]) => void;
  savedPops?: { id: string; seed: string; createdAt: number; personas: Persona[] }[];
  selectedPopId?: string;
  onLoadPopulation?: (id: string) => void;
  insights?: { persona_name: string; overall?: { comment?: string; liked?: boolean } }[];
}

export default function PersonaSidebar({ personas, isOpen, onToggle, onDeletePersonas, savedPops = [], selectedPopId = '', onLoadPopulation, insights = [] }: PersonaSidebarProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personas' | 'insights'>('personas');

  const handlePersonaClick = (persona: Persona, index: number) => {
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
            {/* Tabs */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => { setActiveTab('personas'); setSelectMode(false); setSelectedIndices(new Set()); }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${activeTab === 'personas' ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'}`}
              >
                Personas ({personas.length})
              </button>
              <button
                onClick={() => { setActiveTab('insights'); setSelectMode(false); setSelectedIndices(new Set()); }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${activeTab === 'insights' ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'}`}
              >
                Insights ({insights.length})
              </button>
            </div>
            {/* Saved populations (personas tab only) */}
            {activeTab === 'personas' && savedPops && savedPops.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs text-gray-600 mb-2 font-medium">Saved populations</label>
                <select
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:border-gray-300 transition-colors text-gray-700"
                  value={selectedPopId}
                  onChange={(e) => onLoadPopulation && onLoadPopulation(e.target.value)}
                >
                  <option value="">Select a population...</option>
                  {savedPops.map((p) => (
                    <option key={p.id} value={p.id}>
                      {new Date(p.createdAt).toLocaleDateString()} - {p.seed ? p.seed.slice(0, 30) + '...' : 'No description'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">{activeTab === 'personas' ? 'Generated personas' : 'Insights'}</h3>
              </div>
              {activeTab === 'personas' && personas.length > 0 && onDeletePersonas && (
                <Tooltip text={selectMode ? "Cancel selection" : "Select to delete"} position="bottom">
                  <button
                    onClick={() => {
                      setSelectMode(!selectMode);
                      if (selectMode) {
                        setSelectedIndices(new Set());
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
                </Tooltip>
              )}
            </div>
            {activeTab === 'personas' && personas.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {selectMode && selectedIndices.size > 0 
                    ? `${selectedIndices.size} selected`
                    : `${personas.length} persona${personas.length !== 1 ? 's' : ''}`
                  }
                </p>
                {selectMode && (
                  <div className="flex gap-2">
                    <Tooltip text={selectedIndices.size === personas.length ? "Deselect all" : "Select all"} position="bottom">
                      <button
                        onClick={selectedIndices.size === personas.length ? deselectAll : selectAll}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        {selectedIndices.size === personas.length ? 'Deselect all' : 'Select all'}
                      </button>
                    </Tooltip>
                    {selectedIndices.size > 0 && (
                      <Tooltip text="Delete selected personas" position="bottom">
                        <button
                          onClick={handleDeleteSelected}
                          className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {activeTab === 'insights' ? (
              <div className="px-4 space-y-3">
                {insights.length === 0 ? (
                  <div className="text-sm text-gray-500 px-1">No insights yet — run Analyze.</div>
                ) : insights.map((ins, i) => {
                  const liked = !!ins.overall?.liked;
                  const comment = String(ins.overall?.comment || '');
                  return (
                    <div key={i} className="border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-gray-900 truncate pr-2">{ins.persona_name}</div>
                        <div className="shrink-0">
                          {liked ? <ThumbsUp className="w-4 h-4 text-green-600" /> : <ThumbsDown className="w-4 h-4 text-red-600" />}
                        </div>
                      </div>
                      <div className="text-sm text-gray-900">“{comment}”</div>
                    </div>
                  );
                })}
              </div>
            ) : personas.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <User className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">No personas yet</p>
                <p className="text-gray-400 text-xs mt-2">
                  Use the &quot;Generate personas&quot; button to create personas
                </p>
              </div>
            ) : (
              <div className="px-3 space-y-2">
                {personas.map((persona, index) => (
                  <div
                    key={index}
                    className={`group p-3 rounded-xl transition-all duration-200 border ${
                      selectedIndices.has(index) 
                        ? 'bg-gray-100 border-gray-300' 
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-medium text-xs">
                              {persona.first_name[0]}{persona.last_name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 truncate">
                                {persona.first_name} {persona.last_name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {persona.age ? `${persona.age} y • ` : ''}{persona.city}
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
                              <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {selectMode ? (
                            <div className="p-1">
                              {selectedIndices.has(index) ? (
                                <CheckSquare className="w-5 h-5 text-gray-800" />
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

      <Tooltip text={isOpen ? "Close panel" : "View personas"} position="left">
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
      </Tooltip>

      <PersonaDetailsModal 
        isOpen={modalOpen}
        onClose={closeModal}
        persona={selectedPersona}
      />
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title="Delete personas"
        message={`Do you really want to delete ${selectedIndices.size} persona${selectedIndices.size !== 1 ? 's' : ''}?`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}

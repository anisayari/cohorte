'use client';

import React from 'react';
import { Users, BarChart3, X } from 'lucide-react';
import Tooltip from './Tooltip';

interface FloatingActionsProps {
  onGeneratePopulation: () => void;
  onAnalyze: () => void;
  onClearHighlights: () => void;
  generating: boolean;
  analyzing: boolean;
  canClear: boolean;
}

export default function FloatingActions({
  onGeneratePopulation,
  onAnalyze,
  onClearHighlights,
  generating,
  analyzing,
  canClear
}: FloatingActionsProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-40">
      <Tooltip text="Generate 5 personas to analyze your text" position="top">
        <button
          onClick={onGeneratePopulation}
          disabled={generating}
          className={`
            flex items-center gap-2.5 px-5 py-3 rounded-2xl font-medium text-sm
            backdrop-blur-xl bg-white/80 border border-white/20 shadow-lg
            transition-all duration-300 hover:scale-105 hover:shadow-xl
            ${generating 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-white/90 active:scale-95'
            }
          `}
        >
          <Users className={`w-4 h-4 text-gray-700 ${generating ? 'animate-pulse' : ''}`} />
          <span className="text-gray-800">
            {generating ? 'Generating...' : 'Generate personas'}
          </span>
        </button>
      </Tooltip>

      <Tooltip text="Analyze all text with personas" position="top">
        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className={`
            flex items-center gap-2.5 px-5 py-3 rounded-2xl font-medium text-sm
            backdrop-blur-xl bg-white/80 border border-white/20 shadow-lg
            transition-all duration-300 hover:scale-105 hover:shadow-xl
            ${analyzing 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-white/90 active:scale-95'
            }
          `}
        >
          <BarChart3 className={`w-4 h-4 text-gray-700`} />
          <span className="text-gray-800">
            {analyzing ? 'Analyzing...' : 'Analyze'}
          </span>
        </button>
      </Tooltip>

      {canClear && (
        <Tooltip text="Clear analysis highlights" position="top">
          <button
            onClick={onClearHighlights}
            className="
              p-3 rounded-2xl
              backdrop-blur-xl bg-white/80 border border-white/20 shadow-lg
              transition-all duration-300 hover:scale-105 hover:shadow-xl
              hover:bg-white/90 active:scale-95
            "
          >
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}

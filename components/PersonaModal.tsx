'use client';

import { useState, useEffect } from 'react';

interface Persona {
  first_name: string;
  last_name: string;
  city: string;
  mini_description: string;
}

interface PersonaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (seed: string) => void;
  generating?: boolean;
  progress?: number; // 0..1
  total?: number; // default 5
  generated?: Persona[];
}

export default function PersonaModal({ open, onClose, onConfirm, generating, progress = 0, total = 5, generated = [] }: PersonaModalProps) {
  const [seed, setSeed] = useState('');

  useEffect(() => {
    if (open) setSeed('');
  }, [open]);

  if (!open) return null;

  const canClose = !generating;
  const pct = Math.round((progress || 0) * 100);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 1000 }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => canClose && onClose()} />
      <div className="relative z-10 bg-white text-gray-800 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="text-lg font-semibold">Describe the population</div>
          <div className="text-sm text-gray-500">Enter a short description to guide generation (e.g. “young sci‑fi movie fans in Paris”).</div>
        </div>
        <div className="p-5 space-y-4">
          <textarea
            className="w-full border rounded p-3 min-h-28 outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="E.g. adults 25–35, like comedies and short content"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            disabled={!!generating}
          />

          {generating && (
            <div>
              <div className="flex items-center justify-between mb-1 text-sm text-gray-600">
                <span>Generating</span>
                <span>{generated.length}/{total}</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded">
                <div className="h-2 bg-blue-600 rounded" style={{ width: `${pct}%` }} />
              </div>
              {generated.length > 0 && (
                <div className="mt-3 border rounded p-2 bg-gray-50 max-h-44 overflow-y-auto text-sm">
                  {generated.map((p, i) => (
                    <div key={i} className="py-1">
                      <span className="font-medium">{p.first_name} {p.last_name}</span>
                      <span className="opacity-70"> • {p.city}</span>
                      <span className="opacity-70"> — {p.mini_description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-200 flex gap-2 justify-end">
          <button
            className={`px-3 py-1.5 rounded border ${canClose ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            onClick={onClose}
            disabled={!canClose}
          >
            {generating ? 'In progress…' : 'Close'}
          </button>
          <button
            className={`px-3 py-1.5 rounded border ${generating ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            onClick={() => onConfirm(seed.trim())}
            disabled={!!generating}
          >
            Generate 5 personas
          </button>
        </div>
      </div>
    </div>
  );
}

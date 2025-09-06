'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddPageButtonProps {
  onAddPage: () => void;
}

export default function AddPageButton({ onAddPage }: AddPageButtonProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto h-20"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {visible && (
        <button
          onClick={onAddPage}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 flex items-center justify-center group"
        >
          <Plus className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
        </button>
      )}
      <div className="absolute top-8 left-0 right-0 border-t border-gray-200 opacity-0 hover:opacity-100 transition-opacity" />
    </div>
  );
}
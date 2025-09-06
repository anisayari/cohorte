'use client';

import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Download,
  ChevronDown,
  IndentIncrease,
  IndentDecrease,
  Users,
  BarChart3
} from 'lucide-react';
import Tooltip from './Tooltip';

interface EditorToolbarProps {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  fontSize: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  onFormat: (format: string) => void;
  onFontSize: (size: string) => void;
  onFontFamily: (family: string) => void;
  onSavePdf: () => void;
}

export default function EditorToolbar({
  isBold,
  isItalic,
  isUnderline,
  fontSize,
  fontFamily,
  textAlign,
  onFormat,
  onFontSize,
  onFontFamily,
  onSavePdf
}: EditorToolbarProps) {
  const fontSizes = ['10', '13', '16', '18', '24', '32', '48'];
  const fontFamilies = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Comic Sans MS'];

  return (
    <div className="backdrop-blur-md bg-white/70 border-b border-gray-200/50 sticky top-0 z-50">
      <div className="px-4 py-2 flex items-center gap-1 flex-wrap">

        <Tooltip text="Undo" position="bottom">
          <button
            onClick={() => onFormat('undo')}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>
        
        <Tooltip text="Redo" position="bottom">
          <button
            onClick={() => onFormat('redo')}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Save as PDF" position="bottom">
          <button
            onClick={onSavePdf}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
          >
            <Download className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="relative">
          <select
            value={fontFamily}
            onChange={(e) => onFontFamily(e.target.value)}
            className="appearance-none px-3 py-1.5 pr-8 hover:bg-gray-100 rounded transition-colors cursor-pointer text-sm text-gray-700 bg-white border border-gray-200"
          >
            {fontFamilies.map((family) => (
              <option key={family} value={family} style={{ fontFamily: family }}>
                {family}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" />
        </div>

        <div className="relative">
          <select
            value={fontSize}
            onChange={(e) => onFontSize(e.target.value)}
            className="appearance-none px-3 py-1.5 pr-8 hover:bg-gray-100 rounded transition-colors cursor-pointer text-sm text-gray-700 bg-white border border-gray-200"
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600" />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Tooltip text="Bold" position="bottom">
          <button
            onClick={() => onFormat('bold')}
            className={`p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 ${isBold ? 'bg-gray-200 text-gray-900' : ''}`}
          >
            <Bold className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Italic" position="bottom">
          <button
            onClick={() => onFormat('italic')}
            className={`p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 ${isItalic ? 'bg-gray-200 text-gray-900' : ''}`}
          >
            <Italic className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Underline" position="bottom">
          <button
            onClick={() => onFormat('underline')}
            className={`p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 ${isUnderline ? 'bg-gray-200 text-gray-900' : ''}`}
          >
            <Underline className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Tooltip text="Align left" position="bottom">
          <button
            onClick={() => onFormat('left')}
            className={`p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 ${textAlign === 'left' ? 'bg-gray-200 text-gray-900' : ''}`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Center" position="bottom">
          <button
            onClick={() => onFormat('center')}
            className={`p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 ${textAlign === 'center' ? 'bg-gray-200 text-gray-900' : ''}`}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Align right" position="bottom">
          <button
            onClick={() => onFormat('right')}
            className={`p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 ${textAlign === 'right' ? 'bg-gray-200 text-gray-900' : ''}`}
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Justify" position="bottom">
          <button
            onClick={() => onFormat('justify')}
            className={`p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 ${textAlign === 'justify' ? 'bg-gray-200 text-gray-900' : ''}`}
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Tooltip text="Bullet list" position="bottom">
          <button
            onClick={() => onFormat('unorderedList')}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
          >
            <List className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Numbered list" position="bottom">
          <button
            onClick={() => onFormat('orderedList')}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Decrease indent" position="bottom">
          <button
            onClick={() => onFormat('outdent')}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
          >
            <IndentDecrease className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip text="Increase indent" position="bottom">
          <button
            onClick={() => onFormat('indent')}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700"
          >
            <IndentIncrease className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

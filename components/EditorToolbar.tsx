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
  IndentDecrease
} from 'lucide-react';

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
    <div className="bg-white text-gray-800 border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="px-4 py-2 flex items-center gap-1 flex-wrap">

        <button
          onClick={() => onFormat('undo')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => onFormat('redo')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onSavePdf}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Sauvegarder en PDF"
        >
          <Download className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <div className="relative">
          <select
            value={fontFamily}
            onChange={(e) => onFontFamily(e.target.value)}
            className="appearance-none px-3 py-1.5 pr-8 hover:bg-gray-100 rounded transition-colors cursor-pointer text-sm"
          >
            {fontFamilies.map((family) => (
              <option key={family} value={family} style={{ fontFamily: family }}>
                {family}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={fontSize}
            onChange={(e) => onFontSize(e.target.value)}
            className="appearance-none px-3 py-1.5 pr-8 hover:bg-gray-100 rounded transition-colors cursor-pointer text-sm"
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => onFormat('bold')}
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${isBold ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFormat('italic')}
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${isItalic ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFormat('underline')}
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${isUnderline ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => onFormat('left')}
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${textAlign === 'left' ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFormat('center')}
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${textAlign === 'center' ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFormat('right')}
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${textAlign === 'right' ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFormat('justify')}
          className={`p-2 hover:bg-gray-100 rounded transition-colors ${textAlign === 'justify' ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => onFormat('unorderedList')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFormat('orderedList')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFormat('outdent')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Decrease Indent"
        >
          <IndentDecrease className="w-4 h-4" />
        </button>

        <button
          onClick={() => onFormat('indent')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Increase Indent"
        >
          <IndentIncrease className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

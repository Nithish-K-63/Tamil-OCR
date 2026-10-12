import React from 'react';
import { TAMIL_SPECIAL_CHARS } from '../data/mockData';
import { Keyboard, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const TamilKeyboard = ({ onInsertChar, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`
      p-3 rounded-2xl border shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200
      ${isDark ? 'bg-[#25212D] border-[#301934] text-white' : 'bg-white border-gray-200 text-gray-800'}
    `}>
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-[#087E8B]" />
          <span className="text-xs font-bold font-english">Tamil Character Picker (தமிழ் எழுத்து பலகை)</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 custom-scrollbar">
        {TAMIL_SPECIAL_CHARS.map((char, index) => (
          <button
            key={index}
            onClick={() => onInsertChar(char)}
            className={`
              w-8 h-8 rounded-lg font-tamil text-sm font-semibold flex items-center justify-center transition-all
              ${isDark 
                ? 'bg-[#17151D] hover:bg-[#087E8B] text-white border border-white/5' 
                : 'bg-gray-100 hover:bg-[#087E8B] hover:text-white text-gray-800 border border-gray-200'}
            `}
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TamilKeyboard;

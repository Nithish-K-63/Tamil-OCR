import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ManuscriptViewer = ({ text, title, showBoundingBoxes = false, binarized = false }) => {
  const [zoom, setZoom] = useState(1);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleReset = () => setZoom(1);

  return (
    <div className={`
      relative rounded-2xl border overflow-hidden flex flex-col h-full min-h-[420px] transition-colors
      ${isDark ? 'bg-[#17151D] border-[#25212D]' : 'bg-[#F2ECE1] border-[#DFD6C5]'}
    `}>
      <div className="p-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between bg-black/5 dark:bg-white/5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C47745]"></span>
          <span className="text-xs font-bold truncate max-w-[200px] sm:max-w-xs">{title || "Legacy Document Scan"}</span>
          {binarized && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#087E8B]/20 text-[#087E8B] font-bold">
              Binarized Binary Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 rounded-xl p-1">
          <button 
            onClick={handleZoomOut}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-xs transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-bold w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={handleZoomIn}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-xs transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleReset}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-xs transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex items-center justify-center relative custom-scrollbar">
        <div 
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className={`
            transition-transform duration-200 relative w-full max-w-md p-8 rounded-xl shadow-2xl border
            ${binarized 
              ? 'bg-black text-white font-mono border-gray-800' 
              : 'bg-[#EFE5CD] text-[#3D3325] border-[#C8BC9D] font-tamil'}
          `}
        >
          {!binarized && (
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-2 border-red-900/30 text-red-900/40 flex flex-col items-center justify-center font-bold text-[8px] transform rotate-12 pointer-events-none select-none">
              <span>தமிழ்நாடு</span>
              <span>அரசு</span>
              <span>1892</span>
            </div>
          )}

          {showBoundingBoxes && (
            <div className="absolute inset-0 p-8 pointer-events-none">
              <div className="w-full h-8 border-2 border-[#087E8B] bg-[#087E8B]/10 rounded mb-2 flex items-center justify-end px-1">
                <span className="text-[8px] font-bold bg-[#087E8B] text-white px-1 rounded">98.4%</span>
              </div>
              <div className="w-full h-8 border-2 border-[#087E8B] bg-[#087E8B]/10 rounded mb-2 flex items-center justify-end px-1">
                <span className="text-[8px] font-bold bg-[#087E8B] text-white px-1 rounded">96.1%</span>
              </div>
              <div className="w-full h-12 border-2 border-[#C47745] bg-[#C47745]/10 rounded flex items-center justify-end px-1">
                <span className="text-[8px] font-bold bg-[#C47745] text-white px-1 rounded">84.2%</span>
              </div>
            </div>
          )}

          <div className="space-y-4 text-xs sm:text-sm leading-relaxed tracking-wide opacity-90 select-none">
            {text ? (
              text.split('\n').map((line, idx) => (
                <p key={idx} className="border-b border-black/10 dark:border-white/10 pb-1">
                  {line}
                </p>
              ))
            ) : (
              <>
                <p className="font-bold text-center underline mb-3 text-base">ஸ்ரீ சென்னை மாகாண கிராம நிலப்பதிவேடு</p>
                <p>மதுரை ஜில்லா மேலூர் தாலுகா கீழவளவு கிராமம் நில அளவை எண் 248.</p>
                <p>நஞ்சை நிலம் பரப்பு 4 ஏக்ர 32 சென்ட்.</p>
                <p>உரிமையாளர்: சுப்பையா பிள்ளை மகன் பெரியசாமி பிள்ளை.</p>
                <p>வரித் தொகை: அரையாண்டுக்கு ரூபாய் பதினைந்து அணா எட்டு.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManuscriptViewer;

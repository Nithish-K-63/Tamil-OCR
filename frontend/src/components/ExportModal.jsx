import React, { useState } from 'react';
import { FileText, Download, FileJson, X, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const ExportModal = ({ record, text, onClose }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const [downloaded, setDownloaded] = useState(null);

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([text || record?.rawTamilText || ""], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${record?.id || 'tamil_ocr_result'}_transcription.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setDownloaded("txt");
  };

  const handleDownloadJson = () => {
    const payload = {
      recordId: record?.id || "GOV-TN-1892-0482",
      title: record?.title || "Madurai Land Deed 1892",
      confidenceScore: record?.confidenceScore || 97.4,
      tamilText: text || record?.rawTamilText,
      englishTranslation: record?.englishTranslation,
      exportedAt: new Date().toISOString(),
      system: "TamilOCR - Government Archives Digitization System"
    };
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${record?.id || 'tamil_ocr_result'}_metadata.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setDownloaded("json");
  };

  const handleDownloadPdf = () => {
    window.print();
    setDownloaded("pdf");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`
        w-full max-w-md rounded-2xl border shadow-2xl p-6 relative transition-all
        ${isDark ? 'bg-[#25212D] border-[#301934] text-white' : 'bg-white border-gray-200 text-gray-800'}
      `}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-current hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#087E8B]/20 text-[#087E8B] flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base font-english">{t('export_modal_title', 'Export Digitized Record')}</h3>
            <p className="text-xs text-gray-400 font-tamil">{t('export_modal_sub', 'Choose document download format')}</p>
          </div>
        </div>

        <div className="space-y-3 my-6">
          <button
            onClick={handleDownloadPdf}
            className={`
              w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer
              ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}
            `}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#C47745]" />
              <div>
                <p className="font-bold text-xs font-english">{t('btn_pdf_title', 'Print / Save as PDF Certificate')}</p>
                <p className="text-[10px] text-gray-400">{t('btn_pdf_desc', 'Official Tamil Nadu State Archive Format')}</p>
              </div>
            </div>
            {downloaded === 'pdf' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleDownloadTxt}
            className={`
              w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer
              ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}
            `}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#087E8B]" />
              <div>
                <p className="font-bold text-xs font-english">{t('btn_txt_title', 'Plain Unicode Text (.txt)')}</p>
                <p className="text-[10px] text-gray-400">{t('btn_txt_desc', 'UTF-8 Tamil script text output')}</p>
              </div>
            </div>
            {downloaded === 'txt' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleDownloadJson}
            className={`
              w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer
              ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}
            `}
          >
            <div className="flex items-center gap-3">
              <FileJson className="w-5 h-5 text-purple-400" />
              <div>
                <p className="font-bold text-xs font-english">{t('btn_json_title', 'Metadata & Transcript JSON (.json)')}</p>
                <p className="text-[10px] text-gray-400">{t('btn_json_desc', 'Structured API / Database payload')}</p>
              </div>
            </div>
            {downloaded === 'json' && <Check className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-500/20 text-xs font-bold hover:bg-gray-500/30 transition-colors cursor-pointer"
          >
            {t('btn_close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;

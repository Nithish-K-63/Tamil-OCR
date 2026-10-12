import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Eye, 
  Edit3, 
  Copy, 
  Check, 
  Download, 
  Save 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const RecognitionResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const result = location.state?.result;
  const file = location.state?.file;
  const previewUrl = location.state?.previewUrl;
  const formData = location.state?.formData || {};

  const defaultText = `தமிழ்நாடு அரசு
வருவாய் மற்றும் பேரிடர் மேலாண்மைத் துறை

நிலப் பதிவு ஆவணம் - 1978

மாவட்டம்: தஞ்சாவூர்
வட்டம்: கும்பகோணம்
கிராமம்: சுந்தரபெருமாள் கோவில்

இவ்வாவணத்தில் குறிப்பிடப்பட்டுள்ள நிலத்தின் மொத்த பரப்பளவு இரண்டு ஏக்கர் மற்றும் நாற்பத்து மூன்று சென்ட் ஆகும். நில உரிமையாளர் திரு. சுப்பிரமணியன் த/பெ. இராமசாமி என்பவருக்கு பட்டா வழங்கப்படுகிறது.

வட்டாட்சியர்
கும்பகோணம்`;

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tamilText, setTamilText] = useState(result?.tamilText || defaultText);

  const docTitle = result?.metadata?.title || formData?.title || formData?.tamilTitle || "நிலப் பதிவு ஆவணம் - 1978";
  const docId = result?.recordId || "TNOCR-0248";
  const department = result?.metadata?.department || formData?.department || "Revenue Department";
  const district = result?.metadata?.district || formData?.district || "Thanjavur";
  const confidence = Math.round(result?.confidenceScore || 95);

  const wordsCount = result?.wordsCount || tamilText.trim().split(/\s+/).filter(Boolean).length;
  const charsCount = result?.charCount || tamilText.length;
  const fileName = file?.name || result?.fileName || "land_record_1978.jpg";

  const handleCopy = () => {
    navigator.clipboard.writeText(tamilText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          Top Header Bar
          ======================================================== */}
      <div>
        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00737D] hover:underline mb-2 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{t('btn_back_processing', 'Back to processing')}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1523] dark:text-[#F5F2EB] leading-normal font-tamil">
              {docTitle}
            </h2>
            <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1 font-english">
              {docId} · {department} · {district}
            </p>
          </div>

          {/* High Confidence Recognition Score Badge */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="w-12 h-12 rounded-full border-2 border-[#00737D] flex flex-col items-center justify-center font-bold text-xs bg-[#E0F2F1]/50 dark:bg-[#153438]/50 text-[#00737D] dark:text-[#2DD4BF] shadow-xs">
              <span className="text-sm font-extrabold leading-none">{confidence}</span>
              <span className="text-[8px] leading-none">%</span>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {confidence >= 90 ? t('badge_high_conf', 'High confidence') : t('badge_review_suggested', 'Review suggested')}
              </p>
              <p className="text-[10px] text-[#7A7185] dark:text-[#9D93A7]">
                {t('badge_recog_score', 'Recognition score')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          Split 2-Column: Original Manuscript vs Recognized Tamil Text
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: 01 Original Manuscript */}
        <div className="rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs overflow-hidden">
          <div className="p-4 px-6 border-b border-[#DFD7C7] dark:border-[#2C2237] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-md bg-[#E0F2F1] text-[#00737D] dark:bg-[#153438] dark:text-[#2DD4BF] font-mono text-xs font-bold flex items-center justify-center">
                01
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                  {t('label_orig_manuscript', 'Original manuscript')}
                </h3>
                <p className="text-[10px] text-[#7A7185] dark:text-[#9D93A7] font-mono">
                  {fileName} {file?.size ? `· ${(file.size / (1024 * 1024)).toFixed(1)} MB` : '· 3.8 MB'}
                </p>
              </div>
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFD7C7] dark:border-[#382C46] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <Eye className="w-3.5 h-3.5" />
              <span>{t('btn_fit_view', 'Fit view')}</span>
            </button>
          </div>

          {/* Dotted Canvas with Manuscript Page or Uploaded Image */}
          <div className="p-6 sm:p-8 bg-[#FAF8F5] dark:bg-[#15101C] flex items-center justify-center min-h-[480px]">
            {previewUrl ? (
              <div className="w-full flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Uploaded Manuscript" 
                  className="max-h-[460px] max-w-full object-contain rounded-xl shadow-lg border border-[#DFD7C7] dark:border-[#382C46]" 
                />
              </div>
            ) : (
              <div className="w-full max-w-sm bg-[#EFE8D8] text-[#2C241D] rounded-xl shadow-xl p-6 sm:p-8 border border-[#DFD3BE] relative font-tamil">
                {/* Year Stamp */}
                <div className="absolute top-4 right-4 px-2 py-0.5 border border-[#8B3A2B]/40 rounded text-[#8B3A2B] text-xs font-mono font-bold tracking-wider">
                  {formData?.year || "1978"}
                </div>

                <div className="space-y-4 pt-2">
                  <div className="text-center font-bold text-base text-[#1F1812] tracking-wide">
                    தமிழ்நாடு அரசு
                  </div>
                  <div className="text-xs text-center text-[#4A3E31] leading-relaxed">
                    வருவாய்த் துறை — நிலப் பதிவு
                  </div>
                  <div className="w-12 h-0.5 bg-[#4A3E31]/40 mx-auto my-2" />

                  <div className="space-y-2 text-xs text-[#3E3428] leading-relaxed">
                    <p>மாவட்டம்: {district}</p>
                    <p>வட்டம்: கும்பகோணம்</p>
                    <p>இவ்வாவணத்தில் குறிப்பிடப்பட்டுள்ள நிலத்தின் மொத்த பரப்பளவு இரண்டு ஏக்கர் நாற்பத்து மூன்று சென்ட்...</p>
                  </div>

                  <div className="pt-6 flex justify-between items-end relative">
                    <div className="text-[11px] text-[#4A3E31]">
                      <span className="border-b border-[#4A3E31]/60 pb-0.5">வட்டாட்சியர்</span>
                      <br />
                      கும்பகோணம்
                    </div>

                    {/* Stamp */}
                    <div className="w-14 h-14 rounded-full border-2 border-red-700/60 flex items-center justify-center text-red-800 text-[10px] font-bold rotate-[-10deg] shadow-inner">
                      த.நா. அரசு
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: 02 Recognized Tamil Text */}
        <div className="rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 px-6 border-b border-[#DFD7C7] dark:border-[#2C2237] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-md bg-[#E0F2F1] text-[#00737D] dark:bg-[#153438] dark:text-[#2DD4BF] font-mono text-xs font-bold flex items-center justify-center">
                02
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                  {t('label_recog_text', 'Recognized Tamil text')}
                </h3>
                <p className="text-[10px] text-[#7A7185] dark:text-[#9D93A7]">
                  {t('text_meta_prefix', 'Unicode')} · {wordsCount} {t('words_suffix', 'words')} · {charsCount} {t('chars_suffix', 'characters')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFD7C7] dark:border-[#382C46] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                {isEditing ? <Save className="w-3.5 h-3.5 text-emerald-500" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? t('btn_save', 'Save') : t('btn_edit', 'Edit')}</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFD7C7] dark:border-[#382C46] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('btn_copied', 'Copied') : t('btn_copy_text', 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Subheader Confidence Legend */}
          <div className="px-6 py-2.5 bg-[#FAF8F5] dark:bg-[#16101E] border-b border-[#DFD7C7] dark:border-[#2C2237] flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${confidence >= 90 ? 'bg-emerald-500' : 'bg-[#C07D2A]'}`} />
              <span className="text-[#7A7185] dark:text-[#9D93A7]">
                {confidence >= 90 ? t('legend_high_conf', 'High confidence (>90%)') : t('badge_review_suggested', 'Review suggested')}
              </span>
            </div>
            {saved && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-auto animate-in fade-in">
                {t('msg_changes_saved', 'Changes saved!')}
              </span>
            )}
          </div>

          {/* Text Area / Unicode Content */}
          <div className="p-6 flex-1 min-h-[420px] font-tamil text-sm leading-relaxed text-[#1A1523] dark:text-[#F5F2EB]">
            {isEditing ? (
              <textarea
                value={tamilText}
                onChange={(e) => setTamilText(e.target.value)}
                className="w-full h-96 p-4 rounded-xl border border-[#00737D] bg-white dark:bg-[#16101E] text-sm font-tamil leading-relaxed focus:outline-none resize-none"
              />
            ) : (
              <div className="whitespace-pre-line space-y-4">
                {tamilText}
              </div>
            )}
          </div>

          {/* Bottom Export Row */}
          <div className="p-4 px-6 border-t border-[#DFD7C7] dark:border-[#2C2237] bg-[#FAF8F5]/50 dark:bg-[#16101E]/50 flex items-center justify-between">
            <span className="text-[11px] text-[#7A7185] dark:text-[#9D93A7]">
              {t('tagline_preservation', 'Ready for permanent digital preservation')}
            </span>
            <button
              onClick={() => {
                const element = document.createElement("a");
                const fileBlob = new Blob([tamilText], { type: 'text/plain;charset=utf-8' });
                element.href = URL.createObjectURL(fileBlob);
                element.download = `${docId}_Recognized_Record.txt`;
                document.body.appendChild(element);
                element.click();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('btn_export_record', 'Export Record')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecognitionResults;

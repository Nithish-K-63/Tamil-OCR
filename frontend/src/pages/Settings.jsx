import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Settings = () => {
  const { t } = useLanguage();
  const [unicodeOutput, setUnicodeOutput] = useState(true);
  const [confidenceHighlighting, setConfidenceHighlighting] = useState(true);
  const [preserveOriginalImages, setPreserveOriginalImages] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl relative">
      <div className="p-6 sm:p-8 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs relative z-10">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1523] dark:text-[#F5F2EB]">
          {t('settings_heading', 'Recognition preferences')}
        </h2>
        <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1 mb-6">
          {t('settings_subheading', 'Configure defaults for this demonstration workspace.')}
        </p>

        <div className="divide-y divide-[#DFD7C7]/60 dark:divide-[#2C2237]/60">
          {/* Option 1 */}
          <div className="py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                {t('opt_unicode_output_title', 'Tamil Unicode output')}
              </p>
              <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] mt-0.5">
                {t('opt_unicode_output_desc', 'Generate standards-compliant Tamil Unicode text')}
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={unicodeOutput}
                onChange={(e) => setUnicodeOutput(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#00737D]"
              />
            </label>
          </div>

          {/* Option 2 */}
          <div className="py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                {t('opt_confidence_hl_title', 'Confidence highlighting')}
              </p>
              <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] mt-0.5">
                {t('opt_confidence_hl_desc', 'Mark uncertain words for human review')}
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={confidenceHighlighting}
                onChange={(e) => setConfidenceHighlighting(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#00737D]"
              />
            </label>
          </div>

          {/* Option 3 */}
          <div className="py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                {t('opt_preserve_img_title', 'Preserve original images')}
              </p>
              <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] mt-0.5">
                {t('opt_preserve_img_desc', 'Store manuscript images alongside digital records')}
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="checkbox"
                checked={preserveOriginalImages}
                onChange={(e) => setPreserveOriginalImages(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#00737D]"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs shadow-md shadow-[#00737D]/20 transition-all cursor-pointer"
          >
            {t('btn_save_preferences', 'Save preferences')}
          </button>
          {saved && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {t('msg_preferences_saved', 'Preferences saved successfully!')}
            </span>
          )}
        </div>
      </div>

      {/* Subtle Tamil watermark background */}
      <div className="fixed right-12 bottom-12 text-[260px] font-bold font-tamil text-black/2 dark:text-white/2 pointer-events-none select-none z-0">
        அ
      </div>
    </div>
  );
};

export default Settings;

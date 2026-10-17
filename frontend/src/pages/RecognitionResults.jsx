import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, 
  Eye, 
  Edit3, 
  Copy, 
  Check, 
  Download, 
  Save,
  RotateCw,
  Cpu,
  AlertCircle,
  FileText,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { updateRecord, resolveImageUrl, fetchRecordById } from '../api/ocrApi';

const RecognitionResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const queryId = searchParams.get('id') || searchParams.get('recordId');
  const [currentRecord, setCurrentRecord] = useState(location.state?.record || null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  const result = location.state?.result;
  const file = location.state?.file;
  const formData = location.state?.formData || {};

  const docId = location.state?.record?.id || currentRecord?.id || result?.recordId || result?.record?.id || queryId || "TNOCR-0248";

  // If user refreshed the page and state was lost, fetch the record from database
  useEffect(() => {
    if (!currentRecord && docId && !docId.startsWith("demo")) {
      setLoadingRecord(true);
      fetchRecordById(docId).then(rec => {
        if (rec) {
          setCurrentRecord(rec);
          if (rec.tamil_text !== undefined) {
            setTamilText(rec.tamil_text || "");
          }
          if (rec.image_path) {
            setPreviewUrl(resolveImageUrl(rec.image_path, rec.file_name));
          }
        }
      }).catch(err => {
        console.warn("Could not fetch record details on refresh:", err);
      }).finally(() => {
        setLoadingRecord(false);
      });
    }
  }, [docId]);

  const record = currentRecord || location.state?.record;
  const textFromApi = result?.tamilText || result?.result?.text || record?.tamil_text;
  const initialText = (textFromApi && typeof textFromApi === 'string') ? textFromApi : "";

  const docTitle = record?.title || result?.metadata?.title || formData?.title || formData?.tamilTitle || "நிலப் பதிவு ஆவணம்";
  const department = record?.department || result?.metadata?.department || formData?.department || "Revenue Department";
  const district = record?.district || result?.metadata?.district || formData?.district || "Thanjavur";
  const modelUsed = result?.metadata?.modelUsed || record?.model_name || "Tesseract OCR (Primary Model - lang='tam')";

  const rawConf = result?.confidenceScore ?? result?.result?.confidence ?? record?.confidenceRaw ?? record?.confidence ?? (initialText ? 90 : 0);
  const confidence = Math.round(typeof rawConf === 'number' ? rawConf : parseFloat(rawConf) || (initialText ? 90 : 0));

  const rawPreview = location.state?.previewUrl || 
    (file ? URL.createObjectURL(file) : null) || 
    (record ? resolveImageUrl(record.image_path, record.file_name) : null) || 
    '/test_image.webp';
  const [previewUrl, setPreviewUrl] = useState(rawPreview);

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tamilText, setTamilText] = useState(initialText);

  useEffect(() => {
    const textFromApi = result?.tamilText || result?.result?.text || record?.tamil_text;
    if (textFromApi !== undefined && textFromApi !== null) {
      setTamilText(String(textFromApi));
    }
  }, [result, record]);

  useEffect(() => {
    const nextPreview = location.state?.previewUrl || 
      (file ? URL.createObjectURL(file) : null) || 
      (record ? resolveImageUrl(record.image_path, record.file_name) : null) || 
      '/test_image.webp';
    setPreviewUrl(nextPreview);
  }, [location.state, file, record]);

  const wordsCount = tamilText.trim() ? tamilText.trim().split(/\s+/).filter(Boolean).length : 0;
  const charsCount = tamilText.replace(/\s+/g, '').length;
  const fileName = file?.name || record?.file_name || result?.fileName || "manuscript_document.jpg";

  const handleCopy = () => {
    if (!tamilText) return;
    navigator.clipboard.writeText(tamilText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (docId && !docId.startsWith("demo")) {
        await updateRecord(docId, { tamil_text: tamilText });
      }
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save updated text:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
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
            <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1 font-english flex flex-wrap items-center gap-2">
              <span>{docId} · {department} · {district}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00737D]/10 text-[#00737D] dark:text-[#2DD4BF] font-semibold text-[11px] border border-[#00737D]/20">
                <Cpu className="w-3 h-3" />
                <span>{modelUsed}</span>
              </span>
            </p>
          </div>

          {/* Recognition Score Badge */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className={`w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center font-bold text-xs shadow-xs ${
              confidence >= 80 
                ? 'border-[#00737D] bg-[#E0F2F1]/50 dark:bg-[#153438]/50 text-[#00737D] dark:text-[#2DD4BF]'
                : confidence > 0 
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                : 'border-gray-400 bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}>
              <span className="text-sm font-extrabold leading-none">{confidence}</span>
              <span className="text-[8px] leading-none">%</span>
            </div>
            <div>
              <p className={`text-xs font-bold ${
                confidence >= 80 
                  ? 'text-emerald-700 dark:text-emerald-400' 
                  : confidence > 0 
                  ? 'text-amber-700 dark:text-amber-400' 
                  : 'text-gray-500'
              }`}>
                {confidence >= 90 
                  ? t('badge_high_conf', 'High confidence') 
                  : confidence >= 70 
                  ? t('badge_review_suggested', 'Review suggested') 
                  : t('badge_low_conf', 'Low confidence warning')}
              </p>
              <p className="text-[10px] text-[#7A7185] dark:text-[#9D93A7]">
                {t('badge_recog_score', 'Recognition score')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Split 2-Column: Original Manuscript vs Recognized Tamil Text */}
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
                  {fileName} {file?.size ? `· ${(file.size / (1024 * 1024)).toFixed(1)} MB` : ''}
                </p>
              </div>
            </div>

            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFD7C7] dark:border-[#382C46] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('btn_fit_view', 'Open full image')}</span>
            </a>
          </div>

          {/* Dotted Canvas with Manuscript Page or Uploaded Image */}
          <div className="p-6 sm:p-8 bg-[#FAF8F5] dark:bg-[#15101C] flex items-center justify-center min-h-[480px]">
            {previewUrl ? (
              <div className="w-full flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Original Document" 
                  className="max-h-[460px] max-w-full object-contain rounded-xl shadow-lg border border-[#DFD7C7] dark:border-[#382C46]" 
                />
              </div>
            ) : (
              <div className="w-full max-w-sm text-center p-8 border-2 border-dashed border-[#DFD7C7] dark:border-[#382C46] rounded-xl text-[#7A7185]">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">{fileName}</p>
                <p className="text-[10px] mt-1">Image preview not available</p>
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
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFD7C7] dark:border-[#382C46] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                {isEditing ? <Save className="w-3.5 h-3.5 text-emerald-500" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? (saving ? t('btn_saving', 'Saving...') : t('btn_save', 'Save')) : t('btn_edit', 'Edit')}</span>
              </button>

              <button
                onClick={handleCopy}
                disabled={!tamilText}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFD7C7] dark:border-[#382C46] text-xs font-medium transition-colors cursor-pointer ${
                  !tamilText ? 'opacity-40 cursor-not-allowed text-gray-400' : 'text-[#4A4154] dark:text-[#D8CEE2] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('btn_copied', 'Copied') : t('btn_copy_text', 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* Subheader Confidence Legend */}
          <div className="px-6 py-2.5 bg-[#FAF8F5] dark:bg-[#16101E] border-b border-[#DFD7C7] dark:border-[#2C2237] flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                confidence >= 90 ? 'bg-emerald-500' : confidence >= 70 ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <span className="text-[#7A7185] dark:text-[#9D93A7]">
                {confidence >= 90 
                  ? t('legend_high_conf', 'High confidence (>90%)') 
                  : confidence >= 70 
                  ? t('badge_review_suggested', 'Review suggested (70-90%)') 
                  : t('badge_low_conf', 'Low confidence (<70%)')}
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
                placeholder="தமிழ் உரை அல்லது திருத்தங்களை இங்கே தட்டச்சு செய்யவும்..."
                className="w-full h-96 p-4 rounded-xl border border-[#00737D] bg-white dark:bg-[#16101E] text-sm font-tamil leading-relaxed focus:outline-none resize-none"
              />
            ) : tamilText && tamilText.trim() ? (
              <div className="whitespace-pre-line space-y-3 selection:bg-[#00737D]/20">
                {tamilText}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center p-6 border-2 border-dashed border-[#DFD7C7] dark:border-[#382C46] rounded-xl">
                <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
                <h4 className="font-semibold text-base mb-1 font-tamil">எந்த தமிழ் உரையும் கண்டறியப்படவில்லை</h4>
                <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] max-w-sm mb-4 font-english">
                  No legible Tamil text could be extracted from this document image. The scan may be faint, heavily degraded, or blank.
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#00737D] text-white text-xs font-semibold hover:bg-[#005f67] cursor-pointer"
                >
                  Enter / Transcribe Manually
                </button>
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
                if (!tamilText) return;
                const element = document.createElement("a");
                const fileBlob = new Blob([tamilText], { type: 'text/plain;charset=utf-8' });
                element.href = URL.createObjectURL(fileBlob);
                element.download = `${docId}_Recognized_Record.txt`;
                document.body.appendChild(element);
                element.click();
              }}
              disabled={!tamilText}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-xs transition-colors shadow-xs ${
                !tamilText ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-[#00737D] hover:bg-[#005F67] cursor-pointer'
              }`}
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

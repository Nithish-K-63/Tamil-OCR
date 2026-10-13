import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Check, 
  Sparkles, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [file, setFile] = useState(null);
  const [docTitle, setDocTitle] = useState('நிலப் பதிவு ஆவணம்');
  const [department, setDepartment] = useState('Revenue Department');
  const [docYear, setDocYear] = useState('1978');
  const [district, setDistrict] = useState('Thanjavur');
  const [selectedModel, setSelectedModel] = useState('tesseract_primary');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartRecognition = async () => {
    setUploading(true);
    let targetFile = file;
    if (!targetFile) {
      try {
        const resp = await fetch('/test_image.webp');
        if (resp.ok) {
          const blob = await resp.blob();
          targetFile = new File([blob], 'test image.webp', { type: 'image/webp' });
        }
      } catch (e) {
        console.warn("Could not load default test_image.webp", e);
      }
    }
    const metadata = {
      title: docTitle,
      tamilTitle: docTitle,
      department: department,
      year: docYear,
      district: district,
      model: selectedModel
    };
    navigate('/pipeline', {
      state: {
        file: targetFile,
        formData: metadata
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ========================================================
          LEFT: 2 Steps (Upload Manuscript + Document Metadata)
          ======================================================== */}
      <div className="lg:col-span-2 space-y-6">
        {/* Step 01: Upload Manuscript */}
        <div className="p-6 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-lg bg-[#E0F2F1] text-[#00737D] dark:bg-[#153438] dark:text-[#2DD4BF] font-mono text-xs font-bold flex items-center justify-center">
              01
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                {t('upload_step_1_title', 'Upload manuscript')}
              </h3>
              <p className="text-xs text-[#7A7185] dark:text-[#9D93A7]">
                {t('upload_step_1_sub', 'Choose a clear image of the handwritten Tamil document')}
              </p>
            </div>
          </div>

          {/* Drag & Drop Zone with subtle grid pattern */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`
              p-8 sm:p-12 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer relative
              ${isDragging 
                ? 'border-[#00737D] bg-[#00737D]/5' 
                : 'border-[#DFD7C7] dark:border-[#382C46] bg-[#FAF8F5]/50 dark:bg-[#16101E]/50'}
            `}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#E0F2F1] text-[#00737D] dark:bg-[#1A2E35] dark:text-[#2DD4BF] flex items-center justify-center mb-4 relative shadow-xs">
              <Upload className="w-7 h-7" />
              <FileText className="w-4 h-4 absolute -bottom-1 -right-1 text-[#00737D] bg-white dark:bg-[#1A2E35] rounded-full p-0.5" />
            </div>

            <p className="text-sm font-semibold text-[#1A1523] dark:text-[#F5F2EB]">
              {t('drop_title', 'Drop your manuscript here')}
            </p>
            <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1 mb-4">
              {t('drop_sub', 'or choose a file from your computer')}
            </p>

            <label className="px-4 py-2 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#2D233A] cursor-pointer shadow-xs transition-colors">
              {t('btn_browse_files', 'Browse files')}
              <input
                id="manuscript-file-input"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              />
            </label>

            <p className="text-[10px] text-[#9D93A7] mt-4 font-mono">
              {t('supported_formats', 'JPG, JPEG or PNG · Maximum 15 MB')}
            </p>

            {file && (
              <div className="mt-4 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                {t('selected_prefix', 'Selected:')} {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>
        </div>

        {/* Step 02: Document Metadata */}
        <div className="p-6 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-lg bg-[#E0F2F1] text-[#00737D] dark:bg-[#153438] dark:text-[#2DD4BF] font-mono text-xs font-bold flex items-center justify-center">
              02
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                {t('upload_step_2_title', 'Document metadata')}
              </h3>
              <p className="text-xs text-[#7A7185] dark:text-[#9D93A7]">
                {t('upload_step_2_sub', 'Add information to make this record easier to find')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1.5">
                {t('label_doc_title', 'Document title')}
              </label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="நிலப் பதிவு ஆவணம்"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D] font-tamil"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1.5">
                {t('label_dept', 'Department')}
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D]"
              >
                <option value="Revenue Department">{t('dept_revenue', 'Revenue Department')}</option>
                <option value="Municipal Administration">{t('dept_municipal', 'Municipal Administration')}</option>
                <option value="Public Works Department">{t('dept_pwd', 'Public Works Department')}</option>
                <option value="Judicial Archives">{t('dept_judicial', 'Judicial Archives')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1.5">
                {t('label_year', 'Document year')}
              </label>
              <input
                type="text"
                value={docYear}
                onChange={(e) => setDocYear(e.target.value)}
                placeholder="1978"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A4154] dark:text-[#B8ADC4] mb-1.5">
                {t('label_district', 'District')}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D]"
              >
                <option value="Thanjavur">{t('district_thanjavur', 'Thanjavur')}</option>
                <option value="Madurai">{t('district_madurai', 'Madurai')}</option>
                <option value="Tiruchirappalli">{t('district_trichy', 'Tiruchirappalli')}</option>
                <option value="Chennai">{t('district_chennai', 'Chennai')}</option>
                <option value="Coimbatore">{t('district_coimbatore', 'Coimbatore')}</option>
              </select>
            </div>
          </div>

          {/* Model Architecture Selection */}
          <div className="mt-6 pt-5 border-t border-[#DFD7C7]/70 dark:border-[#2C2237]">
            <label className="block text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB] mb-2.5">
              {t('label_model_select', 'AI Recognition Engine (Tesseract Primary)')}
            </label>
            <div className="grid grid-cols-1 gap-3 mb-3">
              {/* PRIMARY MODEL CARD */}
              <button
                type="button"
                onClick={() => setSelectedModel('tesseract_primary')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedModel === 'tesseract_primary'
                    ? 'border-[#00737D] bg-[#00737D]/8 ring-2 ring-[#00737D]'
                    : 'border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] hover:bg-gray-50 dark:hover:bg-[#2D233A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                      Tesseract OCR (Primary Model)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00737D] text-white">
                      PRIMARY
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    lang='tam' (Tamil Pack)
                  </span>
                </div>
                <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] leading-relaxed">
                  Direct LSTM Tamil transcription: <code className="font-mono text-[#00737D] dark:text-[#2DD4BF]">pytesseract.image_to_string(img, lang='tam')</code>. High-fidelity document parsing with full paragraph and word bounding boxes.
                </p>
              </button>
            </div>

            {/* SECONDARY MODELS */}
            <p className="text-[11px] font-semibold text-[#7A7185] dark:text-[#9D93A7] mb-2">
              Secondary Alternative Models:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedModel('t3_7_tamilcnn')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedModel === 't3_7_tamilcnn'
                    ? 'border-[#00737D] bg-[#00737D]/5 ring-2 ring-[#00737D]/40'
                    : 'border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] hover:bg-gray-50 dark:hover:bg-[#2D233A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">T3.7 TamilCNN</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    Secondary
                  </span>
                </div>
                <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] leading-relaxed">
                  4-Block Deep CNN character classifier tested on uTHCD split (1.6ms latency).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedModel('bodhan_indic_ocr')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedModel === 'bodhan_indic_ocr'
                    ? 'border-[#00737D] bg-[#00737D]/5 ring-2 ring-[#00737D]/40'
                    : 'border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] hover:bg-gray-50 dark:hover:bg-[#2D233A]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">Indic-OCR</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Secondary
                  </span>
                </div>
                <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] leading-relaxed">
                  Bodhan AI Two-Stage Architecture (IndicDocLayout + IndicBlockOCR).
                </p>
              </button>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-6 pt-5 border-t border-[#DFD7C7] dark:border-[#2C2237] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#7A7185] dark:text-[#9D93A7]">
              <Info className="w-4 h-4 text-[#00737D]" />
              <span>
                {selectedModel === 'tesseract_primary'
                  ? 'Tesseract OCR (Primary Model - lang=\'tam\') · Active'
                  : selectedModel === 'bodhan_indic_ocr'
                  ? 'Indic-OCR (Bodhan AI Architecture - Secondary) · Active'
                  : 'TamilCNN T3.7 (Secondary Model) · Active'}
              </span>
            </div>

            <button
              onClick={handleStartRecognition}
              disabled={uploading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs shadow-md shadow-[#00737D]/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{uploading ? t('btn_processing', 'Processing...') : t('btn_start_recognition', 'Start Recognition')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT: Image Quality Guide + Tamil Quote Card
          ======================================================== */}
      <div className="space-y-6">
        {/* Guide Card */}
        <div className="p-6 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs">
          <h3 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB] mb-4">
            {t('guide_title', 'Image quality guide')}
          </h3>

          {/* Document visual example */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#16101E] border border-[#DFD7C7] dark:border-[#2C2237] mb-5 relative flex items-center justify-center">
            <div className="w-32 h-40 bg-[#EFE8D8] border border-[#D5C9B3] rounded-sm p-2 shadow-sm font-tamil text-[8px] text-[#4A3E31] relative">
              <p className="font-bold text-center">தமிழ்நாடு அரசு</p>
              <div className="h-0.5 bg-[#4A3E31]/30 my-1" />
              <div className="space-y-1">
                <div className="h-1 bg-[#4A3E31]/20 rounded w-full" />
                <div className="h-1 bg-[#4A3E31]/20 rounded w-5/6" />
                <div className="h-1 bg-[#4A3E31]/20 rounded w-4/6" />
              </div>
            </div>
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300">
              <Check className="w-3 h-3" />
              {t('guide_good_quality', 'Good quality')}
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1A1523] dark:text-[#F5F2EB]">
                  {t('guide_lighting_title', 'Use even lighting')}
                </p>
                <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7]">
                  {t('guide_lighting_desc', 'Avoid shadows across the page')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1A1523] dark:text-[#F5F2EB]">
                  {t('guide_focus_title', 'Keep text in focus')}
                </p>
                <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7]">
                  {t('guide_focus_desc', 'Ensure handwriting is sharp and legible')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1A1523] dark:text-[#F5F2EB]">
                  {t('guide_full_page_title', 'Capture the full page')}
                </p>
                <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7]">
                  {t('guide_full_page_desc', 'Include all edges without cropping')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Heritage Quote Plum Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#2D1636] to-[#170E1F] text-white border border-[#442352] relative overflow-hidden shadow-md">
          <div className="absolute right-0 bottom-0 text-7xl font-bold font-tamil text-white/5 pointer-events-none select-none">
            அ
          </div>
          <p className="text-sm font-serif font-bold leading-relaxed mb-2">
            “ஒவ்வொரு ஆவணமும் நமது வரலாற்றின் குரல்”
          </p>
          <p className="text-[11px] text-[#A698B2]">
            {t('heritage_quote_en', 'Every document is a voice from our history')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;

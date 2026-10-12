import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Cpu, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Layers,
  FileCheck,
  AlertCircle,
  RotateCw
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { processDocumentOCR } from '../api/ocrApi';

const OCRProcessing = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(10);
  const [currentStep, setCurrentStep] = useState(0);
  const [binarizedView, setBinarizedView] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const file = location.state?.file;
  const formData = location.state?.formData || {};

  const isExecutingRef = useRef(false);
  const isMountedRef = useRef(true);
  const intervalRef = useRef(null);

  const steps = [
    { 
      name: t('stage_1_name', "Adaptive Binarization & Deskewing"), 
      desc: t('stage_1_desc', "Removing paper stains, age fading, deskewing and Otsu thresholding") 
    },
    { 
      name: t('stage_2_name', "Layout & Text Line Segmentation"), 
      desc: t('stage_2_desc', "Extracting handwritten Tamil text lines and character contour regions") 
    },
    { 
      name: t('stage_3_name', "Deep TamilCNN Script Recognition"), 
      desc: t('stage_3_desc', "156-class character classification with 97.3% Top-1 validation accuracy") 
    },
    { 
      name: t('stage_4_name', "Unicode Reconstruction & Post-Processing"), 
      desc: t('stage_4_desc', "Canonical NFC Tamil Unicode assembly and word boundary alignment") 
    }
  ];

  const executeOCR = async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setError(null);
    setLoading(true);
    setProgress(10);
    setCurrentStep(0);
    setOcrResult(null);

    // Simulation progress ticker that coordinates with backend response
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev < 85 && !ocrResult) {
          const next = prev + 5;
          if (next > 75) setCurrentStep(3);
          else if (next > 50) setCurrentStep(2);
          else if (next > 25) setCurrentStep(1);
          return next;
        }
        return prev;
      });
    }, 180);

    try {
      let result = null;

      if (file) {
        result = await processDocumentOCR(file, formData);
      } else {
        // If navigated directly without file, fetch demo / backend default
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#000000';
        ctx.font = '32px serif';
        ctx.fillText('அ', 16, 44);

        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        const demoFile = new File([blob], 'manuscript_sample.png', { type: 'image/png' });
        result = await processDocumentOCR(demoFile, formData);
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (isMountedRef.current) {
        setOcrResult(result);
        setProgress(100);
        setCurrentStep(3);
        setLoading(false);
      }
    } catch (err) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (isMountedRef.current) {
        console.error("OCR execution error:", err);
        setError(err.message || "Failed to process document with OCR engine");
        setLoading(false);
        setProgress(10);
      }
    } finally {
      isExecutingRef.current = false;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    executeOCR();

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [file]);

  const handleRetry = () => {
    if (loading) return;
    executeOCR();
  };

  const handleCompleteRedirect = () => {
    navigate('/results', {
      state: {
        result: ocrResult,
        file: file,
        formData: formData,
        previewUrl: file ? URL.createObjectURL(file) : null
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 my-2">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00737D]/10 text-[#00737D] text-xs font-semibold">
          <Cpu className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('pipeline_badge', 'Tamil Computer Vision Pipeline')}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1523] dark:text-[#F5F2EB] tracking-tight">
          {t('pipeline_heading', 'Processing Handwritten Script')}
        </h2>
        <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] font-tamil max-w-lg mx-auto">
          {t('pipeline_subheading', 'கணினிப் பார்வை மற்றும் ஆழ கற்றல் மாதிரி மூலம் தமிழ் கையெழுத்துப் பிரதி பகுப்பாய்வு')}
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs space-y-6">
        <div>
          <div className="flex justify-between text-xs font-semibold mb-2">
            <span className="text-[#00737D]">{t('pipeline_status', 'Pipeline Status:')} {progress}{t('status_percent_complete', '% Complete')}</span>
            <span className="text-[#7A7185] dark:text-[#9D93A7]">
              {error ? t('status_error', 'Processing Error') : progress === 100 ? t('status_ready', 'Analysis Ready') : t('status_executing', 'Executing Model Inference...')}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                error 
                  ? 'bg-rose-500' 
                  : 'bg-gradient-to-r from-[#00737D] to-[#00A3B0]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">{t('err_inference', 'Inference Error')}</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('btn_retry', 'Retry')}</span>
            </button>
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-[#FAF8F5] dark:bg-[#15101C] border border-[#DFD7C7] dark:border-[#2C2237] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00737D]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('inspection_badge', 'Vision Model Inspection')}</span>
              </div>
              <h4 className="font-bold text-sm font-tamil text-[#1A1523] dark:text-[#F5F2EB]">
                {formData.tamilTitle || formData.title || file?.name || "நிலப் பதிவு ஆவணம் - 1978"}
              </h4>
              <p className="text-xs text-[#7A7185] dark:text-[#9D93A7]">
                {steps[currentStep]?.name}
              </p>
            </div>

            <button
              onClick={() => setBinarizedView(!binarizedView)}
              className={`
                flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0
                ${binarizedView 
                  ? 'bg-[#00737D] text-white border-[#00737D]' 
                  : 'bg-white dark:bg-[#251D30] border-[#DFD7C7] dark:border-[#382C46] text-[#4A4154] dark:text-[#D8CEE2] hover:bg-black/5'}
              `}
            >
              <Layers className="w-4 h-4" />
              <span>{binarizedView ? t('btn_viewing_binarized', 'Viewing Binarized Mask') : t('btn_toggle_binarized', 'Toggle Binarized View')}</span>
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {steps.map((step, idx) => {
            const isDone = Boolean(ocrResult) || (!error && progress >= (idx + 1) * 25);
            const isCurrent = !error && loading && currentStep === idx && !isDone;

            return (
              <div 
                key={idx}
                className={`
                  p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4
                  ${isDone 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : isCurrent 
                    ? 'border-[#00737D] bg-[#00737D]/5' 
                    : 'border-[#DFD7C7]/40 dark:border-[#2C2237]/40 opacity-60'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0
                    ${isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[#00737D] text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}
                  `}>
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-[#1A1523] dark:text-[#F5F2EB]">{step.name}</h5>
                    <p className="text-[10px] text-[#7A7185] dark:text-[#9D93A7]">{step.desc}</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold">
                  {isDone ? (
                    <span className="text-emerald-600 dark:text-emerald-400">{t('stage_complete', 'Complete')}</span>
                  ) : isCurrent ? (
                    <span className="text-[#00737D]">{t('stage_processing', 'Processing')}</span>
                  ) : (
                    <span className="text-[#7A7185] dark:text-[#9D93A7]">{t('stage_pending', 'Pending')}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {progress === 100 && (
          <div className="pt-4 border-t border-[#DFD7C7] dark:border-[#2C2237] text-center animate-in fade-in duration-300">
            <button
              onClick={handleCompleteRedirect}
              className="w-full py-3.5 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-bold text-xs shadow-md shadow-[#00737D]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{t('btn_view_results', 'View Recognition Results')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OCRProcessing;

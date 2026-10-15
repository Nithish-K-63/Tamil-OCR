import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Copy, 
  Check, 
  Minimize2, 
  Trash2, 
  AlertCircle, 
  RotateCcw, 
  Cpu, 
  HelpCircle,
  MessageSquare,
  ImagePlus,
  FileImage,
  Loader2,
  ClipboardCopy,
  FileText,
  Pencil
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { sendChatMessage, fetchChatStatus, fetchChatSuggestions, uploadChatDocumentOCR, resolveImageUrl } from '../api/ocrApi';

// ── Allowed image types for OCR upload ──────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp', '.webp'];
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ── Simple, safe Markdown parser for assistant responses ────────────────────────
const MarkdownContent = ({ content }) => {
  if (!content) return null;

  // Split by double newline for paragraphs/blocks
  const blocks = content.split(/\n{2,}/);

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Check for Markdown Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={bIdx} className="font-semibold text-base text-[#1A1523] dark:text-[#F5F2EB] mt-2 mb-1">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={bIdx} className="font-bold text-base text-[#00737D] dark:text-[#38b2ac] mt-2 mb-1">
              {trimmed.replace(/^##\s+/, '')}
            </h3>
          );
        }

        // Check for Bullet Lists
        const lines = trimmed.split('\n');
        const isBulletList = lines.every(l => l.trim().startsWith('• ') || l.trim().startsWith('- ') || l.trim().startsWith('* '));
        const isNumberList = lines.every(l => /^\d+\.\s+/.test(l.trim()));

        if (isBulletList) {
          return (
            <ul key={bIdx} className="list-disc pl-5 space-y-1 my-1">
              {lines.map((line, lIdx) => {
                const text = line.trim().replace(/^([•\-\*])\s+/, '');
                return <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInline(text) }} />;
              })}
            </ul>
          );
        }

        if (isNumberList) {
          return (
            <ol key={bIdx} className="list-decimal pl-5 space-y-1 my-1">
              {lines.map((line, lIdx) => {
                const text = line.trim().replace(/^\d+\.\s+/, '');
                return <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInline(text) }} />;
              })}
            </ol>
          );
        }

        // Regular paragraph with potential single newlines
        return (
          <p 
            key={bIdx} 
            className="my-1 break-words"
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/\n/g, '<br/>')) }}
          />
        );
      })}
    </div>
  );
};

// Formatter for bold, inline code, and emphasis
function formatInline(text) {
  if (!text) return '';
  return text
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#1A1523] dark:text-[#F5F2EB]">$1</strong>')
    // Italic: *text*
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Inline code: `code`
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded text-xs font-mono bg-[#EBE5D8] dark:bg-[#2C2237] text-[#00737D] dark:text-[#5eead4]">$1</code>');
}

// ── OCR Result Display Component ────────────────────────────────────────────────
// Editable Tamil text area with Copy Text button, shown inside chat messages
const OCRResultDisplay = ({ ocrData, language }) => {
  const [editedText, setEditedText] = useState(ocrData.tamil_text || '');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const isTamil = (language || '').toLowerCase() === 'ta';

  useEffect(() => {
    setEditedText(ocrData.tamil_text || '');
  }, [ocrData.tamil_text]);

  const handleCopyText = useCallback(() => {
    if (!navigator.clipboard || !editedText) return;
    navigator.clipboard.writeText(editedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [editedText]);

  if (!ocrData.has_text) return null;

  return (
    <div className="mt-3 rounded-xl border border-[#00737D]/20 dark:border-[#00737D]/30 bg-gradient-to-b from-[#F5F2EB]/80 to-white dark:from-[#1A1424]/80 dark:to-[#120E17] overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#00737D]/8 dark:bg-[#00737D]/12 border-b border-[#00737D]/10 dark:border-[#00737D]/20">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[#00737D] dark:text-[#5eead4]" />
          <span className="text-[11px] font-semibold text-[#00737D] dark:text-[#5eead4] uppercase tracking-wider">
            {isTamil ? 'அடையாளம் காணப்பட்ட உரை' : 'Recognized Tamil Text'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Pencil className="w-3 h-3 text-[#9CA3AF]" />
          <span className="text-[10px] text-[#9CA3AF] italic">
            {isTamil ? 'திருத்தக்கூடியது' : 'Editable'}
          </span>
        </div>
      </div>

      {/* Editable text area */}
      <div className="px-3 py-2">
        <textarea
          ref={textareaRef}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="w-full min-h-[100px] max-h-[240px] bg-white dark:bg-[#1D1726] border border-[#DFD7C7] dark:border-[#2C2237] rounded-lg px-3 py-2.5 text-sm leading-relaxed text-[#1A1523] dark:text-[#F5F2EB] font-[Noto_Sans_Tamil,sans-serif] resize-y focus:outline-none focus:ring-2 focus:ring-[#00737D]/40 focus:border-[#00737D] transition-all placeholder:text-[#9CA3AF]"
          placeholder={isTamil ? 'அடையாளம் காணப்பட்ட உரை இங்கே காட்டப்படும்...' : 'Recognized text will appear here...'}
          dir="auto"
          spellCheck={false}
        />
      </div>

      {/* Footer with stats + Copy button */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#00737D]/5 dark:bg-[#00737D]/8 border-t border-[#00737D]/10 dark:border-[#00737D]/15">
        <div className="flex items-center gap-3 text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
          {ocrData.char_count > 0 && (
            <span>{ocrData.char_count} {isTamil ? 'எழுத்துகள்' : 'chars'}</span>
          )}
          {ocrData.lines_count > 0 && (
            <span>{ocrData.lines_count} {isTamil ? 'வரிகள்' : 'lines'}</span>
          )}
          {ocrData.confidence > 0 && (
            <span className="flex items-center gap-0.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${ocrData.confidence >= 80 ? 'bg-emerald-500' : ocrData.confidence >= 50 ? 'bg-amber-500' : 'bg-red-400'}`} />
              {ocrData.confidence}%
            </span>
          )}
        </div>

        <button
          onClick={handleCopyText}
          disabled={!editedText.trim()}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            copied
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
              : editedText.trim()
                ? 'bg-[#00737D] text-white hover:bg-[#005F67] shadow-sm hover:shadow-md active:scale-95'
                : 'bg-[#DFD7C7] dark:bg-[#2C2237] text-[#9CA3AF] cursor-not-allowed'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{isTamil ? 'நகலெடுக்கப்பட்டது!' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <ClipboardCopy className="w-3.5 h-3.5" />
              <span>{isTamil ? 'உரையை நகலெடு' : 'Copy Text'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Image Preview Thumbnail (shown in user message bubble) ──────────────────────
const ImagePreviewBubble = ({ file, previewUrl, fileName }) => {
  const displayUrl = previewUrl || (file ? URL.createObjectURL(file) : null);
  if (!displayUrl) return null;

  return (
    <div className="mt-1.5 rounded-lg overflow-hidden border border-white/20 shadow-inner max-w-[200px]">
      <img 
        src={displayUrl} 
        alt={fileName || 'Uploaded document'} 
        className="w-full h-auto max-h-[140px] object-cover"
        loading="lazy"
      />
      {fileName && (
        <div className="px-2 py-1 bg-black/20 text-[10px] text-white/80 truncate flex items-center gap-1">
          <FileImage className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{fileName}</span>
        </div>
      )}
    </div>
  );
};


const STORAGE_KEY = 'tamilocr_chat_history_v1';

export default function AIAssistant() {
  const { t, language, toggleLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeModelInfo, setActiveModelInfo] = useState({
    provider: 'TamilOCR AI',
    model: 'TamilOCR Knowledge Engine'
  });
  const [copiedId, setCopiedId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // ── Image Upload State ──────────────────────────────────────────────────────
  const [pendingImage, setPendingImage] = useState(null);       // File object
  const [pendingImagePreview, setPendingImagePreview] = useState(null); // Object URL
  const [imageUploadError, setImageUploadError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Synchronize chat history with LocalStorage
  useEffect(() => {
    try {
      // Don't persist OCR data blobs, strip them to save storage
      const serializableMessages = messages.map(m => {
        if (m.ocrData) {
          return { ...m, ocrData: { ...m.ocrData } };
        }
        return m;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableMessages));
    } catch (e) {
      console.warn('Failed to save chat to localStorage:', e);
    }
  }, [messages]);

  // Fetch status & prompt suggestions on mount / language change
  useEffect(() => {
    let mounted = true;
    fetchChatStatus().then(data => {
      if (mounted && data) {
        setActiveModelInfo({
          provider: data.active_provider || 'TamilOCR AI',
          model: data.active_model || 'TamilOCR Knowledge Engine'
        });
      }
    });

    fetchChatSuggestions(language).then(items => {
      if (mounted && items && items.length > 0) {
        setSuggestions(items);
      } else if (mounted) {
        // Fallback default suggestions
        setSuggestions(
          language === 'TA' ? [
            { title: "ஆவணப் பதிவேற்றம்", prompt: "கையெழுத்து பட்டா அல்லது சிட்டா ஆவணங்களை எவ்வாறு பதிவேற்றுவது?" },
            { title: "TamilCNN மாதிரி", prompt: "TamilCNN (T3.7) மாதிரியின் துல்லியம் மற்றும் சிறப்பம்சங்கள் என்ன?" },
            { title: "முடிவுகள் திருத்தம்", prompt: "அடையாளம் காணப்பட்ட தமிழ் உரையை எவ்வாறு ஆய்வு செய்து திருத்துவது?" },
            { title: "தரவு ஏற்றுமதி", prompt: "அரசு ஆவணங்களை CSV அல்லது JSON வடிவங்களில் எவ்வாறு பதிவிறக்குவது?" }
          ] : [
            { title: "Upload Guidance", prompt: "How do I upload and prepare a Tamil land record for recognition?" },
            { title: "Model Architecture", prompt: "What is the TamilCNN (T3.7) architecture and its validation accuracy?" },
            { title: "Inline Editing", prompt: "How do I use the virtual Tamil keyboard to review and edit recognized text?" },
            { title: "Export Records", prompt: "How can I export digitized records to TXT, JSON, and CSV formats?" }
          ]
        );
      }
    });

    return () => { mounted = false; };
  }, [language]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Cleanup pending image preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (pendingImagePreview) {
        URL.revokeObjectURL(pendingImagePreview);
      }
    };
  }, [pendingImagePreview]);

  // ── File Validation ─────────────────────────────────────────────────────────
  const validateImageFile = useCallback((file) => {
    const isTamil = language === 'TA';

    if (!file) {
      return isTamil ? 'கோப்பு தேர்ந்தெடுக்கப்படவில்லை.' : 'No file selected.';
    }

    const ext = '.' + (file.name || '').split('.').pop().toLowerCase();
    const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
    if (!isValidType) {
      return isTamil
        ? `ஆதரிக்கப்படாத கோப்பு வகை '${ext}'. PNG, JPG, TIFF, BMP அல்லது WebP படத்தை பதிவேற்றவும்.`
        : `Unsupported file type '${ext}'. Please upload a PNG, JPG, TIFF, BMP, or WebP image.`;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return isTamil
        ? `கோப்பு அளவு ${sizeMB} MB, அதிகபட்ச ${MAX_FILE_SIZE_MB} MB வரம்பை மீறுகிறது.`
        : `File size ${sizeMB} MB exceeds the maximum ${MAX_FILE_SIZE_MB} MB limit.`;
    }

    if (file.size === 0) {
      return isTamil ? 'பதிவேற்றப்பட்ட கோப்பு காலியாக உள்ளது (0 bytes).' : 'Uploaded file is empty (0 bytes).';
    }

    return null; // valid
  }, [language]);

  // ── Handle Image Selection ──────────────────────────────────────────────────
  const handleImageSelect = useCallback((file) => {
    setImageUploadError(null);

    const error = validateImageFile(file);
    if (error) {
      setImageUploadError(error);
      setPendingImage(null);
      setPendingImagePreview(null);
      return;
    }

    // Revoke old preview URL
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }

    setPendingImage(file);
    setPendingImagePreview(URL.createObjectURL(file));
  }, [validateImageFile, pendingImagePreview]);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
    // Reset input so same file can be re-selected
    if (e.target) e.target.value = '';
  }, [handleImageSelect]);

  const clearPendingImage = useCallback(() => {
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImage(null);
    setPendingImagePreview(null);
    setImageUploadError(null);
  }, [pendingImagePreview]);

  // ── Drag & Drop Handlers ────────────────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) handleImageSelect(file);
  }, [handleImageSelect]);

  // ── Send Message (text-only, as before) ───────────────────────────────────
  const handleSendMessage = async (customPrompt) => {
    const textToSend = typeof customPrompt === 'string' ? customPrompt : inputValue;
    const cleanText = textToSend.trim();

    // If there is a pending image, always process it via OCR
    if (pendingImage) {
      await handleSendImageOCR(cleanText);
      return;
    }

    if (!cleanText || isLoading) return;

    setErrorMessage(null);
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      // Map history for API
      const historyPayload = updatedHistory.slice(-8).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendChatMessage(cleanText, historyPayload, language.toLowerCase());

      const botMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'No response generated.',
        provider: res.provider,
        model: res.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      if (res.model) {
        setActiveModelInfo(prev => ({
          ...prev,
          model: res.model,
          provider: res.provider || prev.provider
        }));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || t('ai_assistant_error', 'Unable to reach AI Assistant. Please check server or retry.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Send Image for OCR ────────────────────────────────────────────────────
  const handleSendImageOCR = async (optionalPrompt) => {
    if (!pendingImage || isLoading) return;

    const isTamil = language === 'TA';
    setErrorMessage(null);
    setImageUploadError(null);

    const fileName = pendingImage.name || 'document.jpg';
    const previewUrl = pendingImagePreview;

    // Create user message with image preview
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: optionalPrompt || (isTamil ? `📄 தமிழ் ஆவண OCR: ${fileName}` : `📄 Tamil Document OCR: ${fileName}`),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: previewUrl,
      fileName: fileName
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Keep reference to file before clearing
    const imageFile = pendingImage;
    clearPendingImage();

    try {
      const result = await uploadChatDocumentOCR(imageFile, {
        language: language.toLowerCase(),
        prompt: optionalPrompt || '',
        model: undefined // use configured default
      });

      // Build the assistant response message
      const botMsg = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.ai_note || (result.has_text
          ? (isTamil ? '**ஆவணம் வெற்றிகரமாக செயலாக்கப்பட்டது!**' : '**Document processed successfully!**')
          : (isTamil ? '**எழுத்துகள் எதுவும் கண்டறியப்படவில்லை.**' : '**No readable Tamil text detected.**')),
        provider: 'OCR Engine',
        model: result.model_name || 'Tesseract Tamil',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ocrData: {
          has_text: result.has_text,
          tamil_text: result.tamil_text || '',
          confidence: result.confidence || 0,
          lines_count: result.lines_count || 0,
          word_count: result.word_count || 0,
          char_count: result.char_count || 0,
          model_name: result.model_name || 'Unknown',
          inference_time_ms: result.inference_time_ms || 0,
          image_url: result.image_url || null,
          file_name: result.file_name || fileName,
        }
      };

      setMessages(prev => [...prev, botMsg]);

      if (result.model_name) {
        setActiveModelInfo(prev => ({
          ...prev,
          model: result.model_name,
          provider: 'OCR Engine'
        }));
      }
    } catch (err) {
      console.error('Chat OCR error:', err);
      setErrorMessage(err.message || (isTamil
        ? 'OCR செயலாக்கம் தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
        : 'OCR processing failed. Please check the image and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setErrorMessage(null);
    clearPendingImage();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleCopyText = (text, id) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. FLOATING ACTION BUTTON (Always visible at bottom-right)       */}
      {/* ============================================================== */}
      <div 
        className="fixed bottom-6 right-6 z-50 flex items-center justify-end pointer-events-none"
        style={{ zIndex: 9999 }}
      >
        <div className="relative group pointer-events-auto">
          {/* Tooltip visible on hover when closed */}
          {!isOpen && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#1A1523] dark:bg-[#2C2237] text-white text-xs font-medium whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F26522] animate-pulse" />
              <span>{t('ai_assistant_fab_tooltip', 'Ask TamilOCR AI Assistant')}</span>
            </div>
          )}

          {/* Floating Action Button */}
          <button
            id="tamilocr-ai-assistant-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={t('ai_assistant_title', 'TamilOCR AI Assistant')}
            className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 ${
              isOpen 
                ? 'bg-[#1D1726] text-[#F5F2EB] ring-2 ring-[#00737D] shadow-[#00737D]/20' 
                : 'bg-gradient-to-tr from-[#00737D] via-[#005F67] to-[#160C1D] text-white hover:scale-105 shadow-[#00737D]/40 hover:shadow-[#00737D]/60'
            }`}
          >
            {/* Animated Pulse Ring when closed */}
            {!isOpen && (
              <span className="absolute -inset-1 rounded-full bg-[#00737D]/25 animate-ping pointer-events-none" />
            )}

            {/* Online Indicator Dot */}
            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#120E17]" />

            {/* Icon: Bot Sparkle when closed, X when open */}
            {isOpen ? (
              <X className="w-6 h-6 transition-transform rotate-0 hover:rotate-90" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
                <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CHAT PANEL (Floating, non-blocking window in bottom-right)   */}
      {/* ============================================================== */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[440px] h-[600px] max-h-[82vh] z-50 flex flex-col bg-[#F5F2EB] dark:bg-[#1A1424] border border-[#DFD7C7] dark:border-[#2C2237] rounded-2xl shadow-2xl overflow-hidden font-english transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          style={{ zIndex: 9998 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 z-[100] bg-[#00737D]/10 dark:bg-[#00737D]/20 backdrop-blur-[2px] flex items-center justify-center rounded-2xl border-2 border-dashed border-[#00737D] pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-[#00737D] dark:text-[#5eead4] animate-pulse">
                <ImagePlus className="w-10 h-10" />
                <span className="text-sm font-semibold">
                  {language === 'TA' ? 'தமிழ் ஆவணத்தை இங்கே விடுங்கள்' : 'Drop Tamil document here'}
                </span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#00737D] via-[#005F67] to-[#160C1D] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-white" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold tracking-wide truncate flex items-center gap-1.5">
                  <span>{t('ai_assistant_title', 'TamilOCR AI Assistant')}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/20 text-emerald-200">
                    {t('ai_assistant_badge', 'Online')}
                  </span>
                </h3>
                <p className="text-[11px] text-white/80 truncate flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-amber-300" />
                  <span className="truncate">{activeModelInfo.model}</span>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Language Switcher pill */}
              <button
                onClick={toggleLanguage}
                title="Toggle Language (EN / TA)"
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
              >
                {language === 'TA' ? 'TA / தமிழ்' : 'EN'}
              </button>

              {/* Clear Chat Button */}
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title={t('ai_assistant_clear', 'Clear Chat')}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Minimize / Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                title={t('ai_assistant_minimize', 'Minimize')}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#F5F2EB]/50 dark:bg-[#120E17]/50">
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="py-4 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00737D]/10 dark:bg-[#00737D]/20 text-[#00737D] dark:text-[#38b2ac] flex items-center justify-center shadow-inner">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#1A1523] dark:text-[#F5F2EB]">
                    {t('ai_assistant_welcome_title', 'How can I help you today?')}
                  </h4>
                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 max-w-[280px]">
                    {t('ai_assistant_welcome_desc', 'Ask me anything about uploading handwritten Tamil records, understanding the TamilCNN T3.7 model, preprocessing pipelines, or exporting data.')}
                  </p>
                </div>

                {/* Upload hint in welcome */}
                <div className="w-full px-1">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#00737D]/5 dark:bg-[#00737D]/10 border border-[#00737D]/15 dark:border-[#00737D]/20">
                    <ImagePlus className="w-5 h-5 text-[#00737D] dark:text-[#5eead4] flex-shrink-0" />
                    <p className="text-[11px] text-[#00737D] dark:text-[#5eead4] text-left leading-snug">
                      {language === 'TA'
                        ? 'கீழே உள்ள 📷 பொத்தானைப் பயன்படுத்தி தமிழ் ஆவணப் படத்தை நேரடியாக OCR செய்யலாம்!'
                        : 'Use the 📷 button below to upload a Tamil document image for instant OCR recognition!'}
                    </p>
                  </div>
                </div>

                {/* Prompt Suggestions */}
                {suggestions.length > 0 && (
                  <div className="w-full pt-2 text-left space-y-1.5">
                    <p className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider px-1">
                      {language === 'TA' ? 'பரிந்துரைக்கப்பட்ட கேள்விகள்:' : 'Suggested Questions:'}
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(s.prompt)}
                          className="w-full text-left p-2.5 rounded-xl bg-white dark:bg-[#1D1726] border border-[#DFD7C7] dark:border-[#2C2237] hover:border-[#00737D] dark:hover:border-[#00737D] hover:shadow-sm transition-all group flex items-start justify-between gap-2"
                        >
                          <span className="text-xs text-[#1A1523] dark:text-[#E2E8F0] font-medium group-hover:text-[#00737D] dark:group-hover:text-[#5eead4] line-clamp-2">
                            {s.prompt}
                          </span>
                          <Send className="w-3 h-3 text-[#00737D] dark:text-[#5eead4] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message Stream */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[90%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Bot Avatar */}
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-[#00737D] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div 
                      className={`relative px-3.5 py-2.5 rounded-2xl shadow-sm text-sm ${
                        isUser
                          ? 'bg-[#00737D] text-white rounded-tr-xs'
                          : 'bg-white dark:bg-[#1D1726] text-[#1A1523] dark:text-[#F5F2EB] border border-[#DFD7C7] dark:border-[#2C2237] rounded-tl-xs'
                      }`}
                    >
                      {isUser ? (
                        <div>
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          {/* Image preview inside user message */}
                          {msg.imagePreview && (
                            <ImagePreviewBubble 
                              previewUrl={msg.imagePreview} 
                              fileName={msg.fileName}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="font-english">
                          <MarkdownContent content={msg.content} />

                          {/* OCR Result Editable Area with Copy Text button */}
                          {msg.ocrData && msg.ocrData.has_text && (
                            <OCRResultDisplay 
                              ocrData={msg.ocrData} 
                              language={language}
                            />
                          )}

                          {/* Footer with Copy button */}
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/5 dark:border-white/5 text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                            <span className="italic flex items-center gap-1 font-mono">
                              <Cpu className="w-3 h-3 text-[#00737D]" />
                              {msg.model || 'TamilOCR AI'}
                            </span>
                            <button
                              onClick={() => handleCopyText(msg.content, msg.id)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500 font-medium">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] px-1 mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="w-7 h-7 rounded-full bg-[#00737D] text-white flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-[#1D1726] border border-[#DFD7C7] dark:border-[#2C2237] rounded-2xl rounded-tl-xs px-4 py-3 shadow-sm flex items-center gap-2">
                  <div className="flex space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00737D] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#00737D] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#00737D] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF] italic pl-1">
                    {pendingImage
                      ? t('ai_assistant_ocr_processing', 'Running OCR on your document...')
                      : t('ai_assistant_typing', 'AI Assistant is analyzing...')}
                  </span>
                </div>
              </div>
            )}

            {/* Inline Error State with Retry */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{errorMessage}</p>
                  <button
                    onClick={() => {
                      const lastUser = [...messages].reverse().find(m => m.role === 'user');
                      if (lastUser) {
                        handleSendMessage(lastUser.content);
                      }
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('ai_assistant_retry', 'Retry')}</span>
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Image Upload Error Banner ─────────────────────────────────── */}
          {imageUploadError && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-950/40 border-t border-red-200 dark:border-red-900/50 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-300 flex-1">{imageUploadError}</p>
              <button onClick={() => setImageUploadError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Pending Image Preview Strip ───────────────────────────────── */}
          {pendingImage && pendingImagePreview && (
            <div className="px-3 py-2 bg-[#00737D]/5 dark:bg-[#00737D]/10 border-t border-[#00737D]/15 dark:border-[#00737D]/20 flex items-center gap-2.5">
              <div className="relative flex-shrink-0">
                <img
                  src={pendingImagePreview}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-[#00737D]/30 shadow-sm"
                />
                <button
                  onClick={clearPendingImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                  title={language === 'TA' ? 'அகற்று' : 'Remove'}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1A1523] dark:text-[#F5F2EB] truncate">{pendingImage.name}</p>
                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                  {(pendingImage.size / 1024).toFixed(0)} KB • {language === 'TA' ? 'OCR செய்ய தயார்' : 'Ready for OCR'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#00737D] dark:text-[#5eead4] font-medium">
                <FileImage className="w-3.5 h-3.5" />
                <span>OCR</span>
              </div>
            </div>
          )}

          {/* Footer / Input Bar */}
          <div className="p-3 bg-white dark:bg-[#1D1726] border-t border-[#DFD7C7] dark:border-[#2C2237] flex flex-col gap-1.5">
            <div className="flex items-center gap-2 bg-[#F5F2EB] dark:bg-[#120E17] border border-[#DFD7C7] dark:border-[#2C2237] rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#00737D] focus-within:border-transparent transition-all">
              {/* Image Upload Button */}
              <button
                id="tamilocr-ai-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title={language === 'TA' ? 'தமிழ் ஆவணப் படத்தை பதிவேற்றவும்' : 'Upload Tamil document image for OCR'}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center flex-shrink-0 ${
                  isLoading
                    ? 'text-[#9CA3AF] cursor-not-allowed opacity-50'
                    : pendingImage
                      ? 'text-[#00737D] bg-[#00737D]/10 dark:bg-[#00737D]/20'
                      : 'text-[#6B7280] hover:text-[#00737D] hover:bg-[#00737D]/10 dark:hover:bg-[#00737D]/20'
                }`}
              >
                <ImagePlus className="w-4.5 h-4.5" />
              </button>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
                aria-label="Upload document image"
              />

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={
                  pendingImage
                    ? (language === 'TA' ? 'கேள்வி சேர்க்கவும் (விரும்பினால்) அல்லது OCR அனுப்பவும்...' : 'Add a question (optional) or send for OCR...')
                    : t('ai_assistant_placeholder', 'Ask about TamilOCR, documents, models...')
                }
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#1A1523] dark:text-[#F5F2EB] placeholder-[#9CA3AF] focus:outline-none disabled:opacity-50"
              />

              <button
                id="tamilocr-ai-send-btn"
                onClick={() => handleSendMessage()}
                disabled={(!inputValue.trim() && !pendingImage) || isLoading}
                aria-label={t('ai_assistant_send', 'Send')}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  (inputValue.trim() || pendingImage) && !isLoading
                    ? 'bg-[#00737D] text-white hover:bg-[#005F67] shadow-sm'
                    : 'text-[#9CA3AF] cursor-not-allowed opacity-50'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            <p className="text-[10px] text-center text-[#6B7280] dark:text-[#9CA3AF]">
              {t('ai_assistant_disclaimer', 'Powered by TamilOCR Archival AI. Verify critical historical data.')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

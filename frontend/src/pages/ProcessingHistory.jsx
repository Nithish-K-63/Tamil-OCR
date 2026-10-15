import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Upload, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  Eye,
  X,
  Copy,
  ExternalLink,
  FileText,
  Play,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { 
  fetchProcessingHistory, 
  fetchRecordById, 
  resolveImageUrl,
  deleteProcessingHistoryItem,
  processSavedDocumentOCR 
} from '../api/ocrApi';

const ProcessingHistory = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail modal state
  const [activeModalEvent, setActiveModalEvent] = useState(null);
  const [modalRecord, setModalRecord] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deletion & Action State
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState(null);
  const [deleteDocumentAlso, setDeleteDocumentAlso] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [processingOcrDocId, setProcessingOcrDocId] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchProcessingHistory(50, 0);
      setEvents(data);
    } catch (err) {
      console.warn("Failed to load processing history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      return date.toLocaleString();
    } catch {
      return isoStr;
    }
  };

  const handleOpenEventModal = async (item) => {
    setActiveModalEvent(item);
    setModalRecord(null);
    setLoadingModal(true);

    const docId = item.document_id || item.record_id;
    if (docId && !docId.startsWith("FAILED-") && !docId.startsWith("CFG-") && !docId.startsWith("ERR-")) {
      try {
        const rec = await fetchRecordById(docId);
        if (rec) {
          setModalRecord(rec);
        }
      } catch (err) {
        console.warn("Could not fetch record details:", err);
      }
    }
    setLoadingModal(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunOCR = async (item) => {
    const docId = item.document_id || item.record_id;
    if (!docId) return;
    setProcessingOcrDocId(docId);
    setFeedback(null);
    try {
      const res = await processSavedDocumentOCR(docId);
      if (res && res.success) {
        setFeedback({
          type: 'success',
          message: `Document '${docId}' successfully processed! Tamil Unicode text saved to MongoDB Atlas.`
        });
        loadHistory();
      } else {
        throw new Error(res?.detail || "Recognition failed.");
      }
    } catch (err) {
      console.error("Run OCR error:", err);
      setFeedback({
        type: 'error',
        message: err.message || `OCR processing failed for '${docId}'.`
      });
    } finally {
      setProcessingOcrDocId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmEvent) return;
    setIsDeleting(true);
    const eventId = deleteConfirmEvent._id || deleteConfirmEvent.id || deleteConfirmEvent.document_id;
    try {
      const res = await deleteProcessingHistoryItem(eventId, deleteDocumentAlso);
      setFeedback({
        type: 'success',
        message: res.message || `History entry deleted successfully from MongoDB Atlas.`
      });
      // Remove event locally
      setEvents(prev => prev.filter(e => (e._id || e.id || e.document_id) !== eventId));
      if (activeModalEvent && (activeModalEvent._id || activeModalEvent.id || activeModalEvent.document_id) === eventId) {
        setActiveModalEvent(null);
      }
      setDeleteConfirmEvent(null);
      loadHistory();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error("Delete history event failed:", err);
      setFeedback({
        type: 'error',
        message: err.message || `Failed to delete history entry '${eventId}'.`
      });
      setDeleteConfirmEvent(null);
      setTimeout(() => setFeedback(null), 6000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl relative space-y-4">
      {/* ========================================================
          Success / Error Feedback Banner
          ======================================================== */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border animate-in fade-in ${
          feedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button 
            onClick={() => setFeedback(null)} 
            className="cursor-pointer ml-4 font-bold opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-6 sm:p-8 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1523] dark:text-[#F5F2EB]">
              {t('history_heading', 'Recent activity')}
            </h2>
            <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1">
              {t('history_subheading', 'Live audit trail of OCR recognition events stored in MongoDB Atlas.')}
            </p>
          </div>
          <button
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFD7C7] dark:border-[#2C2237] text-xs font-medium text-[#1A1523] dark:text-[#F5F2EB] hover:bg-[#F2ECE1] dark:hover:bg-[#2C2237] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh logs from Atlas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="divide-y divide-[#DFD7C7]/60 dark:divide-[#2C2237]/60 mt-6">
          {loading && events.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7A7185] dark:text-[#9D93A7] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#00737D]" />
              <span>Fetching live audit log from MongoDB Atlas...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7A7185] dark:text-[#9D93A7]">
              No processing events recorded yet. Upload a manuscript to start.
            </div>
          ) : (
            events.map((item, idx) => {
              const isFailed = item.status?.toLowerCase() === 'failed' || item.action === 'OCR_FAILED';
              const isUploaded = item.action === 'DOCUMENT_UPLOADED' || item.status === 'Pending OCR' || item.status === 'Uploaded';
              const docId = item.document_id || item.record_id || `EVT-${idx + 1}`;
              const fileName = item.file_name || item.filename || 'manuscript.jpg';
              const timestamp = item.created_at || item.timestamp;
              const hasOcrResult = Boolean(!isUploaded && !isFailed && (item.tamil_preview || (item.confidence != null && Number(item.confidence) > 0)));
              const confidence = (item.confidence != null && !isUploaded && Number(item.confidence) > 0) 
                ? `${Number(item.confidence).toFixed(1)}%` 
                : null;
              const isOcrRunning = processingOcrDocId === docId;

              return (
                <div 
                  key={item._id || item.id || idx} 
                  onClick={() => handleOpenEventModal(item)}
                  className="py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 px-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isFailed
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          : isUploaded
                          ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {isFailed ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isUploaded ? (
                        <Upload className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB] group-hover:text-[#00737D] transition-colors truncate">
                          {isFailed 
                            ? `Failed: ${fileName}` 
                            : isUploaded 
                            ? `Uploaded: ${docId} (${fileName})` 
                            : `Processed: ${docId} (${fileName})`}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isFailed
                              ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                              : isUploaded
                              ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300'
                              : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {item.status || (isFailed ? 'Failed' : isUploaded ? 'Pending OCR' : 'Digitized')}
                        </span>
                        {confidence && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-mono">
                            {confidence}
                          </span>
                        )}
                        {isUploaded ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300 font-mono">
                            Awaiting OCR
                          </span>
                        ) : hasOcrResult ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-mono">
                            OCR Available
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] mt-0.5">
                        {formatTimestamp(timestamp)} {item.model_name && !isUploaded ? `· ${item.model_name}` : (isUploaded ? '· Uploaded to Storage' : '')}
                        {item.error ? ` · Error: ${item.error}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {/* Run OCR Button for Pending Uploads */}
                    {isUploaded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunOCR(item);
                        }}
                        disabled={isOcrRunning}
                        title="Run Tamil OCR recognition on this saved document"
                        className="px-2.5 py-1 rounded-lg bg-[#00737D] hover:bg-[#005F67] text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isOcrRunning ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        <span>{isOcrRunning ? 'Running OCR...' : 'Run OCR'}</span>
                      </button>
                    )}

                    <span className="text-[10px] text-[#7A7185] dark:text-[#9D93A7] font-mono hidden md:flex items-center gap-1">
                      <Database className="w-3 h-3 text-emerald-600" /> Atlas
                    </span>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEventModal(item);
                      }}
                      title="View Details"
                      className="p-1 rounded-lg text-gray-400 group-hover:text-[#00737D] transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Delete History Event Option */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmEvent(item);
                      }}
                      title="Delete this history entry"
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================
          EVENT DETAIL MODAL
          ======================================================== */}
      {activeModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] dark:bg-[#1D1726] border border-[#DFD7C7] dark:border-[#2C2237] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#DFD7C7] dark:border-[#2C2237] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#00737D]">
                    {activeModalEvent.document_id || activeModalEvent.record_id || 'Event Details'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    activeModalEvent.status?.toLowerCase() === 'failed' 
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                      : (activeModalEvent.status === 'Pending OCR' || activeModalEvent.action === 'DOCUMENT_UPLOADED')
                      ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {activeModalEvent.status || 'Processed'}
                  </span>
                </div>
                <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-0.5 font-mono">
                  {activeModalEvent.file_name || activeModalEvent.filename}
                </p>
              </div>
              <button
                onClick={() => setActiveModalEvent(null)}
                className="p-1.5 rounded-lg text-[#7A7185] hover:text-[#1A1523] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Event Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-white/60 dark:bg-[#15101C]/60 border border-[#DFD7C7]/60 dark:border-[#2C2237]/60 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-[#9D93A7] font-semibold">Action</span>
                  <p className="font-mono font-semibold text-[#1A1523] dark:text-[#F5F2EB]">{activeModalEvent.action || 'OCR_PROCESSED'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#9D93A7] font-semibold">Model / Service</span>
                  <p className="font-semibold text-[#1A1523] dark:text-[#F5F2EB] truncate">
                    {activeModalEvent.action === 'DOCUMENT_UPLOADED' ? 'Persistent Storage Only' : (activeModalEvent.model_name || 'Tesseract OCR')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#9D93A7] font-semibold">Timestamp</span>
                  <p className="font-mono text-[#1A1523] dark:text-[#F5F2EB]">{formatTimestamp(activeModalEvent.created_at)}</p>
                </div>
              </div>

              {/* Error Message if Failed */}
              {activeModalEvent.error && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-1">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300">Failure Diagnostics:</span>
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-mono whitespace-pre-wrap">{activeModalEvent.error}</p>
                </div>
              )}

              {/* Original Image if available */}
              {(modalRecord?.image_path || activeModalEvent.image_path) && (
                <div className="rounded-xl border border-[#DFD7C7] dark:border-[#2C2237] p-3 bg-white/40 dark:bg-[#15101C]/40">
                  <span className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB] block mb-2">Original Document Image</span>
                  <div className="max-h-52 flex items-center justify-center overflow-hidden rounded bg-black/5 dark:bg-black/20 p-2">
                    <img 
                      src={resolveImageUrl(modalRecord?.image_path || activeModalEvent.image_path, activeModalEvent.file_name)}
                      alt="Manuscript"
                      className="max-h-48 object-contain rounded"
                    />
                  </div>
                </div>
              )}

              {/* Recognized Tamil Text if available */}
              {(modalRecord?.tamil_text || activeModalEvent.tamil_preview) ? (
                <div className="rounded-xl border border-[#DFD7C7] dark:border-[#2C2237] p-3.5 bg-white/60 dark:bg-[#15101C]/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">Saved Tamil Transcription</span>
                    <button
                      onClick={() => handleCopy(modalRecord?.tamil_text || activeModalEvent.tamil_preview)}
                      className="px-2 py-0.5 rounded text-xs border border-[#DFD7C7] dark:border-[#2C2237] font-semibold text-[#1A1523] dark:text-[#F5F2EB] hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-[#FAF8F5] dark:bg-[#1A1424] font-tamil text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-[#1A1523] dark:text-[#F5F2EB]">
                    {modalRecord?.tamil_text || activeModalEvent.tamil_preview}
                  </div>
                </div>
              ) : (activeModalEvent.action === 'DOCUMENT_UPLOADED' || activeModalEvent.status === 'Pending OCR') ? (
                <div className="rounded-xl border border-sky-200 dark:border-sky-900/60 p-4 bg-sky-50/50 dark:bg-sky-950/20 text-xs text-sky-900 dark:text-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold mb-1">Awaiting OCR Recognition</p>
                    <p className="text-[11px] text-sky-800 dark:text-sky-300">
                      This document was saved to MongoDB Atlas without OCR processing. The original image is safely preserved in persistent storage.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModalEvent(null);
                      handleRunOCR(activeModalEvent);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run OCR Recognition</span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-[#DFD7C7] dark:border-[#2C2237] flex items-center justify-between bg-black/2 dark:bg-white/2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const evt = activeModalEvent;
                    setActiveModalEvent(null);
                    setDeleteConfirmEvent(evt);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Entry</span>
                </button>
              </div>

              {modalRecord && (
                <button
                  onClick={() => {
                    if (modalRecord.status === 'Pending OCR') {
                      navigate('/records');
                    } else {
                      navigate('/results', {
                        state: {
                          record: modalRecord,
                          previewUrl: resolveImageUrl(modalRecord.image_path, modalRecord.file_name)
                        }
                      });
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>{modalRecord.status === 'Pending OCR' ? 'View in Digitized Records' : 'View in Editor'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
          ======================================================== */}
      {deleteConfirmEvent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] dark:bg-[#1D1726] border border-rose-200 dark:border-rose-900/60 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                  Delete History Entry
                </h3>
                <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] font-mono">
                  {deleteConfirmEvent.document_id || deleteConfirmEvent.record_id || 'Audit Entry'}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4A4154] dark:text-[#D8CEE2] leading-relaxed">
              Are you sure you want to delete this activity log entry for <strong className="font-mono text-[#1A1523] dark:text-[#F5F2EB]">{deleteConfirmEvent.document_id || deleteConfirmEvent.record_id}</strong> (<em>{deleteConfirmEvent.file_name || 'manuscript'}</em>)?
            </p>

            <div className="p-3 rounded-xl bg-black/3 dark:bg-white/3 border border-[#DFD7C7]/60 dark:border-[#2C2237]/60 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={deleteDocumentAlso}
                  onChange={(e) => setDeleteDocumentAlso(e.target.checked)}
                  className="mt-0.5 rounded text-[#00737D] focus:ring-[#00737D]"
                />
                <span className="text-xs text-[#1A1523] dark:text-[#F5F2EB] font-medium leading-tight">
                  Also delete the document record, transcription, and image file from storage
                </span>
              </label>
              <p className="text-[10px] text-[#7A7185] dark:text-[#9D93A7] pl-5 leading-normal">
                {deleteDocumentAlso 
                  ? 'Consistent deletion: Purges both the audit log and the underlying document so no orphaned records remain.' 
                  : 'Log only: Removes this audit trail entry while preserving the document in the archive.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmEvent(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl border border-[#DFD7C7] dark:border-[#2C2237] text-xs font-semibold text-[#1A1523] dark:text-[#F5F2EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Entry'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Tamil watermark background */}
      <div className="fixed right-12 bottom-12 text-[260px] font-bold font-tamil text-black/2 dark:text-white/2 pointer-events-none select-none z-0">
        அ
      </div>
    </div>
  );
};

export default ProcessingHistory;

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Download, 
  Check, 
  FileText,
  X,
  Copy,
  ExternalLink,
  Save,
  RotateCw,
  AlertCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchHistory, updateRecord, deleteHistoryRecord, resolveImageUrl } from '../api/ocrApi';

const DigitizedRecords = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const urlStatus = searchParams.get('status');
  const initialStatus = urlStatus 
    ? (urlStatus.toLowerCase() === 'verified' 
        ? 'Verified' 
        : (urlStatus.toLowerCase() === 'pending ocr' || urlStatus.toLowerCase() === 'pending_ocr'
            ? 'Pending OCR' 
            : 'Review')) 
    : 'All statuses';

  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('All years');
  const [selectedDept, setSelectedDept] = useState('All departments');
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  const [liveRecords, setLiveRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Detail drawer state
  const [activeModalRecord, setActiveModalRecord] = useState(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState(null);

  // Sync with URL query parameter changes
  useEffect(() => {
    if (urlStatus) {
      setSelectedStatus(
        urlStatus.toLowerCase() === 'verified' 
          ? 'Verified' 
          : (urlStatus.toLowerCase() === 'pending ocr' || urlStatus.toLowerCase() === 'pending_ocr' 
              ? 'Pending OCR' 
              : 'Review')
      );
    }
  }, [urlStatus]);

  // Load records from backend MongoDB Atlas
  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory(150, 0, search, selectedStatus);
      if (Array.isArray(data)) {
        setLiveRecords(data.map(r => ({
          id: r.id,
          title: r.title,
          department: r.department,
          year: r.year,
          district: r.district || 'Thanjavur',
          category: r.category || 'Land Record',
          confidence: `${Number(r.confidence || 0).toFixed(1)}%`,
          confidenceRaw: Number(r.confidence || 0),
          status: r.status,
          stamp: r.year,
          tamil_text: r.tamil_text || '',
          file_name: r.file_name,
          image_path: r.image_path,
          model_name: r.model_name,
          created_at: r.created_at,
          processed_at: r.processed_at || r.created_at
        })));
      }
    } catch (err) {
      console.warn("Failed to load records from Atlas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [search, selectedStatus]);

  // Requirement 4: Display only documents whose OCR processing completed successfully
  // and whose actual OCR results (Tamil Unicode transcription) were saved.
  const completedRecords = useMemo(() => {
    return liveRecords.filter(r => 
      (r.status === 'Completed' || r.status === 'Verified' || r.status === 'Review' || r.status === 'Needs Review') && 
      Boolean(r.tamil_text && r.tamil_text.trim().length > 0)
    );
  }, [liveRecords]);

  // Dynamic filter options based on real database records
  const availableYears = useMemo(() => {
    const set = new Set(completedRecords.map(r => r.year).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [completedRecords]);

  const availableDepts = useMemo(() => {
    const set = new Set(completedRecords.map(r => r.department).filter(Boolean));
    return Array.from(set).sort();
  }, [completedRecords]);

  // Filter in-memory for dropdowns
  const filtered = useMemo(() => {
    return completedRecords.filter(r => {
      const matchYear = selectedYear === 'All years' || r.year === selectedYear;
      const matchDept = selectedDept === 'All departments' || r.department === selectedDept;
      const matchStatus = selectedStatus === 'All statuses' || 
        (selectedStatus === 'Verified' && (r.status === 'Verified' || r.status === 'Completed')) ||
        (selectedStatus === 'Completed' && (r.status === 'Completed' || r.status === 'Verified')) ||
        (selectedStatus === 'Review' && (r.status === 'Needs Review' || r.status === 'Review'));
      return matchYear && matchDept && matchStatus;
    });
  }, [completedRecords, selectedYear, selectedDept, selectedStatus]);

  const formatProcessingDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleOpenRecord = (record) => {
    setActiveModalRecord(record);
    setEditedText(record.tamil_text || '');
    setIsEditingText(false);
    setSaveSuccess(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmRecord) return;
    setIsDeleting(true);
    try {
      const res = await deleteHistoryRecord(deleteConfirmRecord.id);
      setDeleteFeedback({
        type: 'success',
        message: res.message || `Document '${deleteConfirmRecord.id}' successfully deleted from MongoDB Atlas.`
      });
      // Remove from local state
      setLiveRecords(prev => prev.filter(r => r.id !== deleteConfirmRecord.id));
      if (activeModalRecord?.id === deleteConfirmRecord.id) {
        setActiveModalRecord(null);
      }
      setDeleteConfirmRecord(null);
      loadRecords();
      setTimeout(() => setDeleteFeedback(null), 5000);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteFeedback({
        type: 'error',
        message: err.message || `Failed to delete document '${deleteConfirmRecord.id}'.`
      });
      setDeleteConfirmRecord(null);
      setTimeout(() => setDeleteFeedback(null), 6000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCorrection = async () => {
    if (!activeModalRecord) return;
    setSaving(true);
    try {
      const updated = await updateRecord(activeModalRecord.id, {
        tamil_text: editedText
      });
      if (updated) {
        setSaveSuccess(true);
        setIsEditingText(false);
        // Update local list
        setLiveRecords(prev => prev.map(rec => 
          rec.id === activeModalRecord.id ? { ...rec, tamil_text: editedText } : rec
        ));
        setActiveModalRecord(prev => prev ? { ...prev, tamil_text: editedText } : null);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Save correction failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleExportText = (record) => {
    const blob = new Blob([record.tamil_text || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.id}_transcription.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNavigateToResults = (record) => {
    navigate('/results', {
      state: {
        record: record,
        previewUrl: resolveImageUrl(record.image_path, record.file_name)
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          Success / Error Feedback Alert
          ======================================================== */}
      {deleteFeedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border animate-in fade-in ${
          deleteFeedback.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {deleteFeedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{deleteFeedback.message}</span>
          </div>
          <button 
            onClick={() => setDeleteFeedback(null)} 
            className="cursor-pointer ml-4 font-bold opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          Header
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1523] dark:text-[#F5F2EB] tracking-tight">
            {t('records_heading', 'Preserved Records')}
          </h2>
          <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1 font-english">
            <span className="font-bold text-[#00737D]">{filtered.length.toLocaleString()}</span> {t('records_subheading_1', 'digitized manuscripts in the archive')}
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs shadow-md shadow-[#00737D]/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('btn_add_document', 'Add document')}</span>
        </button>
      </div>

      {/* ========================================================
          Search & Filters Bar
          ======================================================== */}
      <div className="p-2 sm:p-2.5 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs flex flex-col md:flex-row gap-2.5 items-stretch">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7A7185] dark:text-[#9D93A7] absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_placeholder_records', 'Search by title, ID or Tamil text...')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-transparent bg-black/3 dark:bg-white/5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00737D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] focus:outline-none"
          >
            <option value="All years">{t('opt_all_years', 'All years')}</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] focus:outline-none"
          >
            <option value="All departments">{t('opt_all_departments', 'All departments')}</option>
            {availableDepts.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] focus:outline-none"
          >
            <option value="All statuses">{t('opt_all_statuses', 'All statuses')}</option>
            <option value="Completed">Completed OCR</option>
            <option value="Verified">{t('opt_verified', 'Verified')}</option>
            <option value="Review">{t('opt_review', 'Review / Pending')}</option>
          </select>
        </div>
      </div>

      {/* Sub-bar */}
      <div className="flex items-center justify-between text-xs text-[#7A7185] dark:text-[#9D93A7] px-1">
        <span>{t('showing_records', 'Showing')} {filtered.length} {t('records_suffix', 'completed digitized records')}</span>
        <span>{t('sort_by_label', 'Sort by')} <strong className="text-[#1A1523] dark:text-[#F5F2EB]">{t('sort_recently_updated', 'Recently updated')}</strong></span>
      </div>

      {/* Loading state */}
      {loading && liveRecords.length === 0 && (
        <div className="p-12 text-center text-xs text-[#7A7185] dark:text-[#9D93A7] flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4 animate-spin text-[#00737D]" />
          <span>Loading digitized records from MongoDB Atlas...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[#DFD7C7] dark:border-[#2C2237] bg-white/40 dark:bg-[#1D1726]/40">
          <FileText className="w-8 h-8 text-[#7A7185] dark:text-[#9D93A7] mx-auto mb-2 opacity-50" />
          <p className="text-xs font-semibold text-[#1A1523] dark:text-[#F5F2EB]">
            No completed digitized records found matching your filters.
          </p>
          <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] mt-1">
            Digitized Records shows documents with completed Tamil OCR recognition. Check History for pending uploads.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => navigate('/history')}
              className="px-3.5 py-1.5 rounded-xl border border-[#00737D] text-[#00737D] text-xs font-semibold hover:bg-[#00737D]/10 transition-colors cursor-pointer"
            >
              View History
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="px-3.5 py-1.5 rounded-xl bg-[#00737D] text-white text-xs font-semibold hover:bg-[#005F67] transition-colors cursor-pointer"
            >
              Upload Document
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          Cards Grid
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => {
          const imageUrl = resolveImageUrl(item.image_path, item.file_name);
          return (
            <div
              key={item.id}
              className="rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
            >
              {/* Top Manuscript Preview Card */}
              <div 
                onClick={() => handleOpenRecord(item)}
                className="p-4 bg-[#FAF8F5] dark:bg-[#15101C] border-b border-[#DFD7C7] dark:border-[#2C2237] relative flex items-center justify-center min-h-[170px] cursor-pointer overflow-hidden"
              >
                {imageUrl ? (
                  <div className="w-full h-36 flex items-center justify-center overflow-hidden rounded">
                    <img 
                      src={imageUrl} 
                      alt={item.title}
                      className="max-h-full max-w-full object-contain rounded transition-transform group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `
                          <div class="w-28 h-36 bg-[#EFE8D8] text-[#2C241D] rounded shadow-md p-2.5 border border-[#DFD3BE] font-tamil text-[7px] leading-tight relative">
                            <p class="font-bold text-center mt-1">தமிழ்நாடு அரசு</p>
                            <div class="h-0.5 bg-[#4A3E31]/30 my-1"></div>
                            <p class="text-[6px] text-center text-[#4A3E31]">வருவாய்த் துறை</p>
                          </div>
                        `;
                      }}
                    />
                  </div>
                ) : (
                  /* Stylized Paper representation */
                  <div className="w-28 h-36 bg-[#EFE8D8] text-[#2C241D] rounded shadow-md p-2.5 border border-[#DFD3BE] font-tamil text-[7px] leading-tight relative transition-transform group-hover:scale-105">
                    <div className="absolute top-1 right-1 px-1 border border-[#8B3A2B]/40 rounded text-[#8B3A2B] text-[6px] font-mono">
                      {item.stamp}
                    </div>
                    <p className="font-bold text-center mt-1">தமிழ்நாடு அரசு</p>
                    <div className="h-0.5 bg-[#4A3E31]/30 my-1" />
                    <p className="text-[6px] text-center text-[#4A3E31]">வருவாய்த் துறை</p>
                    <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full border border-red-700/60 flex items-center justify-center text-red-800 text-[5px] font-bold">
                      த.நா. அரசு
                    </div>
                  </div>
                )}

                {/* Status Badge in Top Right */}
                <div className="absolute top-3 right-3 z-10">
                  {item.status === 'Verified' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 backdrop-blur-xs">
                      <Check className="w-3 h-3" />
                      {t('opt_verified', 'Verified')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 backdrop-blur-xs">
                      <Check className="w-3 h-3" />
                      Completed
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Content & Metadata */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-mono text-[#00737D] font-bold">
                      {item.id}
                    </p>
                    <span className="text-[10px] text-[#7A7185] dark:text-[#9D93A7] font-mono truncate max-w-[140px]" title={item.file_name}>
                      {item.file_name || 'document.jpg'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB] font-tamil mt-0.5 truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] truncate">
                    {item.department}
                  </p>
                </div>

                {/* Saved Tamil Unicode Transcription Snippet */}
                {item.tamil_text && (
                  <div className="p-2 rounded-lg bg-black/2 dark:bg-white/3 border border-[#DFD7C7]/40 dark:border-[#2C2237]/40">
                    <p className="text-[11px] font-tamil text-[#1A1523] dark:text-[#F5F2EB] line-clamp-2 leading-relaxed">
                      {item.tamil_text}
                    </p>
                  </div>
                )}

                {/* 3-Column Meta (Year, Processing Date, Genuine Confidence) */}
                <div className="pt-3 border-t border-[#DFD7C7]/60 dark:border-[#2C2237]/60 grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <p className="text-[#9D93A7] uppercase font-semibold">{t('th_year', 'YEAR')}</p>
                    <p className="font-bold text-[#1A1523] dark:text-[#F5F2EB] mt-0.5 font-mono">{item.year}</p>
                  </div>
                  <div>
                    <p className="text-[#9D93A7] uppercase font-semibold">DATE</p>
                    <p className="font-bold text-[#1A1523] dark:text-[#F5F2EB] mt-0.5 font-mono truncate">
                      {formatProcessingDate(item.processed_at || item.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#9D93A7] uppercase font-semibold">{t('th_confidence', 'CONFIDENCE')}</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                      {item.confidenceRaw > 0 ? `${item.confidenceRaw.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Actions Bar with Preview, Edit, Download, and DELETE */}
                <div className="pt-3 border-t border-[#DFD7C7]/60 dark:border-[#2C2237]/60 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenRecord(item)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#00737D] hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('btn_preview', 'Preview')}</span>
                  </button>

                  <div className="flex items-center gap-1 text-gray-400">
                    <button 
                      onClick={() => handleNavigateToResults(item)}
                      title="Edit transcription in full editor"
                      className="p-1.5 rounded-lg hover:text-[#00737D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleExportText(item)}
                      title="Download transcription text file"
                      className="p-1.5 rounded-lg hover:text-[#00737D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmRecord(item);
                      }}
                      title="Delete this digitized record from MongoDB Atlas"
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          RECORD DETAIL & EDIT MODAL
          ======================================================== */}
      {activeModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] dark:bg-[#1D1726] border border-[#DFD7C7] dark:border-[#2C2237] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#DFD7C7] dark:border-[#2C2237] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#00737D]">{activeModalRecord.id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                    {activeModalRecord.status}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold font-tamil text-[#1A1523] dark:text-[#F5F2EB] mt-0.5">
                  {activeModalRecord.title}
                </h3>
                <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] font-mono">
                  File: {activeModalRecord.file_name} · Processed: {formatProcessingDate(activeModalRecord.processed_at || activeModalRecord.created_at)}
                </p>
              </div>
              <button
                onClick={() => setActiveModalRecord(null)}
                className="p-1.5 rounded-lg text-[#7A7185] hover:text-[#1A1523] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-white/60 dark:bg-[#15101C]/60 border border-[#DFD7C7]/60 dark:border-[#2C2237]/60 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-[#9D93A7] font-semibold">Department</span>
                  <p className="font-semibold text-[#1A1523] dark:text-[#F5F2EB]">{activeModalRecord.department}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#9D93A7] font-semibold">District</span>
                  <p className="font-semibold text-[#1A1523] dark:text-[#F5F2EB]">{activeModalRecord.district}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#9D93A7] font-semibold">Year</span>
                  <p className="font-mono font-semibold text-[#1A1523] dark:text-[#F5F2EB]">{activeModalRecord.year}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#9D93A7] font-semibold">Confidence</span>
                  <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {activeModalRecord.confidenceRaw > 0 ? activeModalRecord.confidence : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Original Image Section */}
              {resolveImageUrl(activeModalRecord.image_path, activeModalRecord.file_name) && (
                <div className="rounded-xl border border-[#DFD7C7] dark:border-[#2C2237] p-3 bg-white/40 dark:bg-[#15101C]/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">Original Uploaded Image</span>
                    <a
                      href={resolveImageUrl(activeModalRecord.image_path, activeModalRecord.file_name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#00737D] hover:underline flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open full image</span>
                    </a>
                  </div>
                  <div className="max-h-56 flex items-center justify-center overflow-hidden rounded bg-black/5 dark:bg-black/20 p-2">
                    <img
                      src={resolveImageUrl(activeModalRecord.image_path, activeModalRecord.file_name)}
                      alt="Original Document"
                      className="max-h-52 object-contain rounded"
                    />
                  </div>
                </div>
              )}

              {/* Recognized Tamil Transcription Section */}
              <div className="rounded-xl border border-[#DFD7C7] dark:border-[#2C2237] p-4 bg-white/60 dark:bg-[#15101C]/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB] flex items-center gap-1.5">
                    <span>Recognized Tamil Text (Unicode)</span>
                    {saveSuccess && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved to Atlas
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(editedText)}
                      className="px-2.5 py-1 rounded-lg border border-[#DFD7C7] dark:border-[#2C2237] text-xs font-semibold text-[#1A1523] dark:text-[#F5F2EB] hover:bg-[#F2ECE1] dark:hover:bg-[#2C2237] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    {!isEditingText ? (
                      <button
                        onClick={() => setIsEditingText(true)}
                        className="px-2.5 py-1 rounded-lg bg-[#00737D] text-white text-xs font-semibold hover:bg-[#005F67] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveCorrection}
                        disabled={saving}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? 'Saving...' : 'Save'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditingText ? (
                  <textarea
                    rows={8}
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[#00737D] bg-white dark:bg-[#1D1726] font-tamil text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#00737D] text-[#1A1523] dark:text-[#F5F2EB]"
                  />
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#FAF8F5] dark:bg-[#1A1424] border border-[#DFD7C7]/50 dark:border-[#2C2237]/50 font-tamil text-sm leading-relaxed text-[#1A1523] dark:text-[#F5F2EB] whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {activeModalRecord.tamil_text 
                      ? activeModalRecord.tamil_text 
                      : 'No Tamil text recognized for this record.'}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#DFD7C7] dark:border-[#2C2237] flex items-center justify-between bg-black/2 dark:bg-white/2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportText(activeModalRecord)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DFD7C7] dark:border-[#2C2237] text-xs font-semibold text-[#1A1523] dark:text-[#F5F2EB] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export TXT</span>
                </button>
                <button
                  onClick={() => setDeleteConfirmRecord(activeModalRecord)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                onClick={() => handleNavigateToResults(activeModalRecord)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white text-xs font-semibold shadow-md shadow-[#00737D]/20 transition-all cursor-pointer"
              >
                <span>Open in Full Results Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION DIALOG MODAL
          ======================================================== */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF8F5] dark:bg-[#1D1726] border border-rose-200 dark:border-rose-900/60 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                  Delete Digitized Record
                </h3>
                <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] font-mono">
                  {deleteConfirmRecord.id}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4A4154] dark:text-[#D8CEE2] leading-relaxed">
              Are you sure you want to permanently delete document <strong className="font-mono text-[#1A1523] dark:text-[#F5F2EB]">{deleteConfirmRecord.id}</strong> (<em>{deleteConfirmRecord.file_name || 'document'}</em>)?
            </p>
            <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] bg-black/3 dark:bg-white/3 p-2.5 rounded-lg leading-normal">
              <strong>Deletion Policy:</strong> This action permanently deletes the document record and saved Tamil transcription from MongoDB Atlas, removes associated audit log references, and safely deletes the persisted image file from disk.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmRecord(null)}
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
                {isDeleting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitizedRecords;

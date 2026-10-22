import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Archive, 
  Check, 
  Clock, 
  Sparkles, 
  MoreHorizontal, 
  ChevronRight, 
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardStats } from '../api/ocrApi';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [timeRange, setTimeRange] = useState('6 months');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load live statistics from backend database
  const loadStats = useCallback(async (range) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboardStats(range);
      if (data && data.success) {
        setDashboardData(data);
      } else if (data) {
        setDashboardData(data);
      } else {
        setError('Could not retrieve dashboard statistics from database.');
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Database connection error. Please verify backend status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(timeRange);
  }, [timeRange, loadStats]);

  // Format relative time helper for recent records
  const formatTime = (isoString) => {
    if (!isoString) return 'Recently';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  // Reconciled 4 summary card statistics calculated strictly from database
  const stats = useMemo(() => {
    const totalDocs = dashboardData?.total_documents ?? 0;
    const processed = dashboardData?.processed_records ?? 0;
    const pending = dashboardData?.pending_documents ?? 0;
    const reviewNeeded = dashboardData?.review_needed_count ?? 0;
    const avgConf = dashboardData?.avg_confidence;
    const validConfRecords = dashboardData?.valid_confidence_records ?? 0;
    const totalThisMonth = dashboardData?.total_this_month ?? totalDocs;
    const verifiedThisMonth = dashboardData?.verified_this_month ?? processed;

    return [
      {
        key: 'total',
        label: t('stat_total_docs', 'Total Documents'),
        value: totalDocs.toLocaleString(),
        badge: totalDocs > 0 ? `+${totalThisMonth} this month` : 'No records yet',
        badgeColor: 'text-emerald-600 dark:text-emerald-400',
        icon: Archive,
        iconBg: 'bg-[#EDE5F4] text-[#6B3FA0] dark:bg-[#2A1E38] dark:text-[#B68CE8]',
      },
      {
        key: 'processed',
        label: t('stat_processed_records', 'Processed Records'),
        value: processed.toLocaleString(),
        badge: processed > 0 ? `+${verifiedThisMonth} this month` : '0 verified',
        badgeColor: 'text-emerald-600 dark:text-emerald-400',
        icon: Check,
        iconBg: 'bg-[#E0F2F1] text-[#00737D] dark:bg-[#153438] dark:text-[#2DD4BF]',
      },
      {
        key: 'pending',
        label: t('stat_pending_docs', 'Pending Documents'),
        value: pending.toLocaleString(),
        badge: `${reviewNeeded} need review`,
        badgeColor: 'text-[#D97706] dark:text-[#FBBF24]',
        icon: Clock,
        iconBg: 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#382B1B] dark:text-[#FBBF24]',
      },
      {
        key: 'conf',
        label: t('stat_avg_confidence', 'Avg. Confidence'),
        value: avgConf !== null && avgConf !== undefined ? `${avgConf}%` : 'N/A',
        badge: validConfRecords > 0 ? `Across ${validConfRecords} records` : 'No OCR results',
        badgeColor: 'text-emerald-600 dark:text-emerald-400',
        icon: Sparkles,
        iconBg: 'bg-[#E6F4EA] text-[#0D9488] dark:bg-[#1A332C] dark:text-[#34D399]',
      },
    ];
  }, [dashboardData, t]);

  // Timeline chart calculations
  const timeline = dashboardData?.timeline;
  const timelineLabels = timeline?.labels || ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const timelineCounts = timeline?.counts || [0, 0, 0, 0, 0, 0];

  const maxCount = Math.max(...timelineCounts, 0);
  const maxGrid = maxCount === 0 ? 10 : (maxCount <= 10 ? 10 : Math.ceil(maxCount / 20) * 20);

  const gridSteps = [
    { y: 20, val: maxGrid },
    { y: 60, val: Math.round(maxGrid * 0.75) },
    { y: 100, val: Math.round(maxGrid * 0.50) },
    { y: 140, val: Math.round(maxGrid * 0.25) },
    { y: 180, val: 0 },
  ];

  // SVG coordinates for timeline
  const chartPoints = useMemo(() => {
    const N = timelineLabels.length;
    if (N === 0) return [];
    return timelineLabels.map((label, i) => {
      const x = N > 1 ? 50 + i * (540 / (N - 1)) : 295;
      const count = timelineCounts[i] || 0;
      const y = 180 - (maxGrid > 0 ? (count / maxGrid) * 160 : 0);
      return { x, y, count, label };
    });
  }, [timelineLabels, timelineCounts, maxGrid]);

  // Build smooth Bézier curve for timeline
  const { pathD, areaD } = useMemo(() => {
    if (chartPoints.length === 0) return { pathD: '', areaD: '' };
    if (chartPoints.length === 1) {
      const p = chartPoints[0];
      return { pathD: `M ${p.x} ${p.y}`, areaD: '' };
    }

    let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const firstX = chartPoints[0].x;
    const lastX = chartPoints[chartPoints.length - 1].x;
    const a = `${d} L ${lastX} 180 L ${firstX} 180 Z`;
    return { pathD: d, areaD: a };
  }, [chartPoints]);

  // Recognition Quality Donut chart calculations
  const quality = dashboardData?.confidence_distribution;
  const highPct = quality?.high_confidence_pct ?? 0;
  const modPct = quality?.moderate_confidence_pct ?? 0;
  const lowPct = quality?.low_confidence_pct ?? 0;
  const highCount = quality?.high_confidence_count ?? 0;
  const modCount = quality?.moderate_confidence_count ?? 0;
  const lowCount = quality?.low_confidence_count ?? 0;
  const avgConf = dashboardData?.avg_confidence;
  const totalValid = dashboardData?.valid_confidence_records ?? 0;

  // Donut circumference for r=38 is 238.8
  const circumference = 238.8;
  const highDash = (highPct / 100) * circumference;
  const modDash = ((highPct + modPct) / 100) * circumference;

  // Recent records from database
  const recentRecords = dashboardData?.recent_records || [];

  // Extract greeting name from authenticated user profile or email ID
  const greetingName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.fullName) return user.fullName;
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix
        .replace(/[._-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return 'Officer';
  }, [user]);

  return (
    <div className="space-y-6">
      {/* ========================================================
          Greeting Header
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1523] dark:text-[#F5F2EB] leading-normal pt-1">
            {t('greeting_prefix', 'Welcome')}, {greetingName}
          </h2>
          <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1">
            {t('greeting_subtitle', 'Here’s what’s happening with your digitization project today.')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadStats(timeRange)}
            className="p-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#2C2237] text-[#7A7185] dark:text-[#9D93A7] hover:text-[#1A1523] dark:hover:text-[#F5F2EB] transition-colors cursor-pointer"
            title="Refresh database statistics"
            aria-label="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00737D]' : ''}`} />
          </button>

          <button
            id="btn-dashboard-upload"
            onClick={() => navigate('/upload')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs shadow-md shadow-[#00737D]/20 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{t('btn_upload_doc', 'Upload document')}</span>
          </button>
        </div>
      </div>

      {/* Error Banner if API fails */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => loadStats(timeRange)} 
            className="underline font-semibold hover:text-amber-800 dark:hover:text-amber-300 ml-4 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ========================================================
          4 Metric Cards (Connected to Genuine Database Records)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          const handleCardClick = () => {
            if (s.key === 'total') navigate('/records');
            else if (s.key === 'processed') navigate('/records?status=Verified');
            else if (s.key === 'pending') navigate('/records?status=Pending');
            else if (s.key === 'conf') navigate('/records');
          };

          const cardTitle = s.key === 'total' 
            ? 'Click to view all saved documents' 
            : s.key === 'processed' 
            ? 'Click to view successfully digitized records' 
            : s.key === 'pending' 
            ? 'Click to view documents needing review' 
            : 'Click to view records archive';

          return (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              onClick={handleCardClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick();
                }
              }}
              title={cardTitle}
              className="p-5 rounded-2xl border transition-all duration-200 bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs relative overflow-hidden cursor-pointer hover:border-[#00737D] dark:hover:border-[#2DD4BF] hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#00737D]"
            >
              {/* Corner accent border line matching reference */}
              <div className="absolute top-0 right-0 w-12 h-[2px] bg-[#00737D]/40" />

              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#7A7185] dark:text-[#9D93A7]">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold font-english text-[#1A1523] dark:text-[#F5F2EB] mt-0.5">
                    {s.value}
                  </p>
                  <p className={`text-xs mt-1 font-medium ${s.badgeColor}`}>
                    {s.badge}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          Charts Row: Processing Statistics + Recognition Quality
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Processing Statistics Line Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                {t('chart_proc_stats', 'Processing Statistics')}
              </h3>
              <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-0.5">
                {timeRange === '30 days' 
                  ? 'Documents processed over the last 30 days' 
                  : timeRange === '12 months'
                  ? 'Documents processed over the last 12 months'
                  : 'Documents processed over the last 6 months'}
              </p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-[#EFE9DD] dark:bg-[#251D30] border-[#DFD7C7] dark:border-[#382B46] text-[#4A4154] dark:text-[#D8CEE2] focus:outline-none cursor-pointer"
            >
              <option value="6 months">{t('range_6_months', '6 months')}</option>
              <option value="12 months">{t('range_1_year', '12 months')}</option>
              <option value="30 days">{t('range_30_days', '30 days')}</option>
            </select>
          </div>

          {/* SVG Dynamic Smooth Curved Area Chart */}
          <div className="w-full h-56 pt-2">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00737D" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00737D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {gridSteps.map((grid, i) => (
                <g key={i}>
                  <line 
                    x1="40" 
                    y1={grid.y} 
                    x2="590" 
                    y2={grid.y} 
                    stroke="currentColor" 
                    className="text-[#DFD7C7] dark:text-[#2A2135]" 
                    strokeDasharray="4 4" 
                    strokeWidth="1"
                  />
                  <text 
                    x="25" 
                    y={grid.y + 4} 
                    textAnchor="end" 
                    className="fill-[#9D93A7] text-[10px] font-mono"
                  >
                    {grid.val}
                  </text>
                </g>
              ))}

              {/* Area Fill */}
              {areaD && (
                <path
                  d={areaD}
                  fill="url(#areaGradient)"
                />
              )}

              {/* Stroke Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#00737D"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {/* Data Points */}
              {chartPoints.map((pt, i) => (
                <g key={i} className="group cursor-pointer">
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#00737D" />
                  <circle cx={pt.x} cy={pt.y} r="2.5" fill="#FFFFFF" />
                  <title>{`${pt.label}: ${pt.count} documents processed`}</title>
                </g>
              ))}

              {/* X Axis Month Labels */}
              {chartPoints.map((lbl, i) => (
                <text
                  key={i}
                  x={lbl.x}
                  y="198"
                  textAnchor="middle"
                  className="fill-[#9D93A7] text-[11px] font-medium"
                >
                  {lbl.label}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Recognition Quality Donut Chart (1 Col) */}
        <div className="p-6 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                {t('chart_quality', 'Recognition Quality')}
              </h3>
              <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-0.5">
                {totalValid > 0 
                  ? `Confidence distribution across ${totalValid} records` 
                  : 'Confidence distribution'}
              </p>
            </div>
            <button className="text-[#9D93A7] hover:text-current">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Donut Chart SVG */}
          <div className="relative w-40 h-40 mx-auto my-3 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Background circle / Low confidence / Manual review */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke={isDark ? '#382B46' : '#DDD4C4'}
                strokeWidth="12"
              />
              {/* Needs review arc (Moderate + High) */}
              {modDash > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#C07D2A"
                  strokeWidth="12"
                  strokeDasharray={`${modDash} 238.8`}
                  strokeDashoffset="0"
                />
              )}
              {/* High confidence arc (Teal) */}
              {highDash > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#00737D"
                  strokeWidth="12"
                  strokeDasharray={`${highDash} 238.8`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-english text-[#1A1523] dark:text-[#F5F2EB]">
                {avgConf !== null && avgConf !== undefined ? `${avgConf}%` : 'N/A'}
              </span>
              <span className="text-[10px] text-[#7A7185] dark:text-[#9D93A7]">
                Average
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#00737D]" />
                <span className="text-[#7A7185] dark:text-[#9D93A7]">
                  {t('quality_high', 'High confidence (>90%)')}
                </span>
              </div>
              <span className="font-semibold font-english">
                {highPct}% ({highCount})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#C07D2A]" />
                <span className="text-[#7A7185] dark:text-[#9D93A7]">
                  {t('quality_mid', 'Moderate (80-90%)')}
                </span>
              </div>
              <span className="font-semibold font-english">
                {modPct}% ({modCount})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-[#382B46]' : 'bg-[#DDD4C4]'}`} />
                <span className="text-[#7A7185] dark:text-[#9D93A7]">
                  {t('quality_low', 'Manual review (<80%)')}
                </span>
              </div>
              <span className="font-semibold font-english">
                {lowPct}% ({lowCount})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          Recent Documents Table (Genuine Database Records)
          ======================================================== */}
      <div className="p-6 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB]">
              {t('recent_docs_title', 'Recent Documents')}
            </h3>
            <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-0.5">
              {t('recent_docs_sub', 'Latest manuscript records processed through the OCR pipeline')}
            </p>
          </div>
          <button
            onClick={() => navigate('/records')}
            className="text-xs font-semibold text-[#00737D] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t('btn_view_all', 'View all records')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DFD7C7] dark:border-[#2C2237] text-[10px] uppercase font-bold text-[#7A7185] dark:text-[#9D93A7] tracking-wider">
                <th className="pb-3 font-semibold">{t('col_title', 'DOCUMENT')}</th>
                <th className="pb-3 font-semibold">{t('col_dept', 'DEPARTMENT')}</th>
                <th className="pb-3 font-semibold">{t('col_date', 'UPLOADED')}</th>
                <th className="pb-3 font-semibold">{t('col_status', 'STATUS')}</th>
                <th className="pb-3 font-semibold">{t('col_conf', 'CONFIDENCE')}</th>
                <th className="pb-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFD7C7]/50 dark:divide-[#2C2237]/50">
              {recentRecords.length > 0 ? (
                recentRecords.map((item) => {
                  const format = (item.file_name || 'JPG').split('.').pop().toUpperCase();
                  const isVerified = item.status === 'Verified' || item.status === 'Completed';
                  const confDisplay = item.confidence !== undefined && item.confidence !== null 
                    ? `${item.confidence}%` 
                    : 'N/A';

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => navigate('/results', { state: { record: item } })}
                      className="hover:bg-black/2 dark:hover:bg-white/2 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#EAE4D7] dark:bg-[#281D35] flex items-center justify-center text-[#7A7185] dark:text-[#9D93A7] shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-[#1A1523] dark:text-[#F5F2EB] font-tamil">
                            {item.title || item.file_name || 'தமிழ் ஆவணம்'}
                          </p>
                          <p className="text-[10px] text-[#7A7185] dark:text-[#9D93A7]">
                            {item.id} · {format}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 text-[#5D5467] dark:text-[#B8ADC4]">
                        {item.department || 'General Administration'}
                      </td>
                      <td className="py-3.5 text-[#5D5467] dark:text-[#B8ADC4]">
                        {formatTime(item.created_at)}
                      </td>
                      <td className="py-3.5">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40">
                            <Check className="w-3 h-3" />
                            {t('status_verified', 'Verified')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/40">
                            {item.status || t('status_review', 'Review')}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 font-semibold font-english text-[#1A1523] dark:text-[#F5F2EB]">
                        {confDisplay}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="p-1 rounded-lg border border-[#DFD7C7] dark:border-[#2C2237] text-gray-400 hover:text-current inline-flex">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-[#7A7185] dark:text-[#9D93A7] text-xs">
                    {loading ? 'Loading database records...' : 'No digitized records found in database. Upload a document to start processing.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

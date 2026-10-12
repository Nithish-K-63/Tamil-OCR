import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [timeRange, setTimeRange] = useState('6 months');

  const stats = [
    {
      key: 'total',
      label: t('stat_total_docs', 'Total Documents'),
      value: '2,486',
      badge: t('stat_month_increase', '+12.4% this month'),
      badgeColor: 'text-emerald-600 dark:text-emerald-400',
      icon: Archive,
      iconBg: 'bg-[#EDE5F4] text-[#6B3FA0] dark:bg-[#2A1E38] dark:text-[#B68CE8]',
    },
    {
      key: 'processed',
      label: t('stat_processed_records', 'Processed Records'),
      value: '2,318',
      badge: t('stat_month_proc_increase', '+8.2% this month'),
      badgeColor: 'text-emerald-600 dark:text-emerald-400',
      icon: Check,
      iconBg: 'bg-[#E0F2F1] text-[#00737D] dark:bg-[#153438] dark:text-[#2DD4BF]',
    },
    {
      key: 'pending',
      label: t('stat_pending_docs', 'Pending Documents'),
      value: '168',
      badge: t('stat_review_needed', '24 need review'),
      badgeColor: 'text-[#D97706] dark:text-[#FBBF24]',
      icon: Clock,
      iconBg: 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#382B1B] dark:text-[#FBBF24]',
    },
    {
      key: 'conf',
      label: t('stat_avg_confidence', 'Avg. Confidence'),
      value: '93.6%',
      badge: t('stat_vs_last_month', '+1.8% vs last month'),
      badgeColor: 'text-emerald-600 dark:text-emerald-400',
      icon: Sparkles,
      iconBg: 'bg-[#E6F4EA] text-[#0D9488] dark:bg-[#1A332C] dark:text-[#34D399]',
    },
  ];

  const [liveStats, setLiveStats] = useState(null);
  const [liveUploads, setLiveUploads] = useState(null);

  React.useEffect(() => {
    import('../api/ocrApi').then(({ fetchDashboardStats, fetchHistory }) => {
      fetchDashboardStats().then(data => {
        if (data) setLiveStats(data);
      });
      fetchHistory(5, 0).then(records => {
        if (records && records.length > 0) {
          setLiveUploads(records.map(r => ({
            id: r.id,
            title: r.title,
            format: (r.file_name || 'JPG').split('.').pop().toUpperCase(),
            department: r.department,
            uploaded: 'Recently digitized',
            status: r.status,
            confidence: `${r.confidence}%`
          })));
        }
      });
    });
  }, []);

  const displayStats = stats.map(s => {
    if (!liveStats) return s;
    if (s.key === 'total' && liveStats.total_documents) return { ...s, value: liveStats.total_documents.toLocaleString() };
    if (s.key === 'processed' && liveStats.processed_records) return { ...s, value: liveStats.processed_records.toLocaleString() };
    if (s.key === 'pending' && liveStats.pending_documents) return { ...s, value: liveStats.pending_documents.toLocaleString() };
    if (s.key === 'conf' && liveStats.avg_confidence) return { ...s, value: `${liveStats.avg_confidence}%` };
    return s;
  });

  const recentUploads = [
    {
      id: 'TNOCR-0248',
      title: 'நிலப் பதிவு ஆவணம்',
      format: 'JPG',
      department: 'Revenue',
      uploaded: 'Today, 10:32 AM',
      status: 'Verified',
      confidence: '94.8%',
    },
    {
      id: 'TNOCR-0247',
      title: 'பிறப்புச் சான்றிதழ்',
      format: 'PNG',
      department: 'Municipal',
      uploaded: '2 days ago',
      status: 'Review',
      confidence: '87.2%',
    },
    {
      id: 'TNOCR-0246',
      title: 'வரி மதிப்பீட்டுப் பதிவு',
      format: 'JPG',
      department: 'Revenue',
      uploaded: '3 days ago',
      status: 'Verified',
      confidence: '96.1%',
    },
    {
      id: 'TNOCR-0245',
      title: 'நீர்ப்பாசன நில அளவை',
      format: 'PNG',
      department: 'Public Works',
      uploaded: '4 days ago',
      status: 'Verified',
      confidence: '91.5%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================
          Greeting Header
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1523] dark:text-[#F5F2EB] leading-normal pt-1">
            {t('greeting_prefix', 'Welcome')}, Arun
          </h2>
          <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1">
            {t('greeting_subtitle', 'Here’s what’s happening with your digitization project today.')}
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00737D] hover:bg-[#005F67] text-white font-semibold text-xs shadow-md shadow-[#00737D]/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>{t('btn_upload_doc', 'Upload document')}</span>
        </button>
      </div>

      {/* ========================================================
          4 Metric Cards
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border transition-all duration-200 bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs relative overflow-hidden"
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
                {t('chart_proc_sub', 'Documents processed over the last 6 months')}
              </p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border bg-[#EFE9DD] dark:bg-[#251D30] border-[#DFD7C7] dark:border-[#382B46] text-[#4A4154] dark:text-[#D8CEE2] focus:outline-none"
            >
              <option value="6 months">{t('range_6_months', '6 months')}</option>
              <option value="12 months">{t('range_1_year', '12 months')}</option>
              <option value="30 days">{t('range_30_days', '30 days')}</option>
            </select>
          </div>

          {/* SVG Smooth Curved Area Chart */}
          <div className="w-full h-56 pt-2">
            <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00737D" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00737D" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[
                { y: 20, val: 600 },
                { y: 60, val: 450 },
                { y: 100, val: 300 },
                { y: 140, val: 150 },
                { y: 180, val: 0 },
              ].map((grid, i) => (
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
              <path
                d="M 50 142 C 120 135, 170 128, 220 125 C 270 122, 330 115, 380 95 C 430 75, 480 82, 530 65 C 560 55, 580 48, 590 45 L 590 180 L 50 180 Z"
                fill="url(#areaGradient)"
              />

              {/* Stroke Line */}
              <path
                d="M 50 142 C 120 135, 170 128, 220 125 C 270 122, 330 115, 380 95 C 430 75, 480 82, 530 65 C 560 55, 580 48, 590 45"
                fill="none"
                stroke="#00737D"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Points */}
              {[
                { x: 50, y: 142 },
                { x: 155, y: 130 },
                { x: 260, y: 122 },
                { x: 370, y: 100 },
                { x: 480, y: 78 },
                { x: 590, y: 45 },
              ].map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#00737D" />
                  <circle cx={pt.x} cy={pt.y} r="2.5" fill="#FFFFFF" />
                </g>
              ))}

              {/* X Axis Month Labels */}
              {[
                { x: 50, label: 'Jan' },
                { x: 155, label: 'Feb' },
                { x: 260, label: 'Mar' },
                { x: 370, label: 'Apr' },
                { x: 480, label: 'May' },
                { x: 590, label: 'Jun' },
              ].map((lbl, i) => (
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
                {t('chart_quality_sub', 'Confidence distribution')}
              </p>
            </div>
            <button className="text-[#9D93A7] hover:text-current">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Donut Chart SVG */}
          <div className="relative w-40 h-40 mx-auto my-3 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Background circle / Low confidence (tan 6%) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#DDD4C4"
                strokeWidth="12"
              />
              {/* Needs review arc (16% orange) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#C07D2A"
                strokeWidth="12"
                strokeDasharray={`${(16 + 78) * 2.38} 238`}
                strokeDashoffset="0"
              />
              {/* High confidence arc (78% teal) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#00737D"
                strokeWidth="12"
                strokeDasharray={`${78 * 2.38} 238`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold font-english text-[#1A1523] dark:text-[#F5F2EB]">
                93.6%
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
                <span className="text-[#7A7185] dark:text-[#9D93A7]">{t('quality_high', 'High confidence')}</span>
              </div>
              <span className="font-semibold font-english">78%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#C07D2A]" />
                <span className="text-[#7A7185] dark:text-[#9D93A7]">{t('quality_mid', 'Needs review')}</span>
              </div>
              <span className="font-semibold font-english">16%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#DDD4C4]" />
                <span className="text-[#7A7185] dark:text-[#9D93A7]">{t('quality_low', 'Low confidence')}</span>
              </div>
              <span className="font-semibold font-english">6%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          Recent Uploads Table
          ======================================================== */}
      <div className="p-6 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB]">
              {t('recent_docs_title', 'Recent Uploads')}
            </h3>
            <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-0.5">
              {t('recent_docs_sub', 'Latest manuscripts added to the system')}
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
              {(liveUploads || recentUploads).map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => navigate('/results')}
                  className="hover:bg-black/2 dark:hover:bg-white/2 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EAE4D7] dark:bg-[#281D35] flex items-center justify-center text-[#7A7185] dark:text-[#9D93A7] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-[#1A1523] dark:text-[#F5F2EB] font-tamil">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-[#7A7185] dark:text-[#9D93A7]">
                        {item.id} · {item.format}
                      </p>
                    </div>
                  </td>
                  <td className="py-3.5 text-[#5D5467] dark:text-[#B8ADC4]">
                    {item.department}
                  </td>
                  <td className="py-3.5 text-[#5D5467] dark:text-[#B8ADC4]">
                    {item.uploaded}
                  </td>
                  <td className="py-3.5">
                    {item.status === 'Verified' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40">
                        <Check className="w-3 h-3" />
                        {t('status_verified', 'Verified')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/40">
                        {t('status_review', 'Review')}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 font-semibold font-english text-[#1A1523] dark:text-[#F5F2EB]">
                    {item.confidence}
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="p-1 rounded-lg border border-[#DFD7C7] dark:border-[#2C2237] text-gray-400 hover:text-current inline-flex">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

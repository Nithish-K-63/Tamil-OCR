import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Download, 
  Check, 
  FileText 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { fetchHistory } from '../api/ocrApi';

const DigitizedRecords = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('All years');
  const [selectedDept, setSelectedDept] = useState('All departments');
  const [selectedStatus, setSelectedStatus] = useState('All statuses');

  const records = [
    {
      id: 'TNOCR-0248',
      title: 'நிலப் பதிவு ஆவணம்',
      department: 'Revenue Department',
      year: '1978',
      category: 'Land Record',
      confidence: '94.8%',
      status: 'Verified',
      stamp: '1978',
    },
    {
      id: 'TNOCR-0247',
      title: 'பிறப்புச் சான்றிதழ்',
      department: 'Municipal Department',
      year: '1984',
      category: 'Certificate',
      confidence: '87.2%',
      status: 'Review',
      stamp: '1978',
    },
    {
      id: 'TNOCR-0246',
      title: 'வரி மதிப்பீட்டுப் பதிவு',
      department: 'Revenue Department',
      year: '1966',
      category: 'Tax Record',
      confidence: '96.1%',
      status: 'Verified',
      stamp: '1978',
    },
    {
      id: 'TNOCR-0245',
      title: 'நீர்ப்பாசன நில அளவை',
      department: 'Public Works',
      year: '1972',
      category: 'Land Record',
      confidence: '91.5%',
      status: 'Verified',
      stamp: '1978',
    },
    {
      id: 'TNOCR-0244',
      title: 'கோவில் மானியப் பட்டா',
      department: 'Endowments',
      year: '1959',
      category: 'Deed',
      confidence: '82.4%',
      status: 'Draft',
      stamp: '1978',
    },
  ];

  const [liveRecords, setLiveRecords] = useState(null);

  React.useEffect(() => {
    let isMounted = true;
    fetchHistory(50, 0, search).then(data => {
      if (isMounted && data && data.length > 0) {
        setLiveRecords(data.map(r => ({
          id: r.id,
          title: r.title,
          department: r.department,
          year: r.year,
          category: r.category || 'Land Record',
          confidence: `${r.confidence}%`,
          status: r.status,
          stamp: r.year,
          tamil_text: r.tamil_text
        })));
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [search]);

  const activeList = liveRecords || records;

  const filtered = activeList.filter(r => {
    const matchSearch = r.title.includes(search) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* ========================================================
          Header
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1523] dark:text-[#F5F2EB] tracking-tight">
            {t('records_heading', 'Preserved Records')}
          </h2>
          <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1 font-english">
            <span className="font-bold text-[#00737D]">{activeList.length.toLocaleString()}</span> {t('records_subheading_1', 'digitized manuscripts in the archive')}
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
            <option value="1978">1978</option>
            <option value="1984">1984</option>
            <option value="1966">1966</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] focus:outline-none"
          >
            <option value="All departments">{t('opt_all_departments', 'All departments')}</option>
            <option value="Revenue">{t('dept_revenue', 'Revenue Department')}</option>
            <option value="Municipal">{t('dept_municipal', 'Municipal Department')}</option>
            <option value="Public Works">{t('dept_pwd', 'Public Works')}</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[#DFD7C7] dark:border-[#382C46] bg-white dark:bg-[#251D30] text-xs font-medium text-[#4A4154] dark:text-[#D8CEE2] focus:outline-none"
          >
            <option value="All statuses">{t('opt_all_statuses', 'All statuses')}</option>
            <option value="Verified">{t('opt_verified', 'Verified')}</option>
            <option value="Review">{t('opt_review', 'Review')}</option>
            <option value="Draft">{t('opt_draft', 'Draft')}</option>
          </select>
        </div>
      </div>

      {/* Sub-bar */}
      <div className="flex items-center justify-between text-xs text-[#7A7185] dark:text-[#9D93A7] px-1">
        <span>{t('showing_records', 'Showing')} {filtered.length} {t('records_suffix', 'records')}</span>
        <span>{t('sort_by_label', 'Sort by')} <strong className="text-[#1A1523] dark:text-[#F5F2EB]">{t('sort_recently_updated', 'Recently updated')}</strong></span>
      </div>

      {/* ========================================================
          Cards Grid
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group"
          >
            {/* Top Manuscript Preview Card */}
            <div className="p-6 bg-[#FAF8F5] dark:bg-[#15101C] border-b border-[#DFD7C7] dark:border-[#2C2237] relative flex items-center justify-center min-h-[170px]">
              {/* Paper representation */}
              <div className="w-28 h-36 bg-[#EFE8D8] text-[#2C241D] rounded shadow-md p-2.5 border border-[#DFD3BE] font-tamil text-[7px] leading-tight relative">
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

              {/* Status Badge in Top Right */}
              <div className="absolute top-3 right-3">
                {item.status === 'Verified' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <Check className="w-3 h-3" />
                    {t('opt_verified', 'Verified')}
                  </span>
                )}
                {item.status === 'Review' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    {t('opt_review', 'Review')}
                  </span>
                )}
                {item.status === 'Draft' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                    {t('opt_draft', 'Draft')}
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Content & Metadata */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <p className="text-[11px] font-mono text-[#00737D] font-bold">
                  {item.id}
                </p>
                <h4 className="text-sm font-bold text-[#1A1523] dark:text-[#F5F2EB] font-tamil mt-0.5">
                  {item.title}
                </h4>
                <p className="text-xs text-[#7A7185] dark:text-[#9D93A7]">
                  {item.department}
                </p>
              </div>

              {/* 3-Column Meta */}
              <div className="pt-3 border-t border-[#DFD7C7]/60 dark:border-[#2C2237]/60 grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <p className="text-[#9D93A7] uppercase font-semibold">{t('th_year', 'YEAR')}</p>
                  <p className="font-bold text-[#1A1523] dark:text-[#F5F2EB] mt-0.5 font-mono">{item.year}</p>
                </div>
                <div>
                  <p className="text-[#9D93A7] uppercase font-semibold">{t('th_category', 'CATEGORY')}</p>
                  <p className="font-bold text-[#1A1523] dark:text-[#F5F2EB] mt-0.5 truncate">{item.category}</p>
                </div>
                <div>
                  <p className="text-[#9D93A7] uppercase font-semibold">{t('th_confidence', 'CONFIDENCE')}</p>
                  <p className="font-bold text-[#1A1523] dark:text-[#F5F2EB] mt-0.5 font-mono">{item.confidence}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#DFD7C7]/60 dark:border-[#2C2237]/60 flex items-center justify-between">
                <button
                  onClick={() => navigate('/results')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#00737D] hover:underline cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('btn_preview', 'Preview')}</span>
                </button>

                <div className="flex items-center gap-2 text-gray-400">
                  <button 
                    onClick={() => navigate('/results')}
                    className="p-1.5 rounded-lg hover:text-current hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => alert(`Exporting record ${item.id}...`)}
                    className="p-1.5 rounded-lg hover:text-current hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DigitizedRecords;

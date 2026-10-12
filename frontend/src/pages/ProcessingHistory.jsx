import React from 'react';
import { Check, Upload, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ProcessingHistory = () => {
  const { t } = useLanguage();

  const activities = [
    {
      id: 1,
      type: 'review',
      icon: Check,
      title: t('act_1_title', 'Record TNOCR-0248 recognized and reviewed'),
      time: t('act_1_time', '12 minutes ago · Arun Kumar'),
    },
    {
      id: 2,
      type: 'upload',
      icon: Upload,
      title: t('act_2_title', 'land_record_1978.jpg uploaded'),
      time: t('act_2_time', '2 days ago · Arun Kumar'),
    },
    {
      id: 3,
      type: 'verified',
      icon: Check,
      title: t('act_3_title', 'Record TNOCR-0246 verified'),
      time: t('act_3_time', '3 days ago · Arun Kumar'),
    },
    {
      id: 4,
      type: 'update',
      icon: Check,
      title: t('act_4_title', 'Archive metadata updated'),
      time: t('act_4_time', '4 days ago · Arun Kumar'),
    },
  ];

  return (
    <div className="max-w-4xl relative">
      <div className="p-6 sm:p-8 rounded-2xl border bg-white/60 dark:bg-[#1D1726] border-[#DFD7C7] dark:border-[#2C2237] shadow-xs relative z-10">
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1523] dark:text-[#F5F2EB]">
          {t('history_heading', 'Recent activity')}
        </h2>
        <p className="text-xs text-[#7A7185] dark:text-[#9D93A7] mt-1 mb-6">
          {t('history_subheading', 'A transparent log of digitization work across the project.')}
        </p>

        <div className="divide-y divide-[#DFD7C7]/60 dark:divide-[#2C2237]/60">
          {activities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="py-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A1523] dark:text-[#F5F2EB]">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#7A7185] dark:text-[#9D93A7] mt-0.5">
                    {item.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle Tamil watermark background */}
      <div className="fixed right-12 bottom-12 text-[260px] font-bold font-tamil text-black/2 dark:text-white/2 pointer-events-none select-none z-0">
        அ
      </div>
    </div>
  );
};

export default ProcessingHistory;

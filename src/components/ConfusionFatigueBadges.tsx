import React from 'react';
import { GenomePayload } from '@/lib/genome-types';

interface ConfusionFatigueBadgesProps {
  indices: GenomePayload['indices'];
}

const ConfusionFatigueBadges: React.FC<ConfusionFatigueBadgesProps> = ({ indices }) => {
  const ci = indices.confusion_index;
  const fi = indices.fatigue_index;

  const confLevel = ci > 70 ? 'HIGH' : ci > 50 ? 'MOD' : 'LOW';
  const fatLevel = fi > 65 ? 'HIGH' : fi > 45 ? 'MOD' : 'LOW';

  const confColor = ci > 70 ? 'bg-red-50 text-red-700 border-red-200' : ci > 50 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200';
  const fatColor = fi > 65 ? 'bg-amber-50 text-amber-700 border-amber-200' : fi > 45 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200';

  return (
    <div className="flex gap-3">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all duration-500 ${confColor}`}>
        <span className="text-base">❓</span>
        <div>
          <div className="text-[10px] opacity-70 font-heading">CONFUSION</div>
          <div className="font-bold font-heading">{Math.round(ci)} <span className="text-[10px] font-normal">{confLevel}</span></div>
        </div>
      </div>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all duration-500 ${fatColor}`}>
        <span className="text-base">😴</span>
        <div>
          <div className="text-[10px] opacity-70 font-heading">FATIGUE</div>
          <div className="font-bold font-heading">{Math.round(fi)} <span className="text-[10px] font-normal">{fatLevel}</span></div>
        </div>
      </div>
    </div>
  );
};

export default ConfusionFatigueBadges;

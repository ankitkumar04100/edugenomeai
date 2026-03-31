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

  const confColor = ci > 70 ? 'bg-confusion/20 text-confusion genome-glow-confusion' : ci > 50 ? 'bg-fatigue/20 text-fatigue' : 'bg-genome-learning/20 text-genome-learning';
  const fatColor = fi > 65 ? 'bg-fatigue/20 text-fatigue genome-glow-fatigue' : fi > 45 ? 'bg-genome-performance/20 text-genome-performance' : 'bg-genome-learning/20 text-genome-learning';

  return (
    <div className="flex gap-3">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs ${confColor} transition-all duration-500`}>
        <span className="text-base">❓</span>
        <div>
          <div className="text-[10px] opacity-70">CONFUSION</div>
          <div className="font-bold">{Math.round(ci)} <span className="text-[10px]">{confLevel}</span></div>
        </div>
      </div>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs ${fatColor} transition-all duration-500`}>
        <span className="text-base">😴</span>
        <div>
          <div className="text-[10px] opacity-70">FATIGUE</div>
          <div className="font-bold">{Math.round(fi)} <span className="text-[10px]">{fatLevel}</span></div>
        </div>
      </div>
    </div>
  );
};

export default ConfusionFatigueBadges;

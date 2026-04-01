import React from 'react';
import { GenomePayload } from '@/lib/genome-types';

interface AlertBannerProps {
  indices: GenomePayload['indices'];
  confusionThreshold?: number;
  fatigueThreshold?: number;
}

const AlertBanner: React.FC<AlertBannerProps> = ({
  indices,
  confusionThreshold = 70,
  fatigueThreshold = 65,
}) => {
  const showConfusion = indices.confusion_index > confusionThreshold;
  const showFatigue = indices.fatigue_index > fatigueThreshold;

  if (!showConfusion && !showFatigue) return null;

  return (
    <div className="space-y-2">
      {showConfusion && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 animate-fade-in" role="alert">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-heading font-semibold text-sm">Entering Confusion Zone</div>
            <div className="text-xs opacity-80">
              Confusion Index at {Math.round(indices.confusion_index)} — consider simplifying the current material or breaking it into smaller steps.
            </div>
          </div>
        </div>
      )}
      {showFatigue && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 animate-fade-in" role="alert">
          <span className="text-xl">😴</span>
          <div>
            <div className="font-heading font-semibold text-sm">Consider a Short Break</div>
            <div className="text-xs opacity-80">
              Fatigue Index at {Math.round(indices.fatigue_index)} — a 3–5 minute break can help restore focus and reduce errors.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertBanner;

import React from 'react';
import { TRAIT_DEFINITIONS, CATEGORY_COLORS, CATEGORY_LABELS, GenomeCategory, GenomePayload } from '@/lib/genome-types';

interface TraitGridProps {
  data: GenomePayload;
  filter?: GenomeCategory | null;
}

const TraitGrid: React.FC<TraitGridProps> = ({ data, filter }) => {
  const traits = filter ? TRAIT_DEFINITIONS.filter(t => t.category === filter) : TRAIT_DEFINITIONS;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {traits.map((trait) => {
        const value = data.traits[trait.key] || 0;
        const color = CATEGORY_COLORS[trait.category];
        return (
          <div key={trait.key} className="card-premium p-3 group hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-heading uppercase tracking-wider" style={{ color }}>
                {CATEGORY_LABELS[trait.category]}
              </span>
              <span className="text-lg font-heading font-bold text-foreground">{Math.round(value)}</span>
            </div>
            <div className="text-xs font-heading font-medium text-foreground mb-2 leading-tight">{trait.name}</div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${value}%`, backgroundColor: color }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {trait.definition}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TraitGrid;

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { GenomePayload, TRAIT_DEFINITIONS, CATEGORY_COLORS, CATEGORY_LABELS, GenomeCategory } from '@/lib/genome-types';

interface GenomeWheelProps {
  data: GenomePayload;
  size?: number;
  interactive?: boolean;
  onTraitClick?: (traitKey: string) => void;
}

const GenomeWheel: React.FC<GenomeWheelProps> = ({ data, size = 500, interactive = true, onTraitClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; trait: typeof TRAIT_DEFINITIONS[0]; value: number } | null>(null);
  const prevDataRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!svgRef.current || !data) return;
    const svg = d3.select(svgRef.current);
    const cx = size / 2;
    const cy = size / 2;
    const innerRadius = size * 0.18;
    const maxRadius = size * 0.44;
    const angleStep = (2 * Math.PI) / 24;
    const padAngle = 0.02;

    svg.selectAll('g.arcs').remove();
    svg.selectAll('g.center-group').remove();

    // Defs for glows
    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) {
      defs = svg.append('defs');
      const filter = defs.append('filter').attr('id', 'glow');
      filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
      const merge = filter.append('feMerge');
      merge.append('feMergeNode').attr('in', 'coloredBlur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    const arcGroup = svg.append('g').attr('class', 'arcs').attr('transform', `translate(${cx},${cy})`);

    TRAIT_DEFINITIONS.forEach((trait, i) => {
      const value = data.traits[trait.key] || 0;
      const prevValue = prevDataRef.current[trait.key] || value;
      const delta = Math.abs(value - prevValue);
      const outerRadius = innerRadius + ((value / 100) * (maxRadius - innerRadius));
      const color = CATEGORY_COLORS[trait.category];
      const startAngle = i * angleStep + padAngle;
      const endAngle = (i + 1) * angleStep - padAngle;

      const arc = d3.arc<any>()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .cornerRadius(3);

      const bgArc = d3.arc<any>()
        .innerRadius(innerRadius)
        .outerRadius(maxRadius)
        .startAngle(startAngle)
        .endAngle(endAngle)
        .cornerRadius(3);

      // Background arc
      arcGroup.append('path')
        .attr('d', bgArc({}))
        .attr('fill', color)
        .attr('opacity', 0.08);

      // Value arc
      const path = arcGroup.append('path')
        .attr('d', arc({}))
        .attr('fill', color)
        .attr('opacity', 0.7 + (value / 100) * 0.3)
        .attr('stroke', color)
        .attr('stroke-width', 0.5)
        .style('filter', delta >= 5 ? 'url(#glow)' : 'none')
        .style('cursor', interactive ? 'pointer' : 'default');

      if (interactive) {
        const el = svgRef.current!;
        path.on('mouseenter', (event: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, trait, value });
          path.transition().duration(150).attr('opacity', 1);
        })
        .on('mouseleave', () => {
          setTooltip(null);
          path.transition().duration(150).attr('opacity', 0.7 + (value / 100) * 0.3);
        })
        .on('click', () => onTraitClick?.(trait.key));
      }

      // Pulse animation for significant changes
      if (delta >= 5) {
        const pulseArc = d3.arc<any>()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius + 4)
          .startAngle(startAngle)
          .endAngle(endAngle)
          .cornerRadius(3);

        arcGroup.append('path')
          .attr('d', pulseArc({}))
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.8)
          .transition()
          .duration(800)
          .attr('opacity', 0)
          .remove();
      }
    });

    // Center circle
    const centerGroup = svg.append('g').attr('class', 'center-group').attr('transform', `translate(${cx},${cy})`);
    
    // Center background
    centerGroup.append('circle')
      .attr('r', innerRadius - 8)
      .attr('fill', 'hsl(222, 41%, 9%)')
      .attr('stroke', 'hsl(222, 30%, 22%)')
      .attr('stroke-width', 1.5);

    // Overall score
    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-8')
      .attr('fill', 'hsl(210, 40%, 92%)')
      .attr('font-size', size * 0.055)
      .attr('font-family', '"Space Grotesk", sans-serif')
      .attr('font-weight', '700')
      .text(Math.round(data.overall_genome_score));

    centerGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '14')
      .attr('fill', 'hsl(215, 20%, 55%)')
      .attr('font-size', size * 0.022)
      .attr('font-family', '"Inter", sans-serif')
      .text('GENOME SCORE');

    // Confusion/Fatigue mini indicators
    const ci = data.indices.confusion_index;
    const fi = data.indices.fatigue_index;
    
    centerGroup.append('circle').attr('cx', -20).attr('cy', 32).attr('r', 4)
      .attr('fill', ci > 60 ? '#EF4444' : ci > 40 ? '#EAB308' : '#10B981');
    centerGroup.append('text').attr('x', -12).attr('y', 35)
      .attr('fill', 'hsl(215, 20%, 55%)').attr('font-size', 9).attr('font-family', '"JetBrains Mono"')
      .text(`C:${Math.round(ci)}`);

    centerGroup.append('circle').attr('cx', 12).attr('cy', 32).attr('r', 4)
      .attr('fill', fi > 65 ? '#EAB308' : fi > 40 ? '#F97316' : '#10B981');
    centerGroup.append('text').attr('x', 20).attr('y', 35)
      .attr('fill', 'hsl(215, 20%, 55%)').attr('font-size', 9).attr('font-family', '"JetBrains Mono"')
      .text(`F:${Math.round(fi)}`);

    // Category labels around the outside
    const categories: GenomeCategory[] = ['cognitive', 'behavioral', 'learning_style', 'performance'];
    categories.forEach((cat, ci) => {
      const midAngle = (ci * 6 + 3) * angleStep - Math.PI / 2;
      const labelR = maxRadius + 18;
      const lx = Math.cos(midAngle) * labelR;
      const ly = Math.sin(midAngle) * labelR;
      
      arcGroup.append('text')
        .attr('x', lx).attr('y', ly)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', CATEGORY_COLORS[cat])
        .attr('font-size', size * 0.02)
        .attr('font-family', '"Space Grotesk", sans-serif')
        .attr('font-weight', '600')
        .attr('opacity', 0.8)
        .text(CATEGORY_LABELS[cat]);
    });

    prevDataRef.current = { ...data.traits };
  }, [data, size, interactive, onTraitClick]);

  return (
    <div className="relative inline-block">
      <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} />
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-card border border-border rounded-lg p-3 shadow-xl max-w-[220px]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <div className="text-xs font-mono mb-1" style={{ color: CATEGORY_COLORS[tooltip.trait.category] }}>
            {CATEGORY_LABELS[tooltip.trait.category]}
          </div>
          <div className="font-heading font-semibold text-sm text-foreground">{tooltip.trait.name}</div>
          <div className="text-2xl font-heading font-bold text-foreground mt-1">{Math.round(tooltip.value)}</div>
          <div className="text-xs text-muted-foreground mt-1">{tooltip.trait.definition}</div>
          <div className="text-xs text-primary mt-1">💡 {tooltip.trait.tip}</div>
        </div>
      )}
    </div>
  );
};

export default GenomeWheel;

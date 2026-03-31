import React from 'react';
import { Insight } from '@/lib/genome-types';

interface InsightsPanelProps {
  insights: Insight[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  const severityStyles = {
    critical: 'border-confusion/40 bg-confusion/10',
    warning: 'border-fatigue/40 bg-fatigue/10',
    info: 'border-primary/40 bg-primary/10',
  };

  return (
    <div className="space-y-3">
      <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
        <span>💡</span> Real-Time Insights
      </h3>
      {insights.length === 0 && (
        <p className="text-xs text-muted-foreground">Start a session to see insights.</p>
      )}
      {insights.map((insight) => (
        <div
          key={insight.id}
          className={`border rounded-lg p-3 transition-all duration-300 ${severityStyles[insight.severity]}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">{insight.icon}</span>
            <div>
              <div className="text-xs font-heading font-semibold text-foreground">{insight.message}</div>
              <div className="text-xs text-muted-foreground mt-1">{insight.action}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InsightsPanel;

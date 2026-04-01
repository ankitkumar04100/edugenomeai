import React from 'react';
import { Insight } from '@/lib/genome-types';

interface InsightsPanelProps {
  insights: Insight[];
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  const severityStyles = {
    critical: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-primary/20 bg-primary/5',
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
          className={`border rounded-2xl p-3 transition-all duration-300 ${severityStyles[insight.severity]}`}
          role="status"
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

import React from 'react';

interface PrivacyStatusProps {
  cameraOn: boolean;
  metricsStreaming: boolean;
  faceConfidence?: number;
  wsConnected?: boolean;
}

const PrivacyStatus: React.FC<PrivacyStatusProps> = ({ cameraOn, metricsStreaming, faceConfidence, wsConnected }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-heading">
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${cameraOn ? 'bg-success/10 text-success' : 'bg-secondary text-muted-foreground'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cameraOn ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
        Camera: {cameraOn ? 'On' : 'Off'}
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-muted-foreground">
        Frames sent: Never
      </div>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${metricsStreaming ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
        Metrics: {metricsStreaming ? 'Streaming' : 'Off'}
      </div>
      {faceConfidence !== undefined && cameraOn && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${faceConfidence > 0.5 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
          Tracking: {faceConfidence > 0.5 ? 'Good' : 'Low quality'}
        </div>
      )}
      {wsConnected !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${wsConnected ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-success' : 'bg-warning'}`} />
          {wsConnected ? 'Real-time' : 'Polling'}
        </div>
      )}
    </div>
  );
};

export default PrivacyStatus;

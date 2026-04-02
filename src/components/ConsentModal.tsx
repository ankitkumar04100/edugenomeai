import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface ConsentModalProps {
  open: boolean;
  onAccept: (eyeTracking: boolean, dataProcessing: boolean) => void;
  onDecline: () => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ open, onAccept, onDecline }) => {
  const [eyeConsent, setEyeConsent] = useState(true);
  const [dataConsent, setDataConsent] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="card-premium p-6 max-w-md w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h2 className="font-heading text-xl font-bold text-foreground">🔒 Privacy & Consent</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Live Mode uses your camera to track eye movements. <strong>Video stays on your device</strong> — only derived numeric metrics are processed.
        </p>

        <div className="space-y-3 bg-secondary rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={eyeConsent} onChange={e => setEyeConsent(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4" />
            <div>
              <div className="text-sm font-heading font-semibold text-foreground">Eye Tracking</div>
              <div className="text-xs text-muted-foreground">Camera captures gaze direction, blink rate, and fixation patterns locally.</div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={dataConsent} onChange={e => setDataConsent(e.target.checked)}
              className="mt-0.5 accent-primary w-4 h-4" />
            <div>
              <div className="text-sm font-heading font-semibold text-foreground">Data Processing</div>
              <div className="text-xs text-muted-foreground">Behavioral metrics are stored to build your Learning Genome.</div>
            </div>
          </label>
        </div>

        <div className="bg-accent/10 border border-accent/30 rounded-xl p-3">
          <div className="text-xs text-foreground font-heading font-semibold mb-1">What we never do:</div>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li>• No video/audio recording or transmission</li>
            <li>• No raw camera frames stored</li>
            <li>• No facial recognition or biometric storage</li>
          </ul>
        </div>

        <Link to="/privacy" className="text-xs text-primary hover:underline font-heading block">
          Read full Privacy Policy →
        </Link>

        <div className="flex gap-3">
          <button onClick={() => onAccept(eyeConsent, dataConsent)}
            disabled={!eyeConsent}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            Accept & Enable Live Mode
          </button>
          <button onClick={onDecline}
            className="px-4 py-2.5 border border-border text-foreground rounded-xl text-sm font-heading font-semibold hover:bg-secondary transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;

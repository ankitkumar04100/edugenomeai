import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="container flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lg">🧬</span>
          <span className="font-heading font-bold text-foreground">EduGenome AI</span>
        </Link>
      </div>
    </header>
    <div className="container px-4 py-12 max-w-3xl space-y-8">
      <h1 className="font-heading text-3xl font-bold text-foreground">Privacy Policy</h1>
      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Data Collection</h2>
          <p>EduGenome AI uses your device's webcam to capture eye-tracking data. <strong className="text-foreground">No video frames or audio are ever stored or transmitted.</strong> All webcam processing happens locally in your browser using Mediapipe FaceMesh/Iris.</p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">What We Store</h2>
          <p>Only derived behavioral metrics (numerical values) are transmitted to our backend for analysis. These include: blink rate, fixation duration, gaze variance, response times, and interaction scores. No personally identifiable biometric data is stored.</p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Consent</h2>
          <p>Camera access requires explicit user consent. You can revoke camera permission at any time through your browser settings. The app gracefully falls back to Demo Mode without camera access.</p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Data Rights</h2>
          <p>You have the right to export or delete all your data at any time. We comply with GDPR and applicable data protection regulations.</p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Security</h2>
          <p>All API communications use TLS encryption. Session data is protected with JWT authentication and role-based access control.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;

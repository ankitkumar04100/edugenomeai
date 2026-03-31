import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <span className="text-2xl">🧬</span>
          <span className="font-heading font-bold text-xl text-foreground">EduGenome AI</span>
        </Link>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-heading text-xl font-bold text-foreground text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          <div>
            <label className="text-xs text-muted-foreground font-heading block mb-1">Email</label>
            <input type="email" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-heading block mb-1">Password</label>
            <input type="password" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="••••••••" />
          </div>

          {isSignUp && (
            <div>
              <label className="text-xs text-muted-foreground font-heading block mb-1">Role</label>
              <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                {(['student', 'teacher', 'admin'] as const).map(r => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-heading font-medium capitalize transition-all ${role === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSignUp && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" className="mt-0.5" />
              <span>I consent to eye-tracking data collection for learning analysis. No video is stored — only derived metrics.</span>
            </label>
          )}

          <Link to={role === 'teacher' ? '/teacher' : '/student'}
            className="block w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-heading font-semibold text-center hover:opacity-90 transition-opacity">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Link>

          <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-xs text-primary hover:underline font-heading text-center">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;

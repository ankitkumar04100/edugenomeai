import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, user, role: currentRole } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && currentRole) {
      navigate(currentRole === 'admin' ? '/admin' : currentRole === 'teacher' ? '/teacher' : '/student');
    }
  }, [user, currentRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    if (isSignUp && !consent) { toast.error('Please accept the consent'); return; }
    
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, role, displayName);
        if (error) { toast.error(error.message); return; }
        toast.success('Account created! Check your email to verify.');
      } else {
        const { error } = await signIn(email, password);
        if (error) { toast.error(error.message); return; }
        toast.success('Signed in successfully');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error instanceof Error ? result.error.message : 'Google sign-in failed');
        return;
      }
      if (result.redirected) return;
      toast.success('Signed in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <span className="text-2xl">🧬</span>
          <span className="font-heading font-bold text-xl text-foreground">EduGenome AI</span>
        </Link>

        <form onSubmit={handleSubmit} className="card-premium p-6 space-y-4">
          <h2 className="font-heading text-xl font-bold text-foreground text-center">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {/* Google Sign In */}
          <button type="button" onClick={handleGoogleSignIn} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-xl text-sm font-heading font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/></svg>
            Continue with Google
          </button>

          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="px-3 text-xs text-muted-foreground font-heading">or</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {isSignUp && (
            <div>
              <label className="text-xs text-muted-foreground font-heading block mb-1">Display Name</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Your name" />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground font-heading block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-heading block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="••••••••" />
          </div>

          {isSignUp && (
            <div>
              <label className="text-xs text-muted-foreground font-heading block mb-1">Role</label>
              <div className="flex gap-1 bg-secondary rounded-xl p-0.5">
                {(['student', 'teacher', 'admin'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-heading font-medium capitalize transition-all ${role === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSignUp && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-primary" />
              <span>I consent to eye-tracking data collection for learning analysis. No video is stored — only derived metrics.</span>
            </label>
          )}

          <button type="submit" disabled={loading}
            className="block w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-heading font-semibold text-center hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-xs text-primary hover:underline font-heading text-center">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;

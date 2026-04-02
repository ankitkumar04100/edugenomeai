import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate(role === 'teacher' ? '/teacher' : role === 'admin' ? '/admin' : '/student');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    if (isSignUp && !consent) { toast.error('Please accept the consent'); return; }
    
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, role, displayName);
        if (error) { toast.error(error.message); return; }
        toast.success('Account created! You are now signed in.');
      } else {
        const { error } = await signIn(email, password);
        if (error) { toast.error(error.message); return; }
        toast.success('Signed in successfully');
      }
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

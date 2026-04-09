import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import NotificationBell from '@/components/NotificationBell';
import AIChatBot from '@/components/AIChatBot';

const adminNavItems = [
  { label: 'Admin Console', path: '/admin' },
  { label: 'Home', path: '/' },
  { label: 'Student', path: '/student' },
  { label: 'Teacher', path: '/teacher' },
  { label: 'Practice', path: '/practice' },
  { label: 'Replay', path: '/replay' },
  { label: 'Docs', path: '/docs' },
  { label: 'Privacy', path: '/privacy' },
];

const teacherNavItems = [
  { label: 'Teacher', path: '/teacher' },
  { label: 'Home', path: '/' },
  { label: 'Practice', path: '/practice' },
  { label: 'Replay', path: '/replay' },
  { label: 'Docs', path: '/docs' },
  { label: 'Privacy', path: '/privacy' },
];

const studentNavItems = [
  { label: 'Student', path: '/student' },
  { label: 'Home', path: '/' },
  { label: 'Practice', path: '/practice' },
  { label: 'Replay', path: '/replay' },
  { label: 'Docs', path: '/docs' },
  { label: 'Privacy', path: '/privacy' },
];

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, signOut, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show shell on auth page or if not authenticated
  const isAuthPage = location.pathname === '/auth';
  if (isAuthPage || loading) {
    return <>{children}</>;
  }

  const navItems = role === 'admin' ? adminNavItems : role === 'teacher' ? teacherNavItems : studentNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg">🧬</span>
              <span className="font-heading font-bold text-foreground">EduGenome AI</span>
            </Link>
            {user && (
              <nav className="hidden md:flex items-center gap-1 ml-4">
                {navItems.map(item => {
                  const isActive = location.pathname === item.path || 
                    (item.path === '/admin' && location.pathname.startsWith('/admin'));
                  return (
                    <Link key={item.path} to={item.path}
                      className={`px-3 py-1.5 rounded-lg text-xs font-heading font-medium transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user && <NotificationBell />}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-heading hidden sm:inline">
                  {role && <span className="capitalize px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold mr-1">{role}</span>}
                </span>
                <button onClick={handleSignOut}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-heading transition-colors">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/auth" className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-heading font-semibold hover:opacity-90 transition-opacity">
                Sign In
              </Link>
            )}
          </div>
        </div>
        {/* Mobile nav */}
        {user && (
          <div className="md:hidden border-t border-border overflow-x-auto">
            <div className="flex items-center gap-1 px-4 py-1.5">
              {navItems.map(item => {
                const isActive = location.pathname === item.path ||
                  (item.path === '/admin' && location.pathname.startsWith('/admin'));
                return (
                  <Link key={item.path} to={item.path}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-medium whitespace-nowrap transition-colors ${
                      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                    }`}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      {user && <AIChatBot />}
    </div>
  );
};

export default AppShell;

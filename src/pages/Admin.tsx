import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Users, Shield, FileText, Brain, Webhook, Activity, ClipboardList, BookOpen, Download, CheckCircle } from 'lucide-react';

const cards = [
  { title: 'Organizations', desc: 'Manage multi-tenant orgs, members, and org settings', icon: Building2, path: '/admin/organizations', color: 'text-blue-600 bg-blue-50' },
  { title: 'Users & Roles', desc: 'Manage users, assign roles, view membership', icon: Users, path: '/admin/users', color: 'text-purple-600 bg-purple-50' },
  { title: 'Permissions (RBAC)', desc: 'Fine-grained access control matrix with overrides', icon: Shield, path: '/admin/permissions', color: 'text-green-600 bg-green-50' },
  { title: 'Policies & Privacy', desc: 'Data retention, consent, privacy controls', icon: FileText, path: '/admin/policies', color: 'text-amber-600 bg-amber-50' },
  { title: 'Model Governance', desc: 'Trait engine mode, model registry, drift monitoring', icon: Brain, path: '/admin/models', color: 'text-pink-600 bg-pink-50' },
  { title: 'Integrations', desc: 'Webhooks, API keys, external connections', icon: Webhook, path: '/admin/integrations', color: 'text-indigo-600 bg-indigo-50' },
  { title: 'Monitoring', desc: 'System health, latency, errors, session counts', icon: Activity, path: '/admin/monitoring', color: 'text-teal-600 bg-teal-50' },
  { title: 'Audit Logs', desc: 'Track all sensitive actions with before/after diffs', icon: ClipboardList, path: '/admin/audit', color: 'text-red-600 bg-red-50' },
  { title: 'Content Manager', desc: 'Question bank CRUD, hints, assets, publish control', icon: BookOpen, path: '/admin/content', color: 'text-cyan-600 bg-cyan-50' },
  { title: 'Exports & Jobs', desc: 'PDF exports, webhook retries, job queue status', icon: Download, path: '/admin/jobs', color: 'text-orange-600 bg-orange-50' },
  { title: 'System Verification', desc: 'No-skip checklist: routes, tables, determinism, features', icon: CheckCircle, path: '/admin/verification', color: 'text-emerald-600 bg-emerald-50' },
];

const Admin: React.FC = () => {
  const { role } = useAuth();

  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔒</div>
          <h1 className="font-heading text-xl font-bold text-foreground">Admin Access Required</h1>
          <p className="text-sm text-muted-foreground">You don't have permission to access this page.</p>
          <Link to="/" className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-heading font-semibold">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">🏢 Admin Command Center</h1>
        <p className="text-muted-foreground text-sm mt-1">Enterprise controls for EduGenome AI platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <Link key={card.path} to={card.path} className="card-premium p-5 hover-lift group transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">{card.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Admin;

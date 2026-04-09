
-- ============================================
-- 1. ORGANIZATIONS
-- ============================================
CREATE TABLE public.orgs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_in_org text NOT NULL DEFAULT 'student' CHECK (role_in_org IN ('admin','teacher','student')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.org_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE UNIQUE,
  retention_days integer NOT NULL DEFAULT 365,
  allow_live_mode boolean NOT NULL DEFAULT true,
  allow_voice boolean NOT NULL DEFAULT true,
  allow_heatmap boolean NOT NULL DEFAULT true,
  transcript_storage_default boolean NOT NULL DEFAULT false,
  thresholds_json jsonb NOT NULL DEFAULT '{"confusion_spike":70,"fatigue_high":65}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- Helper: check if user belongs to org
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.org_members WHERE org_id = _org_id AND user_id = auth.uid()) $$;

-- Helper: check if user is org admin
CREATE OR REPLACE FUNCTION public.is_org_admin(_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.org_members WHERE org_id = _org_id AND user_id = auth.uid() AND role_in_org = 'admin') $$;

-- Orgs RLS
CREATE POLICY "Members see own orgs" ON public.orgs FOR SELECT USING (public.is_org_member(id) OR public.is_admin());
CREATE POLICY "Admins create orgs" ON public.orgs FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Org admins update org" ON public.orgs FOR UPDATE USING (public.is_org_admin(id) OR public.is_admin());
CREATE POLICY "Platform admins delete orgs" ON public.orgs FOR DELETE USING (public.is_admin());

-- Org members RLS
CREATE POLICY "Members see org members" ON public.org_members FOR SELECT USING (public.is_org_member(org_id) OR public.is_admin());
CREATE POLICY "Org admins manage members" ON public.org_members FOR INSERT WITH CHECK (public.is_org_admin(org_id) OR public.is_admin());
CREATE POLICY "Org admins update members" ON public.org_members FOR UPDATE USING (public.is_org_admin(org_id) OR public.is_admin());
CREATE POLICY "Org admins remove members" ON public.org_members FOR DELETE USING (public.is_org_admin(org_id) OR public.is_admin());

-- Org settings RLS
CREATE POLICY "Members view org settings" ON public.org_settings FOR SELECT USING (public.is_org_member(org_id) OR public.is_admin());
CREATE POLICY "Org admins manage settings" ON public.org_settings FOR INSERT WITH CHECK (public.is_org_admin(org_id) OR public.is_admin());
CREATE POLICY "Org admins update settings" ON public.org_settings FOR UPDATE USING (public.is_org_admin(org_id) OR public.is_admin());

-- ============================================
-- 2. RBAC PERMISSIONS
-- ============================================
CREATE TABLE public.permissions (
  key text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read permissions" ON public.permissions FOR SELECT USING (true);

INSERT INTO public.permissions (key, description) VALUES
  ('manage_org', 'Create and configure organizations'),
  ('manage_users', 'Add, remove, and manage users'),
  ('manage_roles', 'Assign and change user roles'),
  ('view_all_students', 'View all student data in organization'),
  ('view_replays', 'Access session replay recordings'),
  ('export_student_data', 'Export student data and reports'),
  ('manage_content_bank', 'Create and edit question bank content'),
  ('manage_integrations', 'Configure webhooks and API keys'),
  ('manage_models', 'Configure AI model settings'),
  ('view_audit_logs', 'View organization audit logs'),
  ('view_monitoring', 'View system monitoring dashboard');

CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  allowed boolean NOT NULL DEFAULT true,
  UNIQUE(role, permission_key)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read role permissions" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Admins manage role permissions" ON public.role_permissions FOR ALL USING (public.is_admin());

-- Seed default role permissions
INSERT INTO public.role_permissions (role, permission_key, allowed) VALUES
  ('admin', 'manage_org', true), ('admin', 'manage_users', true), ('admin', 'manage_roles', true),
  ('admin', 'view_all_students', true), ('admin', 'view_replays', true), ('admin', 'export_student_data', true),
  ('admin', 'manage_content_bank', true), ('admin', 'manage_integrations', true), ('admin', 'manage_models', true),
  ('admin', 'view_audit_logs', true), ('admin', 'view_monitoring', true),
  ('teacher', 'view_all_students', true), ('teacher', 'view_replays', true), ('teacher', 'export_student_data', true),
  ('teacher', 'manage_content_bank', true),
  ('student', 'view_replays', false);

CREATE TABLE public.user_permissions_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  allowed boolean NOT NULL,
  UNIQUE(user_id, permission_key)
);
ALTER TABLE public.user_permissions_override ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own overrides" ON public.user_permissions_override FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage overrides" ON public.user_permissions_override FOR ALL USING (public.is_admin());

-- Permission check function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT allowed FROM public.user_permissions_override WHERE user_id = _user_id AND permission_key = _permission),
    (SELECT allowed FROM public.role_permissions rp JOIN public.user_roles ur ON ur.role::text = rp.role WHERE ur.user_id = _user_id AND rp.permission_key = _permission LIMIT 1),
    false
  )
$$;

-- ============================================
-- 3. AUDIT LOGS
-- ============================================
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  before_json jsonb,
  after_json jsonb,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin() OR (org_id IS NOT NULL AND public.is_org_admin(org_id)));
CREATE POLICY "System inserts audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = actor_user_id);

CREATE INDEX idx_audit_logs_org ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- ============================================
-- 4. WEBHOOKS + API KEYS
-- ============================================
CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  events_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org admins manage webhooks" ON public.webhooks FOR ALL USING (public.is_org_admin(org_id) OR public.is_admin());

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  hashed_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked boolean NOT NULL DEFAULT false
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org admins manage api keys" ON public.api_keys FOR ALL USING (public.is_org_admin(org_id) OR public.is_admin());

-- ============================================
-- 5. NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);

-- ============================================
-- 6. CONTENT MANAGER (QUESTION BANK)
-- ============================================
CREATE TABLE public.question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  title text NOT NULL,
  stem text NOT NULL,
  type text NOT NULL DEFAULT 'mcq',
  difficulty integer NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  subject text,
  topic text,
  tags_json jsonb DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read published questions" ON public.question_bank FOR SELECT USING (published OR public.is_admin() OR public.has_permission(auth.uid(), 'manage_content_bank'));
CREATE POLICY "Content managers manage questions" ON public.question_bank FOR INSERT WITH CHECK (public.has_permission(auth.uid(), 'manage_content_bank') OR public.is_admin());
CREATE POLICY "Content managers update questions" ON public.question_bank FOR UPDATE USING (public.has_permission(auth.uid(), 'manage_content_bank') OR public.is_admin());
CREATE POLICY "Content managers delete questions" ON public.question_bank FOR DELETE USING (public.has_permission(auth.uid(), 'manage_content_bank') OR public.is_admin());

CREATE TABLE public.question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  options_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL
);
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read with question" ON public.question_options FOR SELECT USING (true);
CREATE POLICY "Manage with permission" ON public.question_options FOR ALL USING (public.has_permission(auth.uid(), 'manage_content_bank') OR public.is_admin());

CREATE TABLE public.question_hints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  hint_type text NOT NULL DEFAULT 'text' CHECK (hint_type IN ('text','visual','audio')),
  content text NOT NULL,
  asset_url text
);
ALTER TABLE public.question_hints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read with question" ON public.question_hints FOR SELECT USING (true);
CREATE POLICY "Manage with permission" ON public.question_hints FOR ALL USING (public.has_permission(auth.uid(), 'manage_content_bank') OR public.is_admin());

CREATE TABLE public.question_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  url text NOT NULL
);
ALTER TABLE public.question_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read with question" ON public.question_assets FOR SELECT USING (true);
CREATE POLICY "Manage with permission" ON public.question_assets FOR ALL USING (public.has_permission(auth.uid(), 'manage_content_bank') OR public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_question_bank_updated_at BEFORE UPDATE ON public.question_bank FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 7. JOBS & MONITORING
-- ============================================
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  payload_json jsonb,
  result_json jsonb,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage jobs" ON public.jobs FOR ALL USING (public.is_admin() OR (org_id IS NOT NULL AND public.is_org_admin(org_id)));

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.system_metrics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  date date NOT NULL,
  metrics_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(org_id, date)
);
ALTER TABLE public.system_metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read metrics" ON public.system_metrics_daily FOR SELECT USING (public.is_admin() OR (org_id IS NOT NULL AND public.is_org_admin(org_id)));
CREATE POLICY "System inserts metrics" ON public.system_metrics_daily FOR INSERT WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- Role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  eye_tracking_consent BOOLEAN NOT NULL DEFAULT false,
  data_processing_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Class students
CREATE TABLE public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, student_id)
);

-- Sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'demo' CHECK (mode IN ('demo', 'live')),
  persona TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  overall_score NUMERIC,
  avg_confusion NUMERIC,
  avg_fatigue NUMERIC
);

-- Metrics batches
CREATE TABLE public.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  timestamp_ms BIGINT NOT NULL,
  data JSONB NOT NULL
);

-- Genome snapshots
CREATE TABLE public.genome_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  timestamp_ms BIGINT NOT NULL,
  traits JSONB NOT NULL,
  categories JSONB NOT NULL,
  indices JSONB NOT NULL,
  overall_score NUMERIC NOT NULL
);

-- Session events
CREATE TABLE public.session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  timestamp_ms BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'
);

-- Exports
CREATE TABLE public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_metrics_session ON public.metrics(session_id);
CREATE INDEX idx_snapshots_session ON public.genome_snapshots(session_id);
CREATE INDEX idx_events_session ON public.session_events(session_id);
CREATE INDEX idx_sessions_user ON public.sessions(user_id);
CREATE INDEX idx_class_students_class ON public.class_students(class_id);
CREATE INDEX idx_class_students_student ON public.class_students(student_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genome_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- Security definer helper: check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Convenience helpers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'admin') $$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.has_role(auth.uid(), 'teacher') $$;

-- Check if user can access a session (owner, teacher of class, or admin)
CREATE OR REPLACE FUNCTION public.can_access_session(_session_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = _session_id
    AND (
      s.user_id = auth.uid()
      OR public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.class_students cs
        JOIN public.classes c ON c.id = cs.class_id
        WHERE cs.student_id = s.user_id AND c.teacher_id = auth.uid()
      )
    )
  )
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Teachers read class student profiles" ON public.profiles FOR SELECT
  USING (
    public.is_teacher() AND EXISTS (
      SELECT 1 FROM public.class_students cs
      JOIN public.classes c ON c.id = cs.class_id
      WHERE cs.student_id = profiles.id AND c.teacher_id = auth.uid()
    )
  );

-- RLS: user_roles
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Only admins manage roles" ON public.user_roles FOR ALL
  USING (public.is_admin());

-- RLS: classes
CREATE POLICY "Teachers manage own classes" ON public.classes FOR ALL
  USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students see joined classes" ON public.classes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.class_students cs WHERE cs.class_id = classes.id AND cs.student_id = auth.uid()
  ));

-- RLS: class_students
CREATE POLICY "Teachers manage class membership" ON public.class_students FOR ALL
  USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.classes c WHERE c.id = class_students.class_id AND c.teacher_id = auth.uid()
    )
  );
CREATE POLICY "Students see own membership" ON public.class_students FOR SELECT
  USING (student_id = auth.uid());

-- RLS: sessions
CREATE POLICY "Users manage own sessions" ON public.sessions FOR ALL
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Teachers view class student sessions" ON public.sessions FOR SELECT
  USING (
    public.is_teacher() AND EXISTS (
      SELECT 1 FROM public.class_students cs
      JOIN public.classes c ON c.id = cs.class_id
      WHERE cs.student_id = sessions.user_id AND c.teacher_id = auth.uid()
    )
  );

-- RLS: metrics, snapshots, events (via session access)
CREATE POLICY "Access via session" ON public.metrics FOR ALL
  USING (public.can_access_session(session_id));
CREATE POLICY "Access via session" ON public.genome_snapshots FOR ALL
  USING (public.can_access_session(session_id));
CREATE POLICY "Access via session" ON public.session_events FOR ALL
  USING (public.can_access_session(session_id));

-- RLS: exports
CREATE POLICY "Users manage own exports" ON public.exports FOR ALL
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Teachers view class student exports" ON public.exports FOR SELECT
  USING (
    public.is_teacher() AND EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.class_students cs ON cs.student_id = s.user_id
      JOIN public.classes c ON c.id = cs.class_id
      WHERE s.id = exports.session_id AND c.teacher_id = auth.uid()
    )
  );

-- Storage bucket for exports
INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);

CREATE POLICY "Users access own exports" ON storage.objects FOR SELECT
  USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users upload own exports" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

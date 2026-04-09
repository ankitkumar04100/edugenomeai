
-- Fix notifications INSERT policy - only authenticated users
DROP POLICY "System inserts notifications" ON public.notifications;
CREATE POLICY "Authenticated users insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Fix system_metrics_daily INSERT policy - only admins
DROP POLICY "System inserts metrics" ON public.system_metrics_daily;
CREATE POLICY "Admins insert metrics" ON public.system_metrics_daily FOR INSERT WITH CHECK (public.is_admin() OR (org_id IS NOT NULL AND public.is_org_admin(org_id)));

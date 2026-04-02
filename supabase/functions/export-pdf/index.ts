import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: authError } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = claims.claims.sub;
    const { session_id } = await req.json();

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch session
    const { data: session } = await supabase.from("sessions").select("*").eq("id", session_id).single();
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch latest genome snapshot
    const { data: snapshots } = await supabase
      .from("genome_snapshots")
      .select("*")
      .eq("session_id", session_id)
      .order("timestamp_ms", { ascending: false })
      .limit(1);

    const latestSnapshot = snapshots?.[0] || null;

    // Fetch events
    const { data: events } = await supabase
      .from("session_events")
      .select("*")
      .eq("session_id", session_id)
      .order("timestamp_ms", { ascending: true });

    // Build text-based PDF summary (HTML → could be rendered by client)
    const traits = (latestSnapshot?.traits as Record<string, number>) || {};
    const indices = (latestSnapshot?.indices as Record<string, number>) || {};
    const categories = (latestSnapshot?.categories as Record<string, number>) || {};

    const sortedTraits = Object.entries(traits).sort(([, a], [, b]) => (b as number) - (a as number));
    const strengths = sortedTraits.slice(0, 5);
    const weaknesses = sortedTraits.slice(-5).reverse();

    const confusionSpikes = (events || []).filter((e: any) => e.event_type === "confusion_spike").length;
    const fatigueAlerts = (events || []).filter((e: any) => e.event_type === "fatigue_alert").length;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>EduGenome AI — Session Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0F172A; padding: 40px; max-width: 800px; margin: auto; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1F6FEB; padding-bottom: 20px; }
    .header h1 { font-size: 24px; color: #1F6FEB; }
    .header p { color: #6B7280; font-size: 12px; margin-top: 4px; }
    .section { margin: 20px 0; }
    .section h2 { font-size: 16px; color: #1F6FEB; margin-bottom: 10px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .stat { background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; }
    .stat .label { font-size: 11px; color: #6B7280; }
    .stat .value { font-size: 20px; font-weight: 700; }
    .trait-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
    .trait-name { color: #374151; }
    .trait-score { font-weight: 600; }
    .footer { margin-top: 30px; text-align: center; color: #9CA3AF; font-size: 10px; }
    .cognitive { color: #3B82F6; }
    .behavioral { color: #A855F7; }
    .learning_style { color: #10B981; }
    .performance { color: #F97316; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧬 EduGenome AI — Session Report</h1>
    <p>Session: ${session_id.slice(0, 8)} | Mode: ${session.mode} | Date: ${new Date(session.started_at).toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>Overall Scores</h2>
    <div class="grid">
      <div class="stat"><div class="label">Genome Score</div><div class="value">${Math.round(latestSnapshot?.overall_score || 0)}</div></div>
      <div class="stat"><div class="label">Confusion Index</div><div class="value" style="color: ${(indices.confusion_index || 0) > 70 ? '#EF4444' : '#0F172A'}">${Math.round(indices.confusion_index || 0)}</div></div>
      <div class="stat"><div class="label">Fatigue Index</div><div class="value" style="color: ${(indices.fatigue_index || 0) > 65 ? '#F59E0B' : '#0F172A'}">${Math.round(indices.fatigue_index || 0)}</div></div>
      <div class="stat"><div class="label">Events</div><div class="value">${confusionSpikes} spikes, ${fatigueAlerts} alerts</div></div>
    </div>
  </div>

  <div class="section">
    <h2>Category Averages</h2>
    <div class="grid">
      ${Object.entries(categories).map(([cat, val]) => `
        <div class="stat"><div class="label ${cat}">${cat.replace('_', ' ')}</div><div class="value ${cat}">${Math.round(val as number)}</div></div>
      `).join('')}
    </div>
  </div>

  <div class="section">
    <h2>Top 5 Strengths</h2>
    ${strengths.map(([name, val]) => `<div class="trait-row"><span class="trait-name">${name.replace(/_/g, ' ')}</span><span class="trait-score">${Math.round(val as number)}</span></div>`).join('')}
  </div>

  <div class="section">
    <h2>Top 5 Areas for Improvement</h2>
    ${weaknesses.map(([name, val]) => `<div class="trait-row"><span class="trait-name">${name.replace(/_/g, ' ')}</span><span class="trait-score">${Math.round(val as number)}</span></div>`).join('')}
  </div>

  <div class="footer">
    <p>Generated by EduGenome AI | Privacy: No webcam frames stored. Only derived metrics used.</p>
    <p>${new Date().toISOString()}</p>
  </div>
</body>
</html>`;

    // Save export record
    await supabase.from("exports").insert({
      session_id,
      user_id: userId,
      file_path: `exports/${userId}/${session_id}.html`,
    });

    return new Response(JSON.stringify({ html, session_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

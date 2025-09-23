// Deno Edge Function: generate-insights
// Trigger: Database Webhook on report_metrics INSERT/UPDATE where status='ready'
// Calls OpenAI (OPENAI_API_KEY) with metrics context and updates reports.ai_insights + status

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Metrics = {
  report_id: string;
  totals: any;
  variances?: any;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing Supabase envs");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const payload = await req.json().catch(() => ({}));
    const record: Metrics | null = payload?.record ?? null;
    if (!record) return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

    const prompt = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise business advisor for fuel stations. Return JSON only: { insights: string[], actions: string[] }" },
        { role: "user", content: `Context: ${JSON.stringify(record.totals)}. Provide 3-7 insights and 3-7 action items.` }
      ],
      temperature: 0.2
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(prompt)
    });
    if (!resp.ok) throw new Error(`OpenAI error ${resp.status}`);
    const json = await resp.json();
    let insights: any = null;
    try { insights = JSON.parse(json?.choices?.[0]?.message?.content || "{}"); } catch { insights = { insights: [], actions: [] }; }

    const { error: upErr } = await supabase
      .from("reports")
      .update({ ai_insights: insights, status: "ready" })
      .eq("id", record.report_id);
    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});



// Deno Edge Function: calculate-metrics
// Trigger: Database Webhook on report_extracted INSERT/UPDATE where status='ready'
// Computes totals/variances and writes report_metrics

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Extracted = {
  report_id: string;
  raw: any;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function safeNumber(v: any): number { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function computeTotals(raw: any) {
  const fuels = raw?.fuels || {};
  const keys = ["diesel_ex", "vpower_95", "vpower_diesel"] as const;
  let revenue = 0, liters = 0;
  for (const k of keys) {
    revenue += safeNumber(fuels?.[k]?.total_revenue_zar);
    liters  += safeNumber(fuels?.[k]?.quantity_liters);
  }
  const shopRevenue = Array.isArray(raw?.shop_lines) ? raw.shop_lines.reduce((s: number, l: any) => s + safeNumber(l?.total_revenue_zar), 0) : 0;
  const totalRevenue = revenue + shopRevenue;
  const shopFuelRatio = liters > 0 ? shopRevenue / liters : 0;
  return { totalRevenue, totalVolume: liters, shopRevenue, shopFuelRatio };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing Supabase envs");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const payload = await req.json().catch(() => ({}));
    const record: Extracted | null = payload?.record ?? null;
    if (!record) return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

    const raw = record.raw || {};
    const totals = computeTotals(raw);
    const variances = {};

    const { error: insErr } = await supabase
      .from("report_metrics")
      .insert({ report_id: record.report_id, totals, variances, status: "ready" });
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});



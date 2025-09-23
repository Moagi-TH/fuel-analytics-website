// Deno Edge Function: process-report-upload
// Trigger: Database Webhook on storage.objects INSERT
// Derives user_id from path uploads/{userId}/... and seeds pipeline rows

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type StorageRow = {
  id: string;
  bucket_id: string;
  name: string; // path within bucket
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
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing Supabase envs");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const body = await req.json().catch(() => ({}));
    const record: StorageRow | null = body?.record ?? null;
    if (!record || record.bucket_id !== "reports") {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const path = record.name || ""; // uploads/{userId}/{ts}-file.pdf
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 2 || parts[0] !== "uploads") throw new Error("Unexpected path structure");
    const userId = parts[1];

    // Create reports row
    const { data: report, error: repErr } = await supabase
      .from("reports")
      .insert({ user_id: userId, storage_path: path, status: "processing" })
      .select("id")
      .single();
    if (repErr) throw repErr;

    // Seed extracted row with minimal structure to unblock UI Review Stage
    const minimal = { fuels: { diesel_ex: {}, vpower_95: {}, vpower_diesel: {} }, shop_lines: [] };
    const { error: exErr } = await supabase
      .from("report_extracted")
      .insert({ report_id: report.id, raw: minimal, status: "processing" });
    if (exErr) throw exErr;

    return new Response(JSON.stringify({ ok: true, report_id: report.id }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});



// supabase/functions/analyze-storage-report/index.ts
// Deno Edge Function
// Purpose: Fetch a PDF report from Supabase Storage bucket `fuel-reports`,
//          extract structured metrics using Gemini, compute KPIs, and return
//          a UI-friendly payload plus advisory tips.
// Route: POST /analyze-storage-report
// Body (either provide path or let it pick latest):
//   {
//     path?: string,            // e.g. "2025-09/report-aug.pdf" (inside bucket root)
//     fuel_prices?: {           // optional: compute margins if provided
//       diesel_ex?: { cost_price_per_liter: number; selling_price_per_liter: number },
//       vpower_95?: { cost_price_per_liter: number; selling_price_per_liter: number },
//       vpower_diesel?: { cost_price_per_liter: number; selling_price_per_liter: number }
//     }
//   }
//
// Required secrets (set in Supabase → Edge Functions → Secrets):
//   - OPENAI_API_KEY
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type FuelKey = "diesel_ex" | "vpower_95" | "vpower_diesel";

type RequestBody = {
  path?: string;
  fuel_prices?: Partial<Record<FuelKey, {
    cost_price_per_liter: number;
    selling_price_per_liter: number;
  }>>;
};

const BUCKET = "fuel-reports";
const ALLOW_ORIGIN = "*"; // adjust in production
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function hasFuelKeys(obj: any): boolean {
  return obj && obj.fuels && ["diesel_ex", "vpower_95", "vpower_diesel"].every((k) => k in obj.fuels);
}

function normalizeCategories(shopLines: any[]) {
  const excluded = ["Airtime", "Cosmetics", ""];
  return (Array.isArray(shopLines) ? shopLines : [])
    .filter((l) => !excluded.includes(l.category))
    .map((l) => ({ ...l, category: l.category === "Deli Onsite" ? "Deli onsite prepared" : l.category }));
}

function computeFuelMetrics(fuelKey: FuelKey, fuelData: any, fuelPrices: RequestBody['fuel_prices']) {
  const price = fuelPrices?.[fuelKey];
  if (!price || !fuelData || typeof fuelData.total_revenue_zar !== 'number') {
    return { margin_percent: null, profit_zar: null };
  }
  const denom = price.selling_price_per_liter || 1;
  const marginPercent = ((price.selling_price_per_liter - price.cost_price_per_liter) / denom) * 100;
  const profitZar = fuelData.total_revenue_zar * (marginPercent / 100);
  return { margin_percent: marginPercent, profit_zar: profitZar };
}

function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  // deno-lint-ignore no-deprecated-deno-api
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const body = (await req.json()) as RequestBody | null;
    const requestedPath = body?.path?.trim();
    const fuelPrices = body?.fuel_prices ?? {};

    // Determine which file to analyze
    let objectPath: string | null = requestedPath || null;
    if (!objectPath) {
      // List latest file in the bucket root
      const { data: files, error: listErr } = await supabase.storage.from(BUCKET).list('', {
        limit: 100,
        sortBy: { column: 'updated_at', order: 'desc' }
      } as any);
      if (listErr) {
        return new Response(JSON.stringify({ error: "Failed to list storage files", details: listErr.message }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (!files || files.length === 0) {
        return new Response(JSON.stringify({ error: "No files found in fuel-reports bucket" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      // Pick the first (most recently updated if sortBy supported). Fallback to last element.
      objectPath = files[0]?.name || files[files.length - 1].name;
    }

    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(objectPath);
    if (dlErr || !blob) {
      return new Response(JSON.stringify({ error: "Failed to download file", details: dlErr?.message, path: objectPath }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const buffer = await blob.arrayBuffer();
    const base64Data = bufferToBase64(buffer);

    // Prompt to enforce JSON with advice
    const instruction = `
You are a strict JSON extraction and analysis engine for South African fuel station Period Reports.
You will receive a PDF as binary data. Extract metrics and return ONE JSON object only.

Shape:
{
  "period": { "month": number, "year": number },
  "fuels": {
    "diesel_ex": { "total_revenue_zar": number, "quantity_liters": number, "margin_percent": number|null, "profit_zar": number|null },
    "vpower_95": { "total_revenue_zar": number, "quantity_liters": number, "margin_percent": number|null, "profit_zar": number|null },
    "vpower_diesel": { "total_revenue_zar": number, "quantity_liters": number, "margin_percent": number|null, "profit_zar": number|null }
  },
  "shop_lines": [ { "category": string, "total_revenue_zar": number, "quantity_units": number } ],
  "forecast": {
    "method": string,
    "assumptions": string,
    "fuels": {
      "diesel_ex": { "total_revenue_zar": number, "quantity_liters": number },
      "vpower_95": { "total_revenue_zar": number, "quantity_liters": number },
      "vpower_diesel": { "total_revenue_zar": number, "quantity_liters": number }
    },
    "shop_lines": [ { "category": string, "quantity_units": number, "total_revenue_zar": number } ]
  },
  "notes": string,
  "advice": [ string, ... ]
}

Rules:
- Totals are gross revenue (ZAR). Fuel quantity in liters; shop quantity in units.
- Always include the three fuels; if missing, use 0 and note it.
- Normalize "Deli Onsite" → "Deli onsite prepared"; exclude Airtime, Cosmetics, and blank categories.
- If the request includes fuel_prices, do NOT invent margins in extraction; the server computes them after.
- Provide 3–7 concise, practical improvement suggestions in "advice" tailored to the numbers.
- If uncertain for any numeric, use 0 and explain briefly in notes.
`.trim();

    const userPayload: Record<string, unknown> = {};
    if (body?.fuel_prices) userPayload.fuel_prices = body.fuel_prices;

    // Call Gemini with inline PDF data
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(OPENAI_API_KEY)}`;
    const genReq = {
      generationConfig: { temperature: 0.1, response_mime_type: "application/json" },
      contents: [
        {
          role: "user",
          parts: [
            { text: `${instruction}\n\nRequest context: ${JSON.stringify(userPayload)}` },
            { inline_data: { mime_type: "application/pdf", data: base64Data } }
          ]
        }
      ]
    };

    const aiResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(genReq)
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      return new Response(JSON.stringify({ error: "Gemini request failed", details: txt }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const aiJson = await aiResp.json();
    const textOut: string | undefined =
      aiJson?.candidates?.[0]?.content?.parts?.[0]?.text ??
      aiJson?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;

    if (!textOut) {
      return new Response(JSON.stringify({ error: "No content from Gemini", raw: aiJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let data: any;
    try {
      data = JSON.parse(textOut);
    } catch {
      return new Response(JSON.stringify({ error: "Gemini did not return valid JSON", raw: textOut }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!hasFuelKeys(data)) {
      return new Response(JSON.stringify({ error: "Missing required fuel keys", raw: data }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Ensure margin fields exist & compute margins using provided prices
    (['diesel_ex','vpower_95','vpower_diesel'] as FuelKey[]).forEach((k) => {
      const f = data.fuels?.[k] ?? { total_revenue_zar: 0, quantity_liters: 0 };
      if (!("margin_percent" in f)) f.margin_percent = null;
      if (!("profit_zar" in f)) f.profit_zar = null;
      const m = computeFuelMetrics(k, f, fuelPrices);
      f.margin_percent = m.margin_percent;
      f.profit_zar = m.profit_zar;
      data.fuels[k] = f;
    });

    // Normalize shop lines
    data.shop_lines = normalizeCategories(data.shop_lines);

    // Derive UI-aligned summary & KPIs
    try {
      const keys: FuelKey[] = ['diesel_ex','vpower_95','vpower_diesel'];
      const totals = keys.reduce((acc, k) => {
        const f = data.fuels?.[k] || { total_revenue_zar: 0, quantity_liters: 0, profit_zar: 0 };
        acc.revenue += Number(f.total_revenue_zar) || 0;
        acc.liters += Number(f.quantity_liters) || 0;
        acc.profit += Number(f.profit_zar) || 0;
        return acc;
      }, { revenue: 0, liters: 0, profit: 0 });

      const shopRevenue = Array.isArray(data.shop_lines)
        ? data.shop_lines.reduce((s: number, l: any) => s + (Number(l.total_revenue_zar) || 0), 0)
        : 0;

      const totalRevenue = totals.revenue + shopRevenue;
      const totalProfitApprox = totals.profit;
      const totalVolume = totals.liters;
      const shopFuelRatio = totalVolume > 0 ? shopRevenue / totalVolume : 0;

      data.ui_metrics = {
        total_revenue: totalRevenue,
        total_profit: totalProfitApprox,
        total_volume: totalVolume,
        shop_fuel_ratio: shopFuelRatio,
        fuel_margin: totals.profit,
        shop_profit: null,
        changes: { revenue_change: null, profit_change: null, volume_change: null, margin_change: null },
        kpis: {
          revenue_growth_rate: null,
          shop_profit_margin: null,
          fuel_margins_rand: totals.profit,
          shop_fuel_ratio_kpi: shopFuelRatio
        }
      };

      data.summary = `Revenue R${totalRevenue.toFixed(0)}, Volume ${totalVolume.toFixed(0)} L, Shop/L R${shopFuelRatio.toFixed(2)}.`;
    } catch (_e) {}

    return new Response(JSON.stringify({
      source: { bucket: BUCKET, path: objectPath },
      ...data
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});



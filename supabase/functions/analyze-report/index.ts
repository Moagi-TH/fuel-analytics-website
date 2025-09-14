// supabase/functions/analyze-report/index.ts
// Deno (Supabase Edge Functions)
// Route: POST /analyze-report
// Body: { text: string, fuel_prices?: { diesel_ex?: {cost_price_per_liter:number, selling_price_per_liter:number}, vpower_95?: {...}, vpower_diesel?: {...} } }

import OpenAI from "npm:openai@4.47.1";

type FuelKey = "diesel_ex" | "vpower_95" | "vpower_diesel";

type RequestBody = {
  text: string;
  fuel_prices?: Partial<Record<FuelKey, {
    cost_price_per_liter: number;
    selling_price_per_liter: number;
  }>>;
};

// --- CORS ---
const ALLOW_ORIGIN = "*"; // change to your domain(s) in production
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// --- JSON schema to enforce strict model output ---
const jsonSchema = {
  name: "analyzed_period_report",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["period", "fuels", "shop_lines", "forecast"],
    properties: {
      period: {
        type: "object",
        required: ["month", "year"],
        properties: {
          month: { type: "integer", minimum: 1, maximum: 12 },
          year: { type: "integer", minimum: 2000 }
        },
        additionalProperties: false
      },
      fuels: {
        type: "object",
        required: ["diesel_ex", "vpower_95", "vpower_diesel"],
        properties: {
          diesel_ex: {
            type: "object",
            required: ["total_revenue_zar", "quantity_liters"],
            properties: {
              total_revenue_zar: { type: "number", minimum: 0 },
              quantity_liters: { type: "number", minimum: 0 },
              margin_percent: { type: ["number", "null"] },
              profit_zar: { type: ["number", "null"] }
            },
            additionalProperties: false
          },
          vpower_95: {
            type: "object",
            required: ["total_revenue_zar", "quantity_liters"],
            properties: {
              total_revenue_zar: { type: "number", minimum: 0 },
              quantity_liters: { type: "number", minimum: 0 },
              margin_percent: { type: ["number", "null"] },
              profit_zar: { type: ["number", "null"] }
            },
            additionalProperties: false
          },
          vpower_diesel: {
            type: "object",
            required: ["total_revenue_zar", "quantity_liters"],
            properties: {
              total_revenue_zar: { type: "number", minimum: 0 },
              quantity_liters: { type: "number", minimum: 0 },
              margin_percent: { type: ["number", "null"] },
              profit_zar: { type: ["number", "null"] }
            },
            additionalProperties: false
          }
        },
        additionalProperties: false
      },
      shop_lines: {
        type: "array",
        items: {
          type: "object",
          required: ["category", "total_revenue_zar", "quantity_units"],
          properties: {
            category: { type: "string" },
            total_revenue_zar: { type: "number", minimum: 0 },
            quantity_units: { type: "number", minimum: 0 }
          },
          additionalProperties: false
        }
      },
      forecast: {
        type: "object",
        required: ["method", "fuels", "shop_lines"],
        properties: {
          method: { type: "string" },
          assumptions: { type: "string" },
          fuels: {
            type: "object",
            required: ["diesel_ex", "vpower_95", "vpower_diesel"],
            properties: {
              diesel_ex: {
                type: "object",
                required: ["total_revenue_zar", "quantity_liters"],
                properties: {
                  total_revenue_zar: { type: "number", minimum: 0 },
                  quantity_liters: { type: "number", minimum: 0 }
                },
                additionalProperties: false
              },
              vpower_95: {
                type: "object",
                required: ["total_revenue_zar", "quantity_liters"],
                properties: {
                  total_revenue_zar: { type: "number", minimum: 0 },
                  quantity_liters: { type: "number", minimum: 0 }
                },
                additionalProperties: false
              },
              vpower_diesel: {
                type: "object",
                required: ["total_revenue_zar", "quantity_liters"],
                properties: {
                  total_revenue_zar: { type: "number", minimum: 0 },
                  quantity_liters: { type: "number", minimum: 0 }
                },
                additionalProperties: false
              }
            },
            additionalProperties: false
          },
          shop_lines: {
            type: "array",
            items: {
              type: "object",
              required: ["category", "quantity_units", "total_revenue_zar"],
              properties: {
                category: { type: "string" },
                quantity_units: { type: "number", minimum: 0 },
                total_revenue_zar: { type: "number", minimum: 0 }
              },
              additionalProperties: false
            }
          }
        },
        additionalProperties: false
      },
      notes: { type: "string" }
    }
  },
  strict: true
} as const;

// --- Minimal guard to ensure model returned required fuels keys ---
function hasFuelKeys(obj: any): boolean {
  return obj && obj.fuels && ["diesel_ex", "vpower_95", "vpower_diesel"].every((k) => k in obj.fuels);
}

// Normalize category names and filter out unwanted categories
function normalizeCategories(shopLines: any[]) {
  const excludedCategories = ['Airtime', 'Cosmetics', ''];
  return shopLines
    .filter(line => !excludedCategories.includes(line.category))
    .map(line => ({
      ...line,
      category: line.category === 'Deli Onsite' ? 'Deli onsite prepared' : line.category
    }));
}

// Compute fuel margin and profit if prices are provided
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

Deno.serve(async (req) => {
  // OPTIONS preflight
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

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body?.text || typeof body.text !== "string") {
      return new Response(JSON.stringify({ error: "Body must include { text: string }" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate optional fuel_prices shape (light validation)
    const fuelPrices = body.fuel_prices ?? {};
    for (const key of Object.keys(fuelPrices)) {
      // @ts-ignore
      const fp = fuelPrices[key];
      if (!fp) continue;
      for (const fld of ["cost_price_per_liter", "selling_price_per_liter"]) {
        if (typeof fp[fld] !== "number" || !isFinite(fp[fld])) {
          return new Response(JSON.stringify({ error: `fuel_prices.${key}.${fld} must be a number` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      }
    }

    // Build system prompt with all rules
    const systemPrompt = `
You are a strict JSON extraction and structuring engine for South African fuel station Period Reports.
Output MUST follow the provided json_schema exactly. Do not include fields not in the schema.

Parsing rules:
- Totals = gross revenue (ZAR) from the report text.
- Fuel quantity = liters; Shop quantity = units.
- Ignore any profitability/margin fields in the PDF; DO NOT copy them.
- Always return three fuels: Diesel Ex, V-Power 95, V-Power Diesel (use 0 when not found).
- "Deli Onsite" should be normalized/mapped to "Deli onsite prepared".
- Exclude Airtime, Cosmetics, and any categories with blank/zero values from shop_lines.
- Promotions/discounts should be considered part of sales, not separate line items.
- If uncertain for any numeric, set it to 0 and add a brief explanation in "notes".

Manual fuel pricing:
- If the request includes a "fuel_prices" object with cost & selling price per liter for each fuel, calculate:
  margin_percent = ((selling_price_per_liter - cost_price_per_liter) / selling_price_per_liter) * 100
  profit_zar = total_revenue_zar * (margin_percent/100)
- If no prices are provided for a fuel, set margin_percent and profit_zar to null for that fuel.

Forecasting:
- Provide a simple forward-looking forecast with a short "method" string and optional "assumptions".
- If there is insufficient evidence of trend, use a conservative "flat-carry" assumption (repeat last-period level).

JSON Schema Requirements:
- period: { month: number (1-12), year: number (>=2000) }
- fuels: { diesel_ex, vpower_95, vpower_diesel } each with { total_revenue_zar: number, quantity_liters: number, margin_percent: number|null, profit_zar: number|null }
- shop_lines: array of { category: string, total_revenue_zar: number, quantity_units: number }
- forecast: { method: string, assumptions: string, fuels: { same structure as above }, shop_lines: array }
- notes: string
    `.trim();

    // Compose user content with text + optional fuel prices
    const userPayload: any = {
      text: body.text,
    };
    if (body.fuel_prices) {
      userPayload.fuel_prices = body.fuel_prices;
    }

    const openai = new OpenAI({ apiKey });

    // Call OpenAI API (updated to use chat completions)
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify(userPayload)
        }
      ]
    });

    // Parse the response
    const responseText = chatCompletion.choices[0].message.content;
    const data = JSON.parse(responseText);

    if (!data || !hasFuelKeys(data)) {
      return new Response(JSON.stringify({ error: "Model did not return valid JSON", raw: responseText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Light runtime validation on required pieces
    const requiredFuelPaths: Array<[FuelKey, string]> = [
      ["diesel_ex", "fuels.diesel_ex"],
      ["vpower_95", "fuels.vpower_95"],
      ["vpower_diesel", "fuels.vpower_diesel"],
    ];

    for (const [key, label] of requiredFuelPaths) {
      const f = data.fuels[key];
      if (typeof f.total_revenue_zar !== "number" || typeof f.quantity_liters !== "number") {
        return new Response(JSON.stringify({ error: `Invalid number(s) at ${label}` }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      // Ensure margin fields exist (null if not provided)
      if (!("margin_percent" in f)) f.margin_percent = null;
      if (!("profit_zar" in f)) f.profit_zar = null;
    }

    // Compute fuel margins and profits if fuel prices are provided
    ['diesel_ex','vpower_95','vpower_diesel'].forEach((k) => {
      const m = computeFuelMetrics(k, data.fuels[k], fuelPrices);
      data.fuels[k].margin_percent = m.margin_percent;
      data.fuels[k].profit_zar = m.profit_zar;
    });

    // Normalize and filter shop lines
    if (Array.isArray(data.shop_lines)) {
      data.shop_lines = normalizeCategories(data.shop_lines);
    } else {
      data.shop_lines = [];
    }

    // --- Derive UI-aligned metrics and optional KPIs for the dashboard ---
    try {
      const fuelKeys: FuelKey[] = ["diesel_ex", "vpower_95", "vpower_diesel"];
      const fuelTotals = fuelKeys.reduce(
        (acc, k) => {
          const f = data.fuels?.[k] || { total_revenue_zar: 0, quantity_liters: 0, profit_zar: 0 };
          acc.revenue += Number(f.total_revenue_zar) || 0;
          acc.liters += Number(f.quantity_liters) || 0;
          acc.profit += Number(f.profit_zar) || 0;
          return acc;
        },
        { revenue: 0, liters: 0, profit: 0 }
      );

      const shopRevenue = Array.isArray(data.shop_lines)
        ? data.shop_lines.reduce((s: number, l: any) => s + (Number(l.total_revenue_zar) || 0), 0)
        : 0;

      const totalRevenue = fuelTotals.revenue + shopRevenue;
      const totalProfitApprox = fuelTotals.profit; // shop profit unknown → keep optional/null elsewhere
      const totalVolume = fuelTotals.liters;
      const shopFuelRatio = totalVolume > 0 ? shopRevenue / totalVolume : 0;

      // Optional KPI placeholders (can be refined when historic data is available)
      const revenueGrowthRate: number | null = null;
      const shopProfitMargin: number | null = null;
      const fuelMarginsRand: number = fuelTotals.profit;
      const shopFuelRatioKpi: number = shopFuelRatio;

      // Changes (month-over-month) not computable here without history → nulls
      const changes = {
        revenue_change: null as number | null,
        profit_change: null as number | null,
        volume_change: null as number | null,
        margin_change: null as number | null,
      };

      // Attach a UI-friendly block
      // Numbers are raw; format on the client (currency/percent)
      data.ui_metrics = {
        total_revenue: totalRevenue,
        total_profit: totalProfitApprox,
        total_volume: totalVolume,
        shop_fuel_ratio: shopFuelRatio,
        fuel_margin: fuelTotals.profit,
        shop_profit: null as number | null,
        changes,
        kpis: {
          revenue_growth_rate: revenueGrowthRate,
          shop_profit_margin: shopProfitMargin,
          fuel_margins_rand: fuelMarginsRand,
          shop_fuel_ratio_kpi: shopFuelRatioKpi,
        },
      };

      // Short textual summary for quick UI badges
      data.summary = `Revenue R${totalRevenue.toFixed(0)}, Volume ${totalVolume.toFixed(0)} L, Shop/L R${shopFuelRatio.toFixed(2)}.`;
    } catch (_) {
      // Non-fatal; keep core payload
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});



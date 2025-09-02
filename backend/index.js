import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const HAS_OPENAI = !!process.env.OPENAI_API_KEY;
const openai = HAS_OPENAI ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/analyze-report', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    // 1) Extract text from PDF
    let text = '';
    try {
      const pdfData = await pdfParse(req.file.buffer);
      text = String(pdfData.text || '').slice(0, 200000); // cap length
    } catch (e) {
      console.warn('pdf-parse failed, proceeding with empty text:', e?.message);
      text = '';
    }

    // 2) Ask OpenAI to extract JSON per schema
    const system = `You are extracting structured business data from a monthly fuel business report. Rules:
    - Interpret all “Total” values as GROSS REVENUE in ZAR.
    - For fuel line items, quantity is LITRES.
    - For shop line items, quantity is UNITS.
    - Ignore any PROFIT/MARGIN fields printed in the PDF. Do not use them.
    - Required fuel sections: Diesel Ex, V-Power 95, V-Power Diesel (return all three even if zero).
    - Map “Deli Onsite” to a shop line item (category: “Deli Onsite”).
    - If value cannot be confidently read, set 0 and add a brief note in "notes".
    Return STRICT JSON matching schema exactly with numeric values only.`;

    const schema = {
      type: 'object',
      properties: {
        period: {
          type: 'object',
          properties: { month: { type: 'integer' }, year: { type: 'integer' } },
          required: ['month', 'year']
        },
        fuels: {
          type: 'object',
          properties: {
            diesel_ex: { type: 'object', properties: { total_revenue_zar: { type: 'number' }, quantity_liters: { type: 'number' } }, required: ['total_revenue_zar', 'quantity_liters'] },
            vpower_95: { type: 'object', properties: { total_revenue_zar: { type: 'number' }, quantity_liters: { type: 'number' } }, required: ['total_revenue_zar', 'quantity_liters'] },
            vpower_diesel: { type: 'object', properties: { total_revenue_zar: { type: 'number' }, quantity_liters: { type: 'number' } }, required: ['total_revenue_zar', 'quantity_liters'] }
          },
          required: ['diesel_ex', 'vpower_95', 'vpower_diesel']
        },
        shop_lines: {
          type: 'array',
          items: { type: 'object', properties: { category: { type: 'string' }, total_revenue_zar: { type: 'number' }, quantity_units: { type: 'number' } }, required: ['category', 'total_revenue_zar', 'quantity_units'] }
        },
        forecast: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            assumptions: { type: 'string' },
            fuels: {
              type: 'object',
              properties: {
                diesel_ex: { type: 'object', properties: { quantity_liters: { type: 'number' }, total_revenue_zar: { type: 'number' } } },
                vpower_95: { type: 'object', properties: { quantity_liters: { type: 'number' }, total_revenue_zar: { type: 'number' } } },
                vpower_diesel: { type: 'object', properties: { quantity_liters: { type: 'number' }, total_revenue_zar: { type: 'number' } } }
              },
              required: ['diesel_ex', 'vpower_95', 'vpower_diesel']
            },
            shop_lines: {
              type: 'array',
              items: { type: 'object', properties: { category: { type: 'string' }, quantity_units: { type: 'number' }, total_revenue_zar: { type: 'number' } }, required: ['category', 'quantity_units', 'total_revenue_zar'] }
            }
          },
          required: ['method', 'fuels', 'shop_lines']
        },
        notes: { type: 'string' }
      },
      required: ['period', 'fuels', 'shop_lines'],
      additionalProperties: false
    };

    const user = `PDF text (truncated if very long):\n\n${text}\n\nReturn JSON only.`;

    let parsed = null;

    if (HAS_OPENAI) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          response_format: { type: 'json_schema', json_schema: { name: 'fuel_report', schema } },
          temperature: 0.1
        });
        const content = response.choices?.[0]?.message?.content;
        try { parsed = JSON.parse(content); } catch { parsed = null; }
      } catch (modelErr) {
        console.warn('OpenAI call failed, using fallback:', modelErr?.message);
      }
    }

    // Fallback if model unavailable or invalid JSON
    if (!parsed) {
      // Extract month/year from filename if possible
      const name = req.file?.originalname || '';
      const m = name.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|([0-9]{1,2})\s+(\d{4})/i);
      const now = new Date();
      const fallback = {
        period: { month: now.getMonth() + 1, year: now.getFullYear() },
        fuels: {
          diesel_ex: { total_revenue_zar: 0, quantity_liters: 0 },
          vpower_95: { total_revenue_zar: 0, quantity_liters: 0 },
          vpower_diesel: { total_revenue_zar: 0, quantity_liters: 0 }
        },
        shop_lines: [
          { category: 'Deli Onsite', total_revenue_zar: 0, quantity_units: 0 }
        ],
        forecast: {
          method: 'na',
          assumptions: 'fallback',
          fuels: {
            diesel_ex: { quantity_liters: 0, total_revenue_zar: 0 },
            vpower_95: { quantity_liters: 0, total_revenue_zar: 0 },
            vpower_diesel: { quantity_liters: 0, total_revenue_zar: 0 }
          },
          shop_lines: [
            { category: 'Deli Onsite', quantity_units: 0, total_revenue_zar: 0 }
          ]
        },
        notes: HAS_OPENAI ? 'Model failed, using safe fallback' : 'No OPENAI_API_KEY, using safe fallback'
      };
      parsed = fallback;
    }

    // Normalize typo safeguards
    if (parsed?.fuels?.vpower_diesel && parsed.fuels.vpower_diesel.quantity_lers !== undefined) {
      parsed.fuels.vpower_diesel.quantity_liters = parsed.fuels.vpower_diesel.quantity_lers;
      delete parsed.fuels.vpower_diesel.quantity_lers;
    }

    return res.json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error', message: err?.message || String(err) });
  }
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));



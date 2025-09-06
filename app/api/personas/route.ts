import { NextRequest, NextResponse } from "next/server";
import { getModel, getOpenAI } from "@/lib/openai";

type Persona = {
  mini_description: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: 'male' | 'female';
  city: string;
  country: string;
  profession: string;
  income_level: string;
  education_level: string;
  marital_status: string;
  children: number;
  values: string[];
  lifestyle: string;
  bio: string;
};

type CreateBody = {
  count?: number; // default 1; used by front to create 5
  seed?: string; // free-text description to guide population generation
  hints?: {
    locale?: string;
    theme?: string; // e.g., "movies", "tech", "travel"
    constraints?: string[];
  };
};

const SYSTEM_INSTRUCTIONS = `
You are a marketing persona generator. Return ONLY valid JSON.
Strict constraints:
- Use realistic, diverse first/last names.
- city and country must be real locations.
- age: between 18 and 75.
- gender: 'male' or 'female' only.
- profession: realistic job.
- income_level: "Low", "Medium", "High", or "Very high".
- education_level: "No diploma", "High school", "Associate", "Bachelor", "Master+".
- marital_status: "single", "married", "divorced", "widowed".
- children: number of children (0-5).
- values: 2-3 important personal values.
- lifestyle: one sentence about lifestyle.
- mini_description: ≤ 160 characters (short tagline style).
- bio: 2–5 natural biography sentences.
- No sensitive info, no real identifiers.
`;

const PERSONA_SCHEMA_PROMPT = `
Expected JSON schema:
{
  "mini_description": string,
  "first_name": string,
  "last_name": string,
  "age": number,
  "gender": "male" | "female",
  "city": string,
  "country": string,
  "profession": string,
  "income_level": string,
  "education_level": string,
  "marital_status": string,
  "children": number,
  "values": string[],
  "lifestyle": string,
  "bio": string
}
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as CreateBody;
    const count = Math.max(1, Math.min(20, Number(body.count ?? 1)));
    const hints = body.hints;

    const openai = getOpenAI();
    const model = getModel();

    const hintText = `Context:\n- Locale: ${hints?.locale ?? "en"}\n- Theme: ${hints?.theme ?? "general"}\n- Constraints: ${(hints?.constraints ?? []).join(", ") || "none"}\n- Freeform description: ${body.seed ? body.seed : ""}`;

    const tasks = Array.from({ length: count }, async () => {
      const completion = await openai.responses.create({
        model,
        input: [
          { role: "system", content: SYSTEM_INSTRUCTIONS },
          {
            role: "user",
            content: `${PERSONA_SCHEMA_PROMPT}\n\n${hintText}\n\nProduce a single persona in strict JSON.`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "persona",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                mini_description: { type: "string", description: "Short tagline (≤160c)" },
                first_name: { type: "string" },
                last_name: { type: "string" },
                age: { type: "number", minimum: 18, maximum: 75 },
                gender: { type: "string", enum: ["male", "female"] },
                city: { type: "string" },
                country: { type: "string" },
                profession: { type: "string" },
                income_level: { type: "string" },
                education_level: { type: "string" },
                marital_status: { type: "string" },
                children: { type: "number", minimum: 0, maximum: 5 },
                values: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
                lifestyle: { type: "string" },
                bio: { type: "string" },
              },
              required: [
                "mini_description",
                "first_name",
                "last_name",
                "age",
                "gender",
                "city",
                "country",
                "profession",
                "income_level",
                "education_level",
                "marital_status",
                "children",
                "values",
                "lifestyle",
                "bio",
              ],
            },
          },
        },
      });

      const raw = (completion as any).output_text ?? "{}";
      let parsed: Persona;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Rare. Return a structured empty fallback
        parsed = {
          mini_description: "",
          first_name: "",
          last_name: "",
          age: 30,
          gender: "male",
          city: "",
          country: "USA",
          profession: "",
          income_level: "Medium",
          education_level: "Bachelor",
          marital_status: "single",
          children: 0,
          values: [],
          lifestyle: "",
          bio: "",
        };
      }
      // Normalisation douce
      parsed.age = Number(parsed.age) || 30;
      parsed.children = Number(parsed.children) || 0;
      if (!parsed.country) parsed.country = "USA";
      return parsed;
    });

    const personas = await Promise.all(tasks);
    return NextResponse.json({ personas }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

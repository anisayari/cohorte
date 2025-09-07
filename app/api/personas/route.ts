import { NextRequest, NextResponse } from "next/server";
import { getModel, getOpenAI } from "@/lib/openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

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

// GPT-5 optimized system prompt (succinct, prescriptive, single-shot array output)
const SYSTEM_INSTRUCTIONS = `
You are a precise marketing persona generator.

Output rules:
- Return ONLY JSON that matches the provided JSON Schema.
- Do not include markdown, comments, or additional text.
- Produce all personas in one shot, as an array, with diverse, realistic entries.

Content constraints per persona:
- Use realistic, locale-appropriate first and last names.
- city and country must be real locations; keep country names in English.
- age: integer 18–75; children: integer 0–5.
- gender: "male" or "female" only.
- profession: realistic job.
- income_level: one of "Low", "Medium", "High", "Very high".
- education_level: one of "No diploma", "High school", "Associate", "Bachelor", "Master+".
- marital_status: one of "single", "married", "divorced", "widowed".
- values: 2–3 personal values.
- lifestyle: one sentence.
- mini_description: ≤160 characters, tagline style.
- bio: 2–5 natural sentences.
- No sensitive or identifiable data.

Agentic guidance:
- Reason efficiently; avoid over-exploration.
- If unsure, choose the most reasonable assumption and continue — do not ask questions.
`;

const PERSONA_SCHEMA_PROMPT = `
Return an array of persona objects. Ensure meaningful diversity across age ranges, cities, professions, and values.
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as CreateBody;
    const count = Math.max(1, Math.min(20, Number(body.count ?? 1)));
    const hints = body.hints;

    const openai = getOpenAI();
    const model = getModel();

    const hintText = `Context:\n- Locale: ${hints?.locale ?? "en"}\n- Theme: ${hints?.theme ?? "general"}\n- Constraints: ${(hints?.constraints ?? []).join(", ") || "none"}\n- Freeform description: ${body.seed ? body.seed : ""}`;

    // Define Zod schemas dynamically to enforce exact count
    const PersonaZ = z.object({
      mini_description: z.string().max(160),
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      age: z.number().int().min(18).max(75),
      gender: z.enum(["male", "female"]),
      city: z.string().min(1),
      country: z.string().min(2),
      profession: z.string().min(1),
      income_level: z.enum(["Low", "Medium", "High", "Very high"]),
      education_level: z.enum(["No diploma", "High school", "Associate", "Bachelor", "Master+"]),
      marital_status: z.enum(["single", "married", "divorced", "widowed"]),
      children: z.number().int().min(0).max(5),
      values: z.array(z.string()).min(2).max(3),
      lifestyle: z.string().min(1),
      bio: z.string().min(10),
    });

    const PersonasObjectZ = z.object({ personas: z.array(PersonaZ).length(count) });

    // Single-shot generation using Zod format/parse
    const completion = await openai.responses.parse({
      model,
      input: [
        { role: "system", content: SYSTEM_INSTRUCTIONS },
        {
          role: "user",
          content: `${PERSONA_SCHEMA_PROMPT}\n\n${hintText}\n\nOutput an object with key \"personas\" containing exactly ${count} personas. Ensure each is realistic and distinct.`,
        },
      ],
      text: { format: zodTextFormat(PersonasObjectZ, "personas_object") },
    });

    const parsedObj = (completion as any).output_parsed as z.infer<typeof PersonasObjectZ> | undefined;
    let parsed: Persona[] = Array.isArray(parsedObj?.personas) ? parsedObj!.personas : [];

    // Light normalization for UI stability
    const personas: Persona[] = (parsed || []).slice(0, count).map((p) => ({
      mini_description: (p?.mini_description ?? "").toString().slice(0, 200),
      first_name: (p?.first_name ?? "").toString(),
      last_name: (p?.last_name ?? "").toString(),
      age: Math.max(18, Math.min(75, Number(p?.age) || 30)),
      gender: p?.gender === "female" ? "female" : "male",
      city: (p?.city ?? "").toString(),
      country: (p?.country ?? "USA").toString(),
      profession: (p?.profession ?? "").toString(),
      income_level: (p?.income_level ?? "Medium").toString(),
      education_level: (p?.education_level ?? "Bachelor").toString(),
      marital_status: (p?.marital_status ?? "single").toString(),
      children: Math.max(0, Math.min(5, Number(p?.children) || 0)),
      values: Array.isArray(p?.values) ? p.values.slice(0, 3).map(String) : [],
      lifestyle: (p?.lifestyle ?? "").toString(),
      bio: (p?.bio ?? "").toString(),
    }));

    return NextResponse.json({ personas }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

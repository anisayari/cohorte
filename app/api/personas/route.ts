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
    theme?: string; // e.g., "cinéma", "tech", "voyage"
    constraints?: string[];
  };
};

const SYSTEM_INSTRUCTIONS = `
Tu es un générateur de personas marketing. Retourne UNIQUEMENT un JSON valide.
Contraintes strictes:
- Utilise des prénoms/nom réalistes et variés français.
- Ville: une vraie ville française.
- age: entre 18 et 75 ans.
- gender: 'male' ou 'female' uniquement.
- profession: métier réaliste.
- income_level: "Faible", "Moyen", "Élevé" ou "Très élevé".
- education_level: "Sans diplôme", "Bac", "Bac+2", "Bac+3/4", "Bac+5 ou plus".
- marital_status: "single", "married", "divorced", "widowed".
- children: nombre d'enfants (0-5).
- values: 2-3 valeurs importantes pour la personne.
- lifestyle: une phrase sur son style de vie.
- mini_description: ≤ 160 caractères (style courte tagline).
- bio: 2–5 phrases naturelles de biographie.
- Pas d'informations sensibles, pas d'identifiants réels.
`;

const PERSONA_SCHEMA_PROMPT = `
Schéma JSON attendu:
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

    const hintText = `Contexte:\n- Locale: ${hints?.locale ?? "fr"}\n- Thème: ${hints?.theme ?? "général"}\n- Contraintes: ${(hints?.constraints ?? []).join(", ") || "aucune"}\n- Description libre: ${body.seed ? body.seed : ""}`;

    const tasks = Array.from({ length: count }, async () => {
      const completion = await openai.responses.create({
        model,
        input: [
          { role: "system", content: SYSTEM_INSTRUCTIONS },
          {
            role: "user",
            content: `${PERSONA_SCHEMA_PROMPT}\n\n${hintText}\n\nProduit un seul persona en JSON strict.`,
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
                mini_description: { type: "string", description: "Tagline courte (≤160c)" },
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
        // Très rare si le modèle dévie; renvoie un fallback vide structuré
        parsed = {
          mini_description: "",
          first_name: "",
          last_name: "",
          age: 30,
          gender: "male",
          city: "",
          country: "France",
          profession: "",
          income_level: "Moyen",
          education_level: "Bac+3/4",
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
      if (!parsed.country) parsed.country = "France";
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

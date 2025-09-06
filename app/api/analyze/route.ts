import { NextRequest, NextResponse } from "next/server";
import { getModel, getOpenAI } from "@/lib/openai";
import { chunkText, TextChunk } from "@/lib/chunkText";

type Persona = {
  mini_description: string;
  first_name: string;
  last_name: string;
  city: string;
  salary_eur: number;
  biography: string;
};

type AnalyzeBody = {
  text: string;
  personas: Persona[];
};

type ChunkJudgment = {
  chunk_index: number;
  verdict: "true" | "false" | "uncertain";
  tone: "exciting" | "neutral" | "boring";
  sentiment_score: number; // 0-100 (higher = better liked)
  engagement_score: number; // 0-100 (higher = more engaging)
  confidence: number; // 0-1
  rationale: string;
};

type PersonaAnalysis = {
  persona_name: string;
  judgments: ChunkJudgment[];
};

const SYSTEM_ANALYST = `
Tu es un juge simulant la réaction d'une vraie personne décrite (le persona).
Respecte STRICTEMENT le format JSON demandé, sans texte additionnel.
Donne des évaluations brèves mais utiles. Sois cohérent et juste.
`;

const OUTPUT_SCHEMA_PROMPT = `
Réponds UNIQUEMENT avec un JSON suivant ce schéma:
{
  "persona_name": string, // "Prénom Nom" ou alias
  "judgments": [
    {
      "chunk_index": number,
      "verdict": "true" | "false" | "uncertain",
      "tone": "exciting" | "neutral" | "boring",
      "sentiment_score": number, // 0-100
      "engagement_score": number, // 0-100
      "confidence": number, // 0-1
      "rationale": string // 1-2 phrases max
    }
  ]
}
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeBody;
    const text = (body.text ?? "").toString();
    let personas = Array.isArray(body.personas) ? body.personas.slice(0, 10) : [];

    if (!text.trim()) {
      return NextResponse.json({ error: "text requis" }, { status: 400 });
    }

    // Chunk locally for stable highlighting on the client.
    const limitedText = text.slice(0, 8000); // soft cap
    const chunks: TextChunk[] = chunkText(limitedText);
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Impossible de chunker le texte fourni" },
        { status: 400 }
      );
    }

    // Fallback: if no personas provided, create a single neutral persona shell
    if (personas.length === 0) {
      personas = [
        {
          mini_description: "Lecteur neutre et curieux",
          first_name: "Alex",
          last_name: "Martin",
          city: "Paris",
          salary_eur: 45000,
          biography:
            "Alex aime apprendre et donner des retours honnêtes, en se concentrant sur la clarté et l'impact.",
        },
      ];
    }

    const openai = getOpenAI();
    const model = getModel();

    const tasks = personas.map(async (p) => {
      const personaName = `${p.first_name} ${p.last_name}`.trim();
      const personaCard = `PERSONA:\nNom: ${personaName}\nVille: ${p.city}\nSalaire (EUR): ${p.salary_eur}\nMini-description: ${p.mini_description}\nBio: ${p.biography}`;

      // Build a compact representation of chunks to evaluate.
      const items = chunks.map((c) => ({ index: c.index, text: c.text }));

      const completion = await openai.responses.create({
        model,
        input: [
          { role: "system", content: SYSTEM_ANALYST },
          {
            role: "system",
            content:
              `Parle comme le persona. Base ton jugement sur ses goûts et préférences implicites. Ne pas inventer de faits. Si incertain, utilise "uncertain".`,
          },
          { role: "user", content: personaCard },
          {
            role: "user",
            content:
              `${OUTPUT_SCHEMA_PROMPT}\n\nVoici la liste des chunks à évaluer (par index):\n${JSON.stringify(items)}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "persona_analysis",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                persona_name: { type: "string" },
                judgments: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      chunk_index: { type: "integer", minimum: 0 },
                      verdict: { type: "string", enum: ["true", "false", "uncertain"] },
                      tone: { type: "string", enum: ["exciting", "neutral", "boring"] },
                      sentiment_score: { type: "number", minimum: 0, maximum: 100 },
                      engagement_score: { type: "number", minimum: 0, maximum: 100 },
                      confidence: { type: "number", minimum: 0, maximum: 1 },
                      rationale: { type: "string" },
                    },
                    required: [
                      "chunk_index",
                      "verdict",
                      "tone",
                      "sentiment_score",
                      "engagement_score",
                      "confidence",
                      "rationale",
                    ],
                  },
                },
              },
              required: ["persona_name", "judgments"],
            },
          },
        },
      });

      const raw = (completion as any).output_text ?? "{}";
      let parsed: PersonaAnalysis = { persona_name: personaName, judgments: [] };
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Return empty structure on parse failure
      }
      // Coerce fields to the right types
      parsed.persona_name = parsed.persona_name || personaName;
      parsed.judgments = Array.isArray(parsed.judgments) ? parsed.judgments : [];
      parsed.judgments = parsed.judgments.map((j) => ({
        chunk_index: Number(j.chunk_index) || 0,
        verdict: (j.verdict === "true" || j.verdict === "false" || j.verdict === "uncertain")
          ? j.verdict
          : "uncertain",
        tone: (j.tone === "exciting" || j.tone === "neutral" || j.tone === "boring")
          ? j.tone
          : "neutral",
        sentiment_score: Math.max(0, Math.min(100, Number(j.sentiment_score) || 0)),
        engagement_score: Math.max(0, Math.min(100, Number(j.engagement_score) || 0)),
        confidence: Math.max(0, Math.min(1, Number(j.confidence) || 0)),
        rationale: (j.rationale ?? "").toString().slice(0, 500),
      }));
      return parsed;
    });

    const results = await Promise.all(tasks);
    return NextResponse.json(
      {
        chunks: chunks.map(({ index, start, end, text }) => ({ index, start, end, text })),
        analyses: results,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}

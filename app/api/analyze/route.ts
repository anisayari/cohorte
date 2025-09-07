import { NextRequest, NextResponse } from "next/server";
import { getModel, getOpenAI } from "@/lib/openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

type Persona = {
  mini_description?: string;
  first_name: string;
  last_name: string;
  city?: string;
  salary_eur?: number;
  biography?: string;
};

type AnalyzeBody = {
  text: string;
  personas: Persona[];
};

type IndexedLine = {
  line: number; // 1-based
  start: number; // offset in plain text
  end: number;   // exclusive
  text: string;
};

type PersonaLineAnnotation = {
  line: number; // 1-based, clamped server-side
  comment: string; // short, comment-style
  category: "praise" | "suggestion" | "issue" | "question";
  severity: "low" | "medium" | "high";
  reaction?: "like" | "dislike"; // optional quick reaction for this line
};

type PersonaAnalysis = {
  persona_name: string;
  overall: {
    comment: string; // short YouTube-style comment on the video
    liked: boolean;  // viewer would thumbs-up the video
  };
  annotations: PersonaLineAnnotation[];
};

const SYSTEM_ANALYST = `
You are simulating YouTube viewer comments from the given persona about a video.
Context: the USER will provide the script text for a YouTube video (spoken content). React like a real viewer leaving comments.

Style rules (very important):
- Write in the SAME language as the provided script.
- Sound like a YouTube comment: short, punchy, conversational, no dissertations.
- Prefer one-liners, occasional emoji ok 👍🔥 (but don't overdo it), no hashtags, no links, no disclaimers.
- Be polite and non-toxic; no personal attacks or unsafe content.
- Do NOT comment on grammar/spelling/typos/subtitles — this is spoken content. Focus ONLY on substance: clarity, hook, pacing, novelty, usefulness, credibility, entertainment, call-to-action.

Output rules:
- Return ONLY JSON matching the schema; no extra text or markdown.
- Use 1-based line numbers relative to the exact text provided.
- For overall.comment: a single short comment about the video as a whole (≤ 140 chars) and set liked=true/false.
- For annotations: comment (≤ 120 chars) aimed at that exact line (a reply to that moment). Use category (praise/suggestion/issue/question) and severity (low/medium/high). Optionally add reaction like/dislike for that line.
`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeBody;
    const text = (body.text ?? "").toString();
    let personas = Array.isArray(body.personas) ? body.personas.slice(0, 10) : [];

    if (!text.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // Build line index from provided text (keep exact newlines)
    const norm = text.replace(/\r\n|\r/g, "\n");
    const parts = norm.split("\n");
    const lines: IndexedLine[] = [];
    let offset = 0;
    for (let i = 0; i < parts.length; i++) {
      const t = parts[i];
      const start = offset;
      const end = start + t.length;
      lines.push({ line: i + 1, start, end, text: t });
      offset = end + 1; // +1 for the newline we split on
    }
    const lineCount = Math.max(1, lines.length);

    // Fallback: if no personas provided, create a single neutral persona shell
    if (personas.length === 0) {
      personas = [
        {
          mini_description: "Neutral and curious reader",
          first_name: "Alex",
          last_name: "Martin",
          city: "Paris",
          salary_eur: 45000,
          biography:
            "Alex enjoys learning and giving honest feedback, focusing on clarity and impact.",
        },
      ];
    }

    const openai = getOpenAI();
    const model = getModel();

    const AnnotationZ = z.object({
      line: z.number().int().min(1),
      comment: z.string().min(3).max(120),
      category: z.enum(["praise", "suggestion", "issue", "question"]),
      severity: z.enum(["low", "medium", "high"]),
      reaction: z.enum(["like", "dislike"]).optional(),
    });

    const OverallZ = z.object({
      comment: z.string().min(3).max(140),
      liked: z.boolean(),
    });

    const PersonaAnalysisZ = z.object({
      persona_name: z.string().min(1),
      overall: OverallZ,
      annotations: z.array(AnnotationZ).min(0).max(Math.min(50, lineCount)),
    });

    const tasks = personas.map(async (p) => {
      const personaName = `${p.first_name} ${p.last_name}`.trim();
      const personaCard = `PERSONA\nName: ${personaName}\nCity: ${p.city || "-"}\nMini-description: ${p.mini_description || "-"}\nBio: ${p.biography || "-"}`;

      const resp = await openai.responses.parse({
        model,
        input: [
          { role: "system", content: SYSTEM_ANALYST },
          { role: "user", content: personaCard },
          {
            role: "user",
            content:
              `Analyze the following text as this persona. Use 1-based line numbers.\n\nTEXT (with line breaks):\n---\n${norm}\n---`,
          },
        ],
        text: { format: zodTextFormat(PersonaAnalysisZ, "persona_line_analysis") },
      });

      const parsed = (resp as any).output_parsed as z.infer<typeof PersonaAnalysisZ> | undefined;
      let final: PersonaAnalysis = parsed
        ? (parsed as unknown as PersonaAnalysis)
        : {
            persona_name: personaName,
            overall: { comment: "", liked: false },
            annotations: [],
          };

      // Clamp lines to range and coerce
      final.persona_name = final.persona_name || personaName;
      final.annotations = Array.isArray(final.annotations) ? final.annotations : [];
      final.annotations = final.annotations.map((a) => ({
        line: Math.max(1, Math.min(lineCount, Number(a.line) || 1)),
        comment: (a.comment ?? "").toString().slice(0, 180),
        category: (a.category === "praise" || a.category === "suggestion" || a.category === "issue" || a.category === "question")
          ? a.category
          : "suggestion",
        severity: (a.severity === "low" || a.severity === "medium" || a.severity === "high")
          ? a.severity
          : "medium",
        reaction: (a as any).reaction === "like" || (a as any).reaction === "dislike" ? (a as any).reaction : undefined,
      }));
      // Trim excessive annotations
      if (final.annotations.length > 50) final.annotations = final.annotations.slice(0, 50);
      // Normalize overall
      final.overall = final.overall || { comment: "", liked: false } as any;
      final.overall.comment = (final.overall.comment ?? "").toString().slice(0, 140);
      if (typeof (final.overall as any).liked !== 'boolean') (final.overall as any).liked = false;

      return final;
    });

    const results = await Promise.all(tasks);
    return NextResponse.json(
      { lines: lines.map(({ line, start, end, text }) => ({ line, start, end, text })), analyses: results },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unexpected error" }, { status: 500 });
  }
}

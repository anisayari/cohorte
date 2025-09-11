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
You simulate sharp, realistic YouTube viewer reactions from the given persona.
The USER will provide the script text of a spoken video. React like a real viewer.

Style rules (critical):
- Write in the SAME language as the script.
- Be concise and direct. One sentence per annotation. No fluff.
- Sound like a YouTube comment: punchy, conversational, occasional emoji ok 👍🔥 (not too many), no hashtags/links/disclaimers.
 - Speak plainly and honestly; do not sugarcoat. If something is weak, say it.
 - Default stance is neutral. Use liked=true only for a clearly positive experience you'd recommend; if it's average or mixed, set liked=false.
- Ignore grammar/spelling/typos/subtitles. Focus ONLY on substance: clarity of message, hook, pacing, novelty, usefulness, credibility/facts, entertainment, CTA.

Critique focus:
- Prioritize concrete, actionable suggestions and issues over generic praise.
- Only add a fact-check marker if an objective, non-trivial claim could mislead or matters to the audience. Start the comment with a marker in the same language (e.g., "Vérifier:" in FR, "Fact-check:" in EN), use category=issue and severity=high. At most ONE fact-check per analysis.
- Ask specific questions when needed (category=question) that help the author improve or clarify.
- It is OK to skip lines that add nothing. Comment only on the most important parts; do NOT try to cover everything.
- Personas should bring their own angle; they do not all need to comment on the same lines.
 - If there are many lines, try to spread comments across early / middle / late parts to feel like real timestamps in a thread.

Output rules:
- Return ONLY JSON matching the schema; no extra text or markdown.
- Use 1-based line numbers relative to the exact text provided.
- All comments (overall and annotations) MUST be in the SAME language as the script; no code-switching.
- overall.comment: one short take about the whole video (≤ 140 chars) and set liked=true/false. Use liked=true when positives outweigh negatives for you; liked=false when you wouldn’t recommend it. For mixed content, decide based on your persona’s taste (not always false).
- annotations: short comments (≤ 120 chars) aimed at that exact line with category (praise/suggestion/issue/question) and severity (low/medium/high). Optionally add reaction like/dislike.
- Limit yourself to a handful of high-impact annotations rather than many low-value remarks.
 - Reactions are optional and sparse: use them on ≤20% of annotations. Use "dislike" only when also category=issue and severity=high; otherwise omit reaction or use "like" on a standout praise.
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
      // Structured outputs require required fields; allow null when absent
      reaction: z.enum(["like", "dislike"]).nullable(),
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

    // Determine a conservative cap of annotations per persona based on length
    const maxPerPersona = Math.min(8, Math.max(3, Math.ceil(lineCount / 12))); // 3–8 max

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
        // Make comments crisper; hard-cap to ~100 chars
        comment: (a.comment ?? "").toString().slice(0, 100),
        category: (a.category === "praise" || a.category === "suggestion" || a.category === "issue" || a.category === "question")
          ? a.category
          : "suggestion",
        severity: (a.severity === "low" || a.severity === "medium" || a.severity === "high")
          ? a.severity
          : "medium",
        reaction: (a as any).reaction === "like" || (a as any).reaction === "dislike" ? (a as any).reaction : undefined,
      }));
      // Deduplicate by line, prefer issues/suggestions and higher severity
      const catRank: Record<"praise"|"suggestion"|"issue"|"question", number> = {
        issue: 0,
        suggestion: 1,
        question: 2,
        praise: 3,
      } as const;
      const sevRank: Record<"low"|"medium"|"high", number> = { high: 0, medium: 1, low: 2 } as const;

      const byLine = new Map<number, PersonaLineAnnotation>();
      for (const a of final.annotations) {
        const prev = byLine.get(a.line);
        if (!prev) {
          byLine.set(a.line, a);
        } else {
          const better = (catRank[a.category] < catRank[prev.category]) ||
                        (catRank[a.category] === catRank[prev.category] && sevRank[a.severity] < sevRank[prev.severity]) ||
                        (catRank[a.category] === catRank[prev.category] && sevRank[a.severity] === sevRank[prev.severity] && a.comment.length < prev.comment.length);
          if (better) byLine.set(a.line, a);
        }
      }

      // Reorder by priority then by line number
      let uniq = Array.from(byLine.values());
      uniq.sort((a, b) => {
        const cr = catRank[a.category] - catRank[b.category];
        if (cr !== 0) return cr;
        const sr = sevRank[a.severity] - sevRank[b.severity];
        if (sr !== 0) return sr;
        return a.line - b.line;
      });

      // Keep only a handful of high‑impact notes
      if (uniq.length > maxPerPersona) uniq = uniq.slice(0, maxPerPersona);

      // Enforce realistic reaction usage: sparse overall, and 'dislike' only on high‑severity issues
      const maxReactions = Math.max(1, Math.floor(uniq.length * 0.2));
      let usedReactions = 0;
      uniq = uniq.map((a) => {
        let reaction = a.reaction;
        if (reaction === 'dislike' && !(a.category === 'issue' && a.severity === 'high')) {
          reaction = undefined;
        }
        if (reaction && usedReactions >= maxReactions) {
          reaction = undefined;
        }
        if (reaction) usedReactions++;
        return { ...a, reaction } as PersonaLineAnnotation;
      });

      // Limit 'Fact-check'/'Vérifier' markers to at most one, prefer the most severe issue
      const fcRegex = /^\s*(?:Fact[- ]?check|V[ée]rifier)\s*:/i;
      const fcIndices = uniq
        .map((a, i) => ({ i, a }))
        .filter(({ a }) => fcRegex.test(a.comment));
      if (fcIndices.length > 1) {
        // Choose the best one to keep: issue+high > issue+medium > first
        let keepIndex = fcIndices
          .filter(({ a }) => a.category === 'issue' && a.severity === 'high')
          .map(({ i }) => i)[0];
        if (keepIndex === undefined) {
          keepIndex = fcIndices
            .filter(({ a }) => a.category === 'issue' && a.severity === 'medium')
            .map(({ i }) => i)[0];
        }
        if (keepIndex === undefined) keepIndex = fcIndices[0].i;

        uniq = uniq.map((a, idx) => {
          if (idx === keepIndex) return a;
          if (fcRegex.test(a.comment)) {
            const stripped = a.comment.replace(fcRegex, '').trimStart();
            // Tone down minor fact-checks to questions
            const category = a.category === 'issue' && a.severity !== 'high' ? 'question' : a.category;
            return { ...a, comment: stripped || a.comment, category } as PersonaLineAnnotation;
          }
          return a;
        });
      }

      final.annotations = uniq;

      // Normalize overall
      final.overall = final.overall || { comment: "", liked: false } as any;
      final.overall.comment = (final.overall.comment ?? "").toString().slice(0, 140);
      if (typeof (final.overall as any).liked !== 'boolean') (final.overall as any).liked = false;

      // Balanced thumbs logic tuned for a realistic middle ground
      const count = (cat: 'praise'|'suggestion'|'issue'|'question', sev?: 'low'|'medium'|'high') =>
        final.annotations.filter(a => a.category === cat && (sev ? a.severity === sev : true)).length;
      const issuesHigh = count('issue','high');
      const issuesMed = count('issue','medium');
      const issuesLow = count('issue','low');
      const praises = count('praise');

      // Rule-based flips (suggestions ne comptent pas comme négatif dur)
      if (final.overall.liked === true) {
        // Basculer à false seulement s'il y a un vrai problème
        if (issuesHigh >= 1 || (issuesMed >= 3 && praises === 0) || (issuesMed >= 2 && issuesLow >= 2 && praises === 0)) {
          (final.overall as any).liked = false;
        }
      } else {
        // Basculer à true si c'est globalement correct
        if (issuesHigh === 0 && (praises >= 1 || issuesMed <= 1)) {
          (final.overall as any).liked = true;
        }
      }

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

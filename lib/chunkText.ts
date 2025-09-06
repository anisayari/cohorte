export type TextChunk = {
  index: number;
  start: number; // start offset in plain text
  end: number;   // end offset (exclusive)
  text: string;
};

/**
 * Naively splits text into sentence-like chunks and returns indices/offsets.
 * Keeps punctuation with each sentence. Handles simple French/English punctuation.
 */
export function chunkText(text: string, maxChunks = 200): TextChunk[] {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return [];

  // Split on sentence boundaries while keeping the delimiter
  const regex = /(.*?[^\s](?:[.!?…]+|$))/g; // greedy up to punctuation or end
  const parts: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(trimmed)) !== null) {
    const seg = match[1]?.trim();
    if (seg) parts.push(seg);
    if (parts.length >= maxChunks) break;
  }

  const chunks: TextChunk[] = [];
  let cursor = 0;
  parts.forEach((p, i) => {
    const start = trimmed.indexOf(p, cursor);
    const end = start + p.length;
    chunks.push({ index: i, start, end, text: p });
    cursor = end;
  });
  return chunks;
}


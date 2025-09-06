This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Personas & Analysis (New)

Two API routes and UI actions let you generate personas and analyze text with persona‑driven judgments and structured outputs.

API routes:

- `POST /api/personas` — Generate personas via OpenAI with structured JSON. Body: `{ count?: number, hints?: { locale?: string, theme?: string, constraints?: string[] } }`. Response: `{ personas: Persona[] }` where each persona includes `mini_description`, `first_name`, `last_name`, `city`, `salary_eur`, `biography`.
- `POST /api/analyze` — Analyze text for one or more personas and return judgments per chunk. Body: `{ text: string, personas: Persona[] }`. Response: `{ chunks: {index,start,end,text}[], analyses: PersonaAnalysis[] }`.

Configuration:

- Set `OPENAI_API_KEY` in your environment (e.g., `.env.local`).
- Optional: `OPENAI_MODEL` (default `gpt-5`).

UI:

- In the editor (`/editor`), you can:
  - "Generate population (5)": create 5 personas and list them below the editor.
  - "Analyze": send the editor’s text to `/api/analyze` with the personas and highlight chunks:
    - Green: very good
    - Red: not good
    - Yellow: mixed/neutral

Notes:

- Highlighting aggregates sentiment and tone across personas.
- Uses `chat.completions` with `response_format: json_object` to enforce structured JSON.
- Run `npm install` to install the new `openai` dependency.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

import OpenAI from "openai";

export const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({ apiKey });
};

export const getModel = () => process.env.OPENAI_MODEL ?? "gpt-5";


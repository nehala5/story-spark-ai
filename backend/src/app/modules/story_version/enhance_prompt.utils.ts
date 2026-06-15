import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL } from "../../../services/ai.service";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const getOpenAIClient = () => {
  const key = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OpenAI API key is required but was not provided.");
  }
  return new OpenAI({ apiKey: key });
};

const getAnthropicClient = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("Anthropic API key is required but was not provided.");
  }
  return new Anthropic({ apiKey: key });
};

export const enhancePromptWithGemini = async (
  prompt: string,
  signal?: AbortSignal,
  compressedContext?: string
): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const metaPrompt = `You are a creative writing assistant.


Prompt: ${prompt.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ").replace(/\r/g, "")}`;

Use the following story context if available:

${compressedContext ?? "No previous context"}

Rewrite the following story prompt to be more vivid, specific, and engaging.
Add a character name, setting details, and a central conflict.

Return ONLY the enhanced prompt, nothing else.

Prompt: ${prompt.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}`;

  const resultPromise = model.generateContent(metaPrompt);

  const result = signal
    ? await Promise.race([
        resultPromise,
        new Promise<never>((_, reject) =>
          signal.addEventListener("abort", () =>
            reject(new Error("Generation aborted"))
          )
        ),
      ])
    : await resultPromise;

  const text = (result as Awaited<typeof resultPromise>)
    .response.text()
    .trim();

  return text;
};

export const enhancePromptWithOpenAI = async (
  prompt: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = getOpenAIClient();
  const metaPrompt = `You are a creative writing assistant. Rewrite the following story prompt to be more vivid, specific, and engaging. Add a character name, setting details, and a central conflict. Return ONLY the enhanced prompt, nothing else. Do not add any explanation or prefix.

Prompt: ${prompt}`;

  const response = await client.chat.completions.create(
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: metaPrompt }],
      max_tokens: 1000,
    },
    { signal }
  );

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned an empty response");
  return text;
};

export const enhancePromptWithAnthropic = async (
  prompt: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = getAnthropicClient();
  const metaPrompt = `You are a creative writing assistant. Rewrite the following story prompt to be more vivid, specific, and engaging. Add a character name, setting details, and a central conflict. Return ONLY the enhanced prompt, nothing else. Do not add any explanation or prefix.

Prompt: ${prompt}`;

  const response = await client.messages.create(
    {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{ role: "user", content: metaPrompt }],
    },
    { signal }
  );

  const textBlock = response.content.find((block) => block.type === "text");
  const text = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
  if (!text) throw new Error("Anthropic returned an empty response");
  return text;
};
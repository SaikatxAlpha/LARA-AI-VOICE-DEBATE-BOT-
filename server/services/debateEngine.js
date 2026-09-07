import Groq from "groq-sdk";
import { DEBATE_SYSTEM_PROMPT } from "../prompts/debatePrompt.js";

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Check server/.env");
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
}

export async function generateDebateResponse({
  topic,
  history,
  userArgument
}) {
  const groq = getGroqClient();

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: DEBATE_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: `
Debate topic:
${topic}

Previous debate:
${history || "No previous rounds."}

Latest user argument:
${userArgument}

Generate the next debate response.
`
      }
    ],
    temperature: 0.7,
    max_completion_tokens: 500
  });

  return completion.choices[0]?.message?.content || "I could not generate a response.";
}
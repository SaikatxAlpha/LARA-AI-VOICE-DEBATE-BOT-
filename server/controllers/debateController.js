import Groq from "groq-sdk";
import { DEBATE_SYSTEM_PROMPT } from "../prompts/debatePrompt.js";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "openai/gpt-oss-20b"
];

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Check server/.env");
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
}

function normalizeText(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  if (value && typeof value === "object") {
    if (typeof value.text === "string") {
      return value.text.trim();
    }

    if (typeof value.content === "string") {
      return value.content.trim();
    }

    if (Array.isArray(value.content)) {
      return normalizeText(value.content);
    }
  }

  return "";
}

async function createDebateCompletion(groq, messages) {
  let lastError = null;

  for (const model of GROQ_MODELS) {
    try {
      return await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 700
      });
    } catch (error) {
      lastError = error;
      console.warn(`Groq model ${model} failed, retrying with fallback model.`, error?.message || error);
    }
  }

  throw lastError || new Error("Groq failed to generate a response.");
}

export async function generateDebateResponse({
  topic,
  history,
  userArgument
}) {
  const groq = getGroqClient();

  const messages = [
    {
      role: "system",
      content: DEBATE_SYSTEM_PROMPT
    },
    {
      role: "user",
      content: `The debate topic is: ${topic}`
    }
  ];

  if (history?.trim()) {
    messages.push({
      role: "user",
      content: `Previous debate rounds:\n${history}`
    });
  }

  messages.push({
    role: "user",
    content: `The user's latest argument is:\n${userArgument}\n\nRespond as LARA's debate opponent. Give a strong counterargument and exactly one challenging question.`
  });

  const completion = await createDebateCompletion(groq, messages);
  const message = completion.choices?.[0]?.message;

  if (!message) {
    throw new Error("Groq returned an empty response.");
  }

  const response =
    normalizeText(message.content) ||
    normalizeText(message.reasoning) ||
    normalizeText(completion?.output_text) ||
    normalizeText(message);

  if (!response) {
    throw new Error("Groq returned no text content.");
  }

  return response;
}

export async function debate(req, res) {
  try {
    const { topic, history, userArgument } = req.body;

    if (!topic?.trim() || !userArgument?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Topic and user argument are required."
      });
    }

    const response = await generateDebateResponse({
      topic: topic.trim(),
      history,
      userArgument: userArgument.trim()
    });

    return res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error("Debate error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate debate response. Check the server logs."
    });
  }
}
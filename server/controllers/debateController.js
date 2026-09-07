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

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages,
    temperature: 0.7,
    max_completion_tokens: 700
  });

  const message = completion.choices?.[0]?.message;

  if (!message) {
    throw new Error("Groq returned an empty response.");
  }

  const response =
    typeof message.content === "string"
      ? message.content.trim()
      : "";

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
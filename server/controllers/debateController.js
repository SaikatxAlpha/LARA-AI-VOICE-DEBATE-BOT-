import { generateDebateResponse } from "../services/debateEngine.js";

export async function debate(req, res) {
  try {
    const { topic, history, userArgument } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a debate topic."
      });
    }

    if (topic.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "The debate topic is too short."
      });
    }

    if (topic.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "The debate topic is too long."
      });
    }

    if (!userArgument?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide your argument."
      });
    }

    if (userArgument.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Your argument is too long."
      });
    }

    const aiResponse = await generateDebateResponse({
      topic: topic.trim(),
      history: history?.trim() || "",
      userArgument: userArgument.trim()
    });

    res.json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error("Debate error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate debate response."
    });
  }
}
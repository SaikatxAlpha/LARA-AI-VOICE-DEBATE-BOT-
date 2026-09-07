import { generateDebateResponse } from "../services/debateEngine.js";

export async function debate(req, res) {
  try {
    const { topic, history, userArgument } = req.body;

    if (!topic || !userArgument) {
      return res.status(400).json({
        success: false,
        message: "Topic and user argument are required."
      });
    }

    const aiResponse = await generateDebateResponse({
      topic,
      history,
      userArgument
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
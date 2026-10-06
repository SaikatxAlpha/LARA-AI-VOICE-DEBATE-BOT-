import { getAvatarProvider } from "../services/avatar/index.js";

const NOT_CONFIGURED = {
  available: false,
  reason: "not_configured",
  message: "LARA's live video isn't set up on the server yet."
};

function providerFailure(res, error) {
  console.error("Avatar provider error:", error.message);

  return res.status(502).json({
    available: false,
    reason: "provider_error",
    message:
      error.status === 401 || error.status === 403
        ? "The live video provider rejected the server's credentials."
        : error.status === 402
          ? "The live video provider account is out of credits."
          : "The live video provider is unavailable right now."
  });
}

export async function getAvatarStatus(req, res) {
  const provider = getAvatarProvider();

  if (!provider) {
    return res.json(NOT_CONFIGURED);
  }

  try {
    const { profile } = await provider.getStatus();
    return res.json({ available: true, provider: provider.id, profile });
  } catch (error) {
    return providerFailure(res, error);
  }
}

export async function createAvatarSession(req, res) {
  const provider = getAvatarProvider();

  if (!provider) {
    return res.status(503).json(NOT_CONFIGURED);
  }

  try {
    const session = await provider.createSession();
    return res.json({ available: true, provider: provider.id, ...session });
  } catch (error) {
    return providerFailure(res, error);
  }
}

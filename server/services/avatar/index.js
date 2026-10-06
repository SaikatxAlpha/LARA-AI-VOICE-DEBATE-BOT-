import { didProvider } from "./didProvider.js";

// Real-time avatar providers, keyed by AVATAR_PROVIDER. Each one renders and
// voices LARA only; the debate itself always comes from Groq.
const PROVIDERS = {
  [didProvider.id]: didProvider
};

export function getAvatarProvider() {
  const id = (process.env.AVATAR_PROVIDER || "").trim().toLowerCase();
  const provider = PROVIDERS[id];

  if (!provider || !provider.isConfigured()) {
    return null;
  }

  return provider;
}

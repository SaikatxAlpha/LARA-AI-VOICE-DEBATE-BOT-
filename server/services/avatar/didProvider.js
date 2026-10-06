const DID_API_URL = "https://api.d-id.com";
const CLIENT_KEY_TTL_SECONDS = 3600;
const CLIENT_KEY_REFRESH_MARGIN_MS = 5 * 60 * 1000;
const PROFILE_CACHE_MS = 10 * 60 * 1000;

let cachedClientKey = null;
let cachedProfile = null;

function readConfig() {
  return {
    apiKey: process.env.DID_API_KEY?.trim(),
    agentId: process.env.DID_AGENT_ID?.trim(),
    allowedDomains: (process.env.DID_ALLOWED_DOMAINS || "http://localhost:5173,http://localhost:5174,http://localhost")
      .split(",")
      .map((domain) => domain.trim())
      .filter(Boolean)
  };
}

async function didRequest(path, { apiKey, method = "GET", body }) {
  const response = await fetch(`${DID_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.description || data.message || data.kind || response.statusText;
    const error = new Error(`D-ID ${method} ${path} failed (${response.status}): ${detail}`);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function getProfile(config) {
  if (cachedProfile && cachedProfile.agentId === config.agentId && cachedProfile.expiresAt > Date.now()) {
    return cachedProfile.value;
  }

  const agent = await didRequest(`/agents/${config.agentId}`, { apiKey: config.apiKey });

  const value = {
    name: agent.preview_name || agent.name || "LARA",
    thumbnail: agent.presenter?.thumbnail || agent.thumbnail || null,
    avatarType: agent.avatar?.type || agent.presenter?.type || null
  };

  cachedProfile = { agentId: config.agentId, value, expiresAt: Date.now() + PROFILE_CACHE_MS };
  return value;
}

async function getClientKey(config) {
  if (
    cachedClientKey &&
    cachedClientKey.agentId === config.agentId &&
    cachedClientKey.expiresAt - CLIENT_KEY_REFRESH_MARGIN_MS > Date.now()
  ) {
    return cachedClientKey;
  }

  const created = await didRequest(`/agents/${config.agentId}/client-keys`, {
    apiKey: config.apiKey,
    method: "POST",
    body: {
      name: "lara-debate-web",
      allowed_domains: config.allowedDomains,
      ttl_seconds: CLIENT_KEY_TTL_SECONDS
    }
  });

  cachedClientKey = {
    agentId: config.agentId,
    clientKey: created.client_key,
    expiresAt: created.expires_at
      ? new Date(created.expires_at).getTime()
      : Date.now() + CLIENT_KEY_TTL_SECONDS * 1000
  };

  return cachedClientKey;
}

export const didProvider = {
  id: "did",

  isConfigured() {
    const { apiKey, agentId } = readConfig();
    return Boolean(apiKey && agentId);
  },

  async getStatus() {
    return { profile: await getProfile(readConfig()) };
  },

  async createSession() {
    const config = readConfig();
    const [profile, key] = await Promise.all([getProfile(config), getClientKey(config)]);

    return {
      agentId: config.agentId,
      clientKey: key.clientKey,
      expiresAt: key.expiresAt,
      profile
    };
  }
};

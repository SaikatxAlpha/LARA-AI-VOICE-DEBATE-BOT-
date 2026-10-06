const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, { method = "GET", body } = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error("Can't reach the LARA server. Make sure it's running, then try again.");
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The LARA server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export function sendDebateArgument({ topic, field, level, history, userArgument }) {
  return request("/debate", {
    method: "POST",
    body: { topic, field, level, history, userArgument }
  });
}

export function fetchAvatarStatus() {
  return request("/avatar/status");
}

export function createAvatarSession() {
  return request("/avatar/session", { method: "POST" });
}

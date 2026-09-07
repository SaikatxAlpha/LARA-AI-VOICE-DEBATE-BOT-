const API_URL = "http://localhost:5000/api";

export async function sendDebateArgument({
  topic,
  history,
  userArgument
}) {
  const response = await fetch(`${API_URL}/debate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic,
      history,
      userArgument
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to generate debate response");
  }

  return data;
}
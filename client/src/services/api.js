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

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The debate server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Failed to generate debate response");
  }

  return data;
}
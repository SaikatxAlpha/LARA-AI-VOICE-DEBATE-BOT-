const SECTION_PATTERN = /COUNTERARGUMENT:\s*([\s\S]*?)\s*CHALLENGE:\s*([\s\S]*)/i;

export function parseLaraResponse(text) {
  const match = text.match(SECTION_PATTERN);

  if (match) {
    return {
      counter: match[1].trim(),
      challenge: match[2].trim()
    };
  }

  return {
    counter: text.replace(/^\s*COUNTERARGUMENT:\s*/i, "").trim(),
    challenge: ""
  };
}

export function toPlainText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[*_#`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Splits "**key phrase**" markup into renderable segments.
export function toSegments(text) {
  return text
    .split(/(\*\*.+?\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**")
        ? { text: part.slice(2, -2), highlight: true }
        : { text: part.replace(/[*_#`]/g, ""), highlight: false }
    );
}

export function buildSpokenResponse(text) {
  const { counter, challenge } = parseLaraResponse(text);
  const spokenCounter = toPlainText(counter);
  const spokenChallenge = toPlainText(challenge);

  return {
    text: [spokenCounter, spokenChallenge].filter(Boolean).join(" "),
    challengeOffset: spokenChallenge ? spokenCounter.length + 1 : null
  };
}

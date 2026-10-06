import { LEVELS } from "../config/debateOptions";

export function groupByRound(messages) {
  const rounds = new Map();

  messages.forEach((message) => {
    if (!rounds.has(message.round)) {
      rounds.set(message.round, []);
    }

    rounds.get(message.round).push(message);
  });

  return [...rounds.entries()].map(([round, items]) => ({ round, messages: items }));
}

export function countRounds(entry) {
  return entry.messages.filter((message) => message.role === "ai").length;
}

export function levelRank(levelId) {
  return LEVELS.findIndex((level) => level.id === levelId);
}

function mostFrequent(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export function computeStats(history) {
  return {
    debates: history.length,
    rounds: history.reduce((total, entry) => total + countRounds(entry), 0),
    favoriteField: mostFrequent(history.map((entry) => entry.fieldLabel)),
    preferredLevel: mostFrequent(history.map((entry) => entry.level))
  };
}

export function rankDebates(history) {
  return [...history].sort(
    (a, b) =>
      countRounds(b) - countRounds(a) ||
      levelRank(b.level) - levelRank(a.level) ||
      b.endedAt - a.endedAt
  );
}

export function totalsByField(history) {
  const totals = new Map();

  history.forEach((entry) => {
    const current = totals.get(entry.fieldLabel) || { field: entry.fieldLabel, debates: 0, rounds: 0 };
    current.debates += 1;
    current.rounds += countRounds(entry);
    totals.set(entry.fieldLabel, current);
  });

  return [...totals.values()].sort((a, b) => b.rounds - a.rounds || b.debates - a.debates);
}

export const FIELDS = [
  { id: "technology", label: "Technology", icon: "laptop" },
  { id: "science", label: "Science", icon: "flask" },
  { id: "politics", label: "Politics", icon: "landmark" },
  { id: "education", label: "Education", icon: "graduation" },
  { id: "environment", label: "Environment", icon: "leaf" },
  { id: "society", label: "Society", icon: "users" },
  { id: "health", label: "Health", icon: "heart" },
  { id: "business", label: "Business", icon: "chart" },
  { id: "custom", label: "Custom", icon: "plusCircle" }
];

export const LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "Simple arguments & friendly debate",
    bars: 1
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Balanced & challenging",
    bars: 2
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Deep reasoning & critical analysis",
    bars: 3
  }
];

export const TOPIC_MAX_LENGTH = 200;
export const CUSTOM_FIELD_MAX_LENGTH = 40;

export function getLevel(id) {
  return LEVELS.find((level) => level.id === id) || null;
}

export function getField(id) {
  return FIELDS.find((field) => field.id === id) || null;
}

export function resolveFieldLabel(fieldId, customField) {
  if (fieldId === "custom") {
    return customField.trim() || "Custom";
  }

  return getField(fieldId)?.label || "";
}

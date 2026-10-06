import { createDidAvatar } from "./did";

// Keyed by the `provider` id the server returns from /api/avatar/session.
// Adding a provider means adding an adapter with the same contract as ./did.js.
export const AVATAR_PROVIDERS = {
  did: createDidAvatar
};

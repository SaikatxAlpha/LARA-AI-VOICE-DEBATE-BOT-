// D-ID Agents SDK adapter. Implements the avatar client contract used by useLiveAvatar:
// { profile, connect, reconnect, speak, interrupt, disconnect }, reporting through
// events.onMedia / onConnection / onSpeaking / onError. The SDK is loaded on demand so
// it only ships to browsers that actually open a live session.

const CONNECTION_STATES = {
  connecting: "connecting",
  connected: "live",
  completed: "live",
  fail: "failed",
  disconnected: "ended",
  closed: "ended"
};

export async function createDidAvatar({ session, events }) {
  const sdk = await import("@d-id/client-sdk");
  let manager = null;
  let stream = null;

  const isFluent = () => manager?.getStreamType() === sdk.StreamType.Fluent;

  // Legacy streams only carry video while the agent talks; between answers the agent's
  // own idle clip is shown instead. Fluent streams carry both states in one video.
  function publishMedia(talking) {
    const idleVideo = !isFluent() && !talking ? manager?.agent.idle_video || null : null;
    events.onMedia({ stream, idleVideo });
  }

  manager = await sdk.createAgentManager(session.agentId, {
    auth: { type: "key", clientKey: session.clientKey },
    analytics: { enabled: false },
    streamOptions: { fluent: true, compatibilityMode: "auto" },
    callbacks: {
      onSrcObjectReady(value) {
        stream = value;
        publishMedia(false);
      },
      onConnectionStateChange(state, reason) {
        events.onConnection(CONNECTION_STATES[state] || null, reason);
      },
      onVideoStateChange(state) {
        if (isFluent()) {
          return;
        }

        const talking = state === sdk.StreamingState.Start;
        publishMedia(talking);
        events.onSpeaking(talking);
      },
      onAgentActivityStateChange(state) {
        if (isFluent()) {
          events.onSpeaking(state === sdk.AgentActivityState.Talking);
        }
      },
      onError(error) {
        events.onError(error?.message || "The live video stream reported an error.", error?.kind === "ChatModeDowngraded");
      }
    }
  });

  return {
    profile: {
      name: manager.agent.name,
      thumbnail: manager.agent.thumbnail || null
    },
    async connect() {
      await manager.connect();
      publishMedia(false);
    },
    async reconnect() {
      await manager.reconnect();
      publishMedia(false);
    },
    speak(text) {
      return manager.speak({ type: "text", input: text });
    },
    interrupt() {
      if (!manager.isInterruptAvailable()) {
        return false;
      }

      manager.interrupt({ type: "manual" });
      return true;
    },
    disconnect() {
      return manager.disconnect();
    }
  };
}

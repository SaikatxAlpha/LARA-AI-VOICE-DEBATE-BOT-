import { useCallback, useEffect, useRef, useState } from "react";
import { createAvatarSession, fetchAvatarStatus } from "../services/api";
import { AVATAR_PROVIDERS } from "./providers";

const START_TIMEOUT_MS = 20000;
const MIN_SEGMENT_LENGTH = 3;

const EMPTY_MEDIA = { stream: null, idleVideo: null };
const IDLE_PLAYBACK = { id: null, status: "idle", segment: 0, startedAt: 0, endedAt: 0 };
const NO_QUEUE = { id: null, segments: [], index: 0, started: false };

function messageOf(error) {
  // Rejected client keys come back without CORS headers, so the browser reports them as
  // network failures; a domain missing from DID_ALLOWED_DOMAINS is the usual cause.
  if (error?.kind === "NetworkError") {
    return "Couldn't reach the live video service. Check that this site's address is in DID_ALLOWED_DOMAINS.";
  }

  return error?.message || "LARA's live video ran into a problem.";
}

// Owns one live avatar session. `connection` is offline | connecting | live | standby | failed;
// `playback.status` is idle | pending | speaking | ended, driven only by provider events.
export function useLiveAvatar() {
  const [availability, setAvailability] = useState({ status: "checking", profile: null, message: "" });
  const [connection, setConnection] = useState("offline");
  const [error, setError] = useState("");
  const [media, setMedia] = useState(EMPTY_MEDIA);
  const [playback, setPlayback] = useState(IDLE_PLAYBACK);
  const [silenced, setSilenced] = useState(false);
  const [sessionProfile, setSessionProfile] = useState(null);

  const clientRef = useRef(null);
  const connectionRef = useRef("offline");
  const pendingConnectRef = useRef(null);
  const generationRef = useRef(0);
  const queueRef = useRef(NO_QUEUE);
  const startTimerRef = useRef(0);

  const updateConnection = useCallback((value) => {
    connectionRef.current = value;
    setConnection(value);
  }, []);

  useEffect(() => {
    let active = true;

    fetchAvatarStatus()
      .then((status) => {
        if (active) {
          setAvailability(
            status.available
              ? { status: "available", profile: status.profile, message: "" }
              : { status: "unavailable", profile: null, message: status.message }
          );
        }
      })
      .catch((statusError) => {
        if (active) {
          setAvailability({ status: "unavailable", profile: null, message: messageOf(statusError) });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const clearQueue = useCallback(() => {
    queueRef.current = NO_QUEUE;
    window.clearTimeout(startTimerRef.current);
  }, []);

  const finishPlayback = useCallback((id) => {
    setPlayback((current) =>
      current.id === id ? { ...current, status: current.startedAt ? "ended" : "idle", endedAt: Date.now() } : current
    );
  }, []);

  const sendSegment = useCallback(
    async (queue) => {
      window.clearTimeout(startTimerRef.current);
      startTimerRef.current = window.setTimeout(() => {
        if (queueRef.current === queue && !queue.started) {
          clearQueue();
          finishPlayback(queue.id);
          setError("LARA's video didn't start in time.");
        }
      }, START_TIMEOUT_MS);

      await clientRef.current.speak(queue.segments[queue.index]);
    },
    [clearQueue, finishPlayback]
  );

  const handleSpeaking = useCallback(
    (talking) => {
      const queue = queueRef.current;

      if (talking) {
        if (!queue.id) {
          return;
        }

        window.clearTimeout(startTimerRef.current);
        queue.started = true;
        const segment = queue.index;
        setPlayback((current) =>
          current.id === queue.id
            ? { ...current, status: "speaking", segment, startedAt: current.startedAt || Date.now() }
            : current
        );
        return;
      }

      if (!queue.id) {
        setSilenced(false);
        return;
      }

      if (!queue.started) {
        return;
      }

      queue.started = false;

      if (queue.index + 1 < queue.segments.length) {
        queue.index += 1;
        sendSegment(queue).catch((segmentError) => {
          if (queueRef.current === queue) {
            clearQueue();
            finishPlayback(queue.id);
            setError(messageOf(segmentError));
          }
        });
        return;
      }

      clearQueue();
      finishPlayback(queue.id);
    },
    [clearQueue, finishPlayback, sendSegment]
  );

  const createEvents = useCallback(
    (generation) => {
      const isCurrent = () => generation === generationRef.current;

      return {
        onMedia(nextMedia) {
          if (isCurrent()) {
            setMedia(nextMedia);
          }
        },
        onConnection(state) {
          if (!isCurrent() || !state || !clientRef.current) {
            return;
          }

          if (state === "live") {
            updateConnection("live");
          } else if (state === "failed") {
            updateConnection("failed");
            setError("LARA's live video connection failed.");
          } else if (state === "ended") {
            const { id } = queueRef.current;
            clearQueue();
            finishPlayback(id);
            setMedia(EMPTY_MEDIA);
            updateConnection("standby");
          }
        },
        onSpeaking(talking) {
          if (isCurrent()) {
            handleSpeaking(talking);
          }
        },
        onError(message, fatal) {
          if (!isCurrent()) {
            return;
          }

          setError(message);

          if (fatal) {
            updateConnection("failed");
          }
        }
      };
    },
    [clearQueue, finishPlayback, handleSpeaking, updateConnection]
  );

  const connect = useCallback(() => {
    if (pendingConnectRef.current) {
      return pendingConnectRef.current;
    }

    if (clientRef.current) {
      return Promise.resolve();
    }

    generationRef.current += 1;
    const generation = generationRef.current;
    updateConnection("connecting");
    setError("");

    const attempt = (async () => {
      const session = await createAvatarSession();
      const createClient = AVATAR_PROVIDERS[session.provider];

      if (!createClient) {
        throw new Error(`No avatar provider named "${session.provider}" is installed.`);
      }

      const client = await createClient({ session, events: createEvents(generation) });

      if (generation !== generationRef.current) {
        client.disconnect().catch(() => {});
        return;
      }

      clientRef.current = client;
      setSessionProfile(client.profile);
      await client.connect();

      if (generation === generationRef.current) {
        updateConnection("live");
      }
    })();

    pendingConnectRef.current = attempt
      .catch((connectError) => {
        if (generation === generationRef.current) {
          Promise.resolve(clientRef.current?.disconnect()).catch(() => {});
          clientRef.current = null;
          setMedia(EMPTY_MEDIA);
          updateConnection("failed");
          setError(messageOf(connectError));
        }

        throw connectError;
      })
      .finally(() => {
        pendingConnectRef.current = null;
      });

    return pendingConnectRef.current;
  }, [createEvents, updateConnection]);

  const ensureConnected = useCallback(async () => {
    if (pendingConnectRef.current) {
      return pendingConnectRef.current;
    }

    const state = connectionRef.current;

    if (state === "live" && clientRef.current) {
      return undefined;
    }

    if (state === "standby" && clientRef.current) {
      updateConnection("connecting");
      pendingConnectRef.current = clientRef.current
        .reconnect()
        .then(() => updateConnection("live"))
        .catch((reconnectError) => {
          updateConnection("failed");
          setError(messageOf(reconnectError));
          throw reconnectError;
        })
        .finally(() => {
          pendingConnectRef.current = null;
        });
      return pendingConnectRef.current;
    }

    throw new Error("LARA's live video is not connected.");
  }, [updateConnection]);

  const speak = useCallback(
    async (segments, { id }) => {
      const parts = segments.map((segment) => segment.trim()).filter((segment) => segment.length >= MIN_SEGMENT_LENGTH);

      if (!parts.length) {
        return false;
      }

      try {
        await ensureConnected();
      } catch {
        return false;
      }

      const queue = { id, segments: parts, index: 0, started: false };
      queueRef.current = queue;
      setSilenced(false);
      setPlayback({ id, status: "pending", segment: 0, startedAt: 0, endedAt: 0 });

      try {
        await sendSegment(queue);
        return true;
      } catch (speakError) {
        if (queueRef.current === queue) {
          clearQueue();
          setPlayback(IDLE_PLAYBACK);
        }

        setError(messageOf(speakError));
        return false;
      }
    },
    [clearQueue, ensureConnected, sendSegment]
  );

  // Stops LARA mid-answer. Fluent streams stop at the source; on streams that cannot be
  // interrupted the remaining audio of the current clip is silenced instead.
  const interrupt = useCallback(() => {
    const queue = queueRef.current;

    if (!queue.id) {
      return;
    }

    clearQueue();

    if (!clientRef.current?.interrupt()) {
      setSilenced(true);
    }

    finishPlayback(queue.id);
  }, [clearQueue, finishPlayback]);

  const disconnect = useCallback(() => {
    generationRef.current += 1;
    clearQueue();
    const client = clientRef.current;
    clientRef.current = null;
    pendingConnectRef.current = null;
    Promise.resolve(client?.disconnect()).catch(() => {});
    updateConnection("offline");
    setMedia(EMPTY_MEDIA);
    setPlayback(IDLE_PLAYBACK);
    setSilenced(false);
    setError("");
  }, [clearQueue, updateConnection]);

  const retry = useCallback(() => {
    disconnect();
    return connect();
  }, [connect, disconnect]);

  useEffect(() => {
    window.addEventListener("pagehide", disconnect);

    return () => {
      window.removeEventListener("pagehide", disconnect);
      disconnect();
    };
  }, [disconnect]);

  return {
    availability,
    connection,
    engaged: connection === "connecting" || connection === "live" || connection === "standby",
    error,
    media,
    playback,
    silenced,
    profile: sessionProfile?.thumbnail ? sessionProfile : availability.profile,
    connect,
    prepare: () => ensureConnected().catch(() => {}),
    speak,
    interrupt,
    disconnect,
    retry
  };
}

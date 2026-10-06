import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { sendDebateArgument } from "../services/api";
import { readStored, writeStored } from "../services/storage";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useLiveAvatar } from "../avatar/useLiveAvatar";
import { buildSpokenResponse, parseLaraResponse, toPlainText } from "../utils/laraResponse";
import { resolveFieldLabel } from "../config/debateOptions";

const DebateContext = createContext(null);

const HISTORY_LIMIT = 50;

const EMPTY_SETUP = {
  field: "",
  customField: "",
  level: "",
  topic: ""
};

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateSetup(setup) {
  const errors = {};

  if (!setup.field) {
    errors.field = "Please select a debate field.";
  } else if (setup.field === "custom" && !setup.customField.trim()) {
    errors.field = "Please name your custom field.";
  }

  if (!setup.level) {
    errors.level = "Please choose a debate level.";
  }

  if (!setup.topic.trim()) {
    errors.topic = "Please enter a debate topic.";
  }

  return errors;
}

function buildHistoryPrompt(messages) {
  return messages
    .slice(-10)
    .map((message) => `${message.role === "user" ? "USER" : "LARA"}: ${message.text}`)
    .join("\n\n");
}

// One view of LARA's current utterance, whichever engine is voicing it.
function describeVoice(source, avatarPlayback, speechPlayback) {
  if (source === "avatar") {
    return {
      source,
      id: avatarPlayback.id,
      status: avatarPlayback.status,
      inChallenge: avatarPlayback.status === "speaking" && avatarPlayback.segment >= 1,
      startedAt: avatarPlayback.startedAt,
      endedAt: avatarPlayback.endedAt
    };
  }

  const active = speechPlayback.status === "speaking" || speechPlayback.status === "paused";

  return {
    source,
    id: speechPlayback.id,
    status: speechPlayback.status,
    inChallenge:
      active && speechPlayback.challengeOffset !== null && speechPlayback.charIndex >= speechPlayback.challengeOffset,
    elapsed: speechPlayback.elapsed,
    estimate: speechPlayback.estimate,
    progress: speechPlayback.length ? speechPlayback.charIndex / speechPlayback.length : 0
  };
}

export function DebateProvider({ children }) {
  const [setup, setSetup] = useState(EMPTY_SETUP);
  const [validation, setValidation] = useState({});
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingArgument, setPendingArgument] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => readStored("history", []));
  const [profile, setProfile] = useState(() => readStored("profile", { name: "" }));
  const sessionRef = useRef(null);

  const speech = useSpeechSynthesis();
  const avatar = useLiveAvatar();
  const [voiceSource, setVoiceSource] = useState("browser");
  const mic = useSpeechRecognition({
    onFinal: (transcript) =>
      setDraft((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript))
  });

  useEffect(() => {
    writeStored("history", history);
  }, [history]);

  useEffect(() => {
    writeStored("profile", profile);
  }, [profile]);

  const updateSetup = useCallback((patch) => {
    setSetup((current) => ({ ...current, ...patch }));
    setValidation((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => {
        delete next[key === "customField" ? "field" : key];
      });
      return next;
    });
  }, []);

  function startDebate() {
    const errors = validateSetup(setup);
    setValidation(errors);

    if (Object.keys(errors).length) {
      return false;
    }

    const nextSession = {
      id: createId(),
      field: setup.field,
      fieldLabel: resolveFieldLabel(setup.field, setup.customField),
      level: setup.level,
      topic: setup.topic.trim(),
      startedAt: Date.now()
    };

    sessionRef.current = nextSession.id;
    stopLara();
    setSession(nextSession);
    setMessages([]);
    setError("");

    if (avatar.availability.status === "available") {
      avatar.connect().catch(() => {});
    }

    return true;
  }

  async function submitArgument() {
    const argument = draft.trim();

    if (!session || loading || !argument) {
      return;
    }

    mic.abort();
    stopLara();
    avatar.prepare();

    const sessionId = session.id;
    const sentAt = Date.now();
    const round = messages.filter((message) => message.role === "user").length + 1;

    setLoading(true);
    setPendingArgument(argument);
    setError("");
    setDraft("");

    try {
      const result = await sendDebateArgument({
        topic: session.topic,
        field: session.fieldLabel,
        level: session.level,
        history: buildHistoryPrompt(messages),
        userArgument: argument
      });

      if (sessionRef.current !== sessionId) {
        return;
      }

      if (!result?.response?.trim()) {
        throw new Error("LARA went quiet. Try that again.");
      }

      const reply = {
        id: createId(),
        role: "ai",
        text: result.response,
        at: Date.now(),
        round
      };

      setMessages((current) => [
        ...current,
        { id: createId(), role: "user", text: argument, at: sentAt, round },
        reply
      ]);

      speakMessage(reply);
    } catch (requestError) {
      if (sessionRef.current !== sessionId) {
        return;
      }

      console.error("Debate request failed:", requestError);
      setError(
        requestError.message ||
          "LARA couldn't get a word out. Check your connection and try again."
      );
      setDraft((current) => current || argument);
    } finally {
      if (sessionRef.current === sessionId) {
        setLoading(false);
        setPendingArgument("");
      }
    }
  }

  function endDebate() {
    mic.abort();
    speech.stop();
    avatar.disconnect();

    if (session && messages.length) {
      const entry = {
        id: session.id,
        field: session.field,
        fieldLabel: session.fieldLabel,
        level: session.level,
        topic: session.topic,
        startedAt: session.startedAt,
        endedAt: Date.now(),
        messages
      };

      setHistory((current) => [entry, ...current].slice(0, HISTORY_LIMIT));
    }

    sessionRef.current = null;
    setSession(null);
    setMessages([]);
    setLoading(false);
    setPendingArgument("");
    setError("");
    setDraft("");
  }

  function newDebate() {
    endDebate();
    setSetup((current) => ({ ...current, topic: "" }));
    setValidation({});
  }

  function toggleListening() {
    if (mic.listening) {
      mic.stop();
      return;
    }

    stopLara();
    mic.start();
  }

  function stopLara() {
    avatar.interrupt();
    speech.stop();
  }

  // The live avatar voices LARA whenever a session is engaged; browser speech is the fallback.
  async function speakMessage(message) {
    stopLara();

    if (avatar.engaged) {
      const { counter, challenge } = parseLaraResponse(message.text);
      setVoiceSource("avatar");

      if (await avatar.speak([toPlainText(counter), toPlainText(challenge)], { id: message.id })) {
        return;
      }
    }

    setVoiceSource("browser");
    const spoken = buildSpokenResponse(message.text);
    speech.speak(spoken.text, { id: message.id, challengeOffset: spoken.challengeOffset });
  }

  function deleteHistoryEntry(id) {
    setHistory((current) => current.filter((entry) => entry.id !== id));
  }

  const voice = describeVoice(voiceSource, avatar.playback, speech.playback);
  const isSpeaking = voice.status === "speaking" || voice.status === "paused";

  let presence = "idle";

  if (mic.listening) {
    presence = "listening";
  } else if (loading || voice.status === "pending") {
    presence = "thinking";
  } else if (isSpeaking) {
    presence = "speaking";
  }

  return (
    <DebateContext.Provider
      value={{
        setup,
        updateSetup,
        validation,
        session,
        messages,
        draft,
        setDraft,
        loading,
        pendingArgument,
        error,
        dismissError: () => setError(""),
        presence,
        voice,
        speech,
        avatar,
        mic,
        history,
        deleteHistoryEntry,
        profile,
        setProfile,
        startDebate,
        submitArgument,
        endDebate,
        newDebate,
        toggleListening,
        speakMessage,
        stopVoice: stopLara
      }}
    >
      {children}
    </DebateContext.Provider>
  );
}

export function useDebate() {
  const context = useContext(DebateContext);

  if (!context) {
    throw new Error("useDebate must be used inside DebateProvider");
  }

  return context;
}

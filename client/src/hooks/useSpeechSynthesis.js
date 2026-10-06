import { useCallback, useEffect, useRef, useState } from "react";
import { readStored, writeStored } from "../services/storage";

const SPEECH_RATE = 0.95;
const WORDS_PER_SECOND = 2.15 * SPEECH_RATE;

const IDLE_PLAYBACK = {
  id: null,
  text: "",
  status: "idle",
  charIndex: 0,
  length: 0,
  elapsed: 0,
  estimate: 0,
  challengeOffset: null
};

const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

export function estimateSpeechSeconds(text) {
  return text.split(/\s+/).filter(Boolean).length / WORDS_PER_SECOND;
}

function pickDefaultVoice(voices) {
  return (
    voices.find((voice) => voice.lang.toLowerCase().includes("en-in")) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
    voices[0]
  );
}

function splitIntoChunks(text) {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [text];
  let cursor = 0;

  return sentences
    .map((sentence) => {
      const offset = Math.max(cursor, text.indexOf(sentence, cursor));
      cursor = offset + sentence.length;
      return { text: sentence, offset };
    })
    .filter((chunk) => chunk.text.trim());
}

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceNameState] = useState(() => readStored("voice", ""));
  const [muted, setMutedState] = useState(() => readStored("muted", false));
  const [playback, setPlayback] = useState(IDLE_PLAYBACK);
  const runRef = useRef(0);
  const clockRef = useRef({ startedAt: 0, accumulated: 0 });

  useEffect(() => {
    if (!isSupported) {
      return undefined;
    }

    const synth = window.speechSynthesis;

    function loadVoices() {
      setVoices(synth.getVoices());
    }

    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);

    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      synth.cancel();
    };
  }, []);

  const voice =
    voices.find((item) => item.name === voiceName) ||
    (voices.length ? pickDefaultVoice(voices) : null);

  const readElapsed = useCallback(() => {
    const clock = clockRef.current;
    return clock.accumulated + (clock.startedAt ? (performance.now() - clock.startedAt) / 1000 : 0);
  }, []);

  useEffect(() => {
    if (playback.status !== "speaking") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setPlayback((current) => ({ ...current, elapsed: readElapsed() }));
    }, 250);

    return () => window.clearInterval(timer);
  }, [playback.status, readElapsed]);

  const stop = useCallback(() => {
    runRef.current += 1;
    clockRef.current = { startedAt: 0, accumulated: 0 };

    if (isSupported) {
      window.speechSynthesis.cancel();
    }

    setPlayback((current) => (current.status === "ended" ? current : IDLE_PLAYBACK));
  }, []);

  const speak = useCallback(
    (text, { id = null, challengeOffset = null } = {}) => {
      if (!isSupported || !text) {
        return false;
      }

      const synth = window.speechSynthesis;
      const run = runRef.current + 1;
      runRef.current = run;
      synth.cancel();
      clockRef.current = { startedAt: 0, accumulated: 0 };

      if (muted) {
        setPlayback(IDLE_PLAYBACK);
        return false;
      }

      const chunks = splitIntoChunks(text);
      const isCurrent = () => runRef.current === run;

      function finish() {
        const elapsed = readElapsed();
        clockRef.current = { startedAt: 0, accumulated: elapsed };
        setPlayback((current) => ({
          ...current,
          status: "ended",
          charIndex: current.length,
          elapsed,
          estimate: elapsed
        }));
      }

      setPlayback({
        id,
        text,
        status: "speaking",
        charIndex: 0,
        length: text.length,
        elapsed: 0,
        estimate: estimateSpeechSeconds(text),
        challengeOffset
      });

      chunks.forEach((chunk, index) => {
        const isLast = index === chunks.length - 1;
        const utterance = new SpeechSynthesisUtterance(chunk.text);

        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        }

        utterance.rate = SPEECH_RATE;
        utterance.pitch = 1;

        utterance.onstart = () => {
          if (isCurrent() && !clockRef.current.startedAt) {
            clockRef.current.startedAt = performance.now();
          }
        };

        utterance.onboundary = (event) => {
          if (isCurrent()) {
            setPlayback((current) => ({ ...current, charIndex: chunk.offset + event.charIndex }));
          }
        };

        utterance.onend = () => {
          if (!isCurrent()) {
            return;
          }

          if (isLast) {
            finish();
          } else {
            setPlayback((current) => ({ ...current, charIndex: chunk.offset + chunk.text.length }));
          }
        };

        utterance.onerror = () => {
          if (isCurrent() && isLast) {
            finish();
          }
        };

        synth.speak(utterance);
      });

      return true;
    },
    [muted, voice, readElapsed]
  );

  const pause = useCallback(() => {
    if (!isSupported || playback.status !== "speaking") {
      return;
    }

    window.speechSynthesis.pause();
    clockRef.current = { startedAt: 0, accumulated: readElapsed() };
    setPlayback((current) => ({ ...current, status: "paused", elapsed: clockRef.current.accumulated }));
  }, [playback.status, readElapsed]);

  const resume = useCallback(() => {
    if (!isSupported || playback.status !== "paused") {
      return;
    }

    window.speechSynthesis.resume();
    clockRef.current.startedAt = performance.now();
    setPlayback((current) => ({ ...current, status: "speaking" }));
  }, [playback.status]);

  const setVoiceName = useCallback((name) => {
    setVoiceNameState(name);
    writeStored("voice", name);
  }, []);

  const setMuted = useCallback(
    (value) => {
      setMutedState(value);
      writeStored("muted", value);

      if (value) {
        stop();
      }
    },
    [stop]
  );

  return {
    supported: isSupported,
    voices,
    voice,
    setVoiceName,
    muted,
    setMuted,
    playback,
    speak,
    stop,
    pause,
    resume
  };
}

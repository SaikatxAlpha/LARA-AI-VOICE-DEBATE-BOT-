import { useCallback, useEffect, useRef, useState } from "react";

const RecognitionCtor =
  typeof window === "undefined"
    ? null
    : window.SpeechRecognition || window.webkitSpeechRecognition || null;

const ERROR_MESSAGES = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser to speak.",
  "service-not-allowed": "Microphone access is blocked. Allow it in your browser to speak.",
  "audio-capture": "No microphone was found.",
  network: "Voice recognition needs a network connection.",
  "no-speech": "I didn't catch that. Tap the mic and try again."
};

export function useSpeechRecognition({ onFinal, lang = "en-US" }) {
  const recognitionRef = useRef(null);
  const onFinalRef = useRef(onFinal);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    onFinalRef.current = onFinal;
  });

  useEffect(() => {
    if (!RecognitionCtor) {
      return undefined;
    }

    const recognition = new RecognitionCtor();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setListening(true);
      setInterim("");
      setError("");
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);

      if (event.error !== "aborted") {
        setError(ERROR_MESSAGES[event.error] || "Voice input stopped unexpectedly. Try again.");
      }
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];

        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      setInterim(interimText);

      if (finalText.trim()) {
        onFinalRef.current?.(finalText.trim());
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [lang]);

  const start = useCallback(() => {
    try {
      recognitionRef.current?.start();
    } catch (startError) {
      console.error(startError);
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const abort = useCallback(() => {
    recognitionRef.current?.abort();
  }, []);

  return {
    supported: Boolean(RecognitionCtor),
    listening,
    interim,
    error,
    clearError: () => setError(""),
    start,
    stop,
    abort
  };
}

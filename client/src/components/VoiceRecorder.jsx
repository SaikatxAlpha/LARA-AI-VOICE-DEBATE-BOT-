import { useEffect, useRef, useState } from "react";

function VoiceRecorder({ onTranscript }) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [onTranscript]);

  function toggleRecording() {
    if (!recognitionRef.current) {
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error(error);
    }
  }

  if (!supported) {
    return (
      <span className="voice-not-supported">
        Voice recognition unavailable
      </span>
    );
  }

  return (
    <button
      type="button"
      className={`voice-button ${listening ? "active" : ""}`}
      onClick={toggleRecording}
    >
      {listening ? "● Listening..." : "🎙 Speak"}
    </button>
  );
}

export default VoiceRecorder;
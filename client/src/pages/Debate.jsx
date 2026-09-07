import { useEffect, useState } from "react";
import { useDebate } from "../context/DebateContext";
import { sendDebateArgument } from "../services/api";
import VoiceRecorder from "../components/VoiceRecorder";

function Debate() {
  const {
    topic,
    setTopic,
    messages,
    addMessage,
    setIsDebating,
    resetDebate
  } = useDebate();

  const [argument, setArgument] = useState("");
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    function loadVoices() {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      if (!selectedVoice && availableVoices.length) {
        const preferred =
          availableVoices.find((voice) =>
            voice.lang.toLowerCase().includes("en-in")
          ) ||
          availableVoices.find((voice) =>
            voice.lang.toLowerCase().startsWith("en")
          ) ||
          availableVoices[0];

        setSelectedVoice(preferred.name);
      }
    }

    loadVoices();

    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  async function handleDebate() {
    if (!topic.trim() || !argument.trim()) {
      alert("Please enter a topic and argument.");
      return;
    }

    setLoading(true);
    setIsDebating(true);

    const currentArgument = argument;

    const history = [
      ...messages,
      {
        role: "user",
        text: currentArgument
      }
    ]
      .map((message) => `${message.role}: ${message.text}`)
      .join("\n");

    try {
      addMessage({
        role: "user",
        text: currentArgument
      });

      const result = await sendDebateArgument({
        topic,
        history,
        userArgument: currentArgument
      });

      addMessage({
        role: "ai",
        text: result.response
      });

      speak(result.response);
      setArgument("");
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((item) => item.name === selectedVoice);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setSpeaking(true);
    };

    utterance.onend = () => {
      setSpeaking(false);
    };

    utterance.onerror = () => {
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function handleReset() {
    stopSpeaking();
    resetDebate();
    setArgument("");
  }

  const round = Math.ceil(messages.length / 2);

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-mark">L</div>
          <div>
            <div className="logo">LARA</div>
            <div className="nav-subtitle">AI Voice Debate</div>
          </div>
        </div>

        <div className="nav-status">
          <span className="status-dot"></span>
          Live
        </div>
      </header>

      <main className="main-layout">
        <aside className="sidebar">
          <div className="side-section">
            <div className="side-label">Session</div>

            <div className="session-card">
              <div className="session-icon">◉</div>
              <div>
                <strong>Live Debate</strong>
                <span>{messages.length ? `${round} rounds` : "Ready to begin"}</span>
              </div>
            </div>
          </div>

          <div className="side-section">
            <div className="side-label">LARA voice</div>

            <select
              className="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
            >
              {voices.length === 0 && (
                <option value="">Default browser voice</option>
              )}

              {voices.map((voice) => (
                <option
                  key={`${voice.name}-${voice.lang}`}
                  value={voice.name}
                >
                  {voice.name} — {voice.lang}
                </option>
              ))}
            </select>
          </div>

          <div className="side-section">
            <div className="side-label">Controls</div>

            <button
              className="control-button"
              onClick={speaking ? stopSpeaking : () => messages.length && speak(messages[messages.length - 1].text)}
            >
              <span>{speaking ? "■" : "▶"}</span>
              {speaking ? "Stop Speaking" : "Replay LARA"}
            </button>

            <button
              className="control-button danger"
              onClick={handleReset}
            >
              <span>↻</span>
              New Debate
            </button>
          </div>

          <div className="sidebar-bottom">
            <div className="lara-mini">
              <div className={`lara-orb ${speaking ? "speaking" : ""}`}>
                L
              </div>

              <div>
                <strong>LARA AI</strong>
                <span>{speaking ? "Speaking..." : "Listening..."}</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="debate-area">
          <div className="debate-header">
            <div>
              <div className="eyebrow">Your voice vs. LARA's logic</div>
              <h1>Say it. Defend it.</h1>
              <p>
                Drop a topic, make your case, and LARA pushes back — in real time, out loud.
              </p>
            </div>

            <div className="round-badge">
              <span>ROUND</span>
              <strong>{round || 1}</strong>
            </div>
          </div>

          <div className="topic-panel">
            <div className="topic-label">Debate topic</div>

            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter the topic you want to debate..."
            />
          </div>

          <div className="conversation">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-orb">
                  <span>◈</span>
                </div>

                <div className="empty-content">
                  <div className="empty-label">LARA is ready</div>
                  <h2>Open with your strongest point</h2>
                  <p>
                    Pick a topic and speak or type your opening argument.
                    LARA reads your reasoning and comes back with a real rebuttal.
                  </p>

                  <div className="feature-row">
                    <span>Voice input</span>
                    <span>AI reasoning</span>
                    <span>Voice output</span>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${message.role}`}
                >
                  <div className="message-top">
                    <div className="message-avatar">
                      {message.role === "user" ? "YOU" : "L"}
                    </div>

                    <div className="message-label">
                      {message.role === "user" ? "Your argument" : "LARA"}
                    </div>
                  </div>

                  <div className="message-text">
                    {message.text}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="message ai loading-message">
                <div className="message-top">
                  <div className="message-avatar">L</div>
                  <div className="message-label">LARA</div>
                </div>

                <div className="thinking">
                  <span></span>
                  <span></span>
                  <span></span>
                  <em>Analyzing your argument...</em>
                </div>
              </div>
            )}
          </div>

          <div className="composer">
            <div className="composer-tools">
              <VoiceRecorder
                onTranscript={(text) => setArgument(text)}
              />

              <div className="voice-status">
                {speaking ? (
                  <>
                    <span className="sound-wave">
                      <i></i>
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                    LARA is speaking
                  </>
                ) : (
                  "Voice ready"
                )}
              </div>
            </div>

            <div className="composer-box">
              <textarea
                placeholder="Present your argument..."
                value={argument}
                onChange={(e) => setArgument(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleDebate();
                  }
                }}
              />

              <button
                className="debate-button"
                onClick={handleDebate}
                disabled={loading}
              >
                <span>{loading ? "Thinking" : "DEBATE"}</span>
                <strong>→</strong>
              </button>
            </div>

            <div className="composer-hint">
              Press Enter to send · Shift + Enter for a new line
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Debate;
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
            <div className="nav-subtitle">AI VOICE DEBATE</div>
          </div>
        </div>

        <div className="nav-status">
          <span className="status-dot"></span>
          SYSTEM ONLINE
        </div>
      </header>

      <main className="main-layout">
        <aside className="sidebar">
          <div className="side-section">
            <div className="side-label">SESSION</div>

            <div className="session-card">
              <div className="session-icon">◉</div>
              <div>
                <strong>Live Debate</strong>
                <span>{messages.length ? `${round} rounds` : "Ready to begin"}</span>
              </div>
            </div>
          </div>

          <div className="side-section">
            <div className="side-label">LARA VOICE</div>

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
            <div className="side-label">CONTROLS</div>

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
              <div className="eyebrow">INTELLIGENT DEBATE SYSTEM</div>
              <h1>Challenge your thinking.</h1>
              <p>
                Present your argument. LARA will challenge it.
              </p>
            </div>

            <div className="round-badge">
              <span>ROUND</span>
              <strong>{round || 1}</strong>
            </div>
          </div>

          <div className="topic-panel">
            <div className="topic-label">DEBATE TOPIC</div>

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
                  <div className="empty-label">LARA IS READY</div>
                  <h2>Start the conversation</h2>
                  <p>
                    Choose a topic and present your opening argument.
                    LARA will analyze your reasoning and challenge your position.
                  </p>

                  <div className="feature-row">
                    <span>VOICE INPUT</span>
                    <span>AI REASONING</span>
                    <span>VOICE OUTPUT</span>
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
                      {message.role === "user" ? "YOUR ARGUMENT" : "LARA"}
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
                    LARA IS SPEAKING
                  </>
                ) : (
                  "VOICE READY"
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
                <span>{loading ? "THINKING" : "DEBATE"}</span>
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
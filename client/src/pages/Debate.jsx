import { useEffect, useState } from "react";
import { useDebate } from "../context/DebateContext";
import { sendDebateArgument } from "../services/api";
import VoiceRecorder from "../components/VoiceRecorder";
import ParticleField from "../components/ParticleField";
import VoiceOverlay from "../components/VoiceOverlay";

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
  const [voiceMenuOpen, setVoiceMenuOpen] = useState(false);

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
    if (loading) {
      return;
    }

    if (!topic.trim() || !argument.trim()) {
      alert("Give LARA a topic and something to argue first.");
      return;
    }

    const currentTopic = topic.trim();
    const currentArgument = argument.trim();

    setLoading(true);
    setIsDebating(true);

    const history = messages
      .slice(-10)
      .map((message) => {
        const speaker = message.role === "user" ? "USER" : "LARA";
        return `${speaker}: ${message.text}`;
      })
      .join("\n\n");

    try {
      const result = await sendDebateArgument({
        topic: currentTopic,
        history,
        userArgument: currentArgument
      });

      if (!result?.response?.trim()) {
        throw new Error("LARA went quiet. Try that again.");
      }

      addMessage({
        role: "user",
        text: currentArgument
      });

      addMessage({
        role: "ai",
        text: result.response
      });

      setArgument("");
      speak(result.response);
    } catch (error) {
      console.error("Debate request failed:", error);
      alert(error.message || "LARA couldn't get a word out. Check your connection and try again.");
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
  const lastAiMessage = [...messages].reverse().find((m) => m.role === "ai");
  const selectedVoiceDetails = voices.find((voice) => voice.name === selectedVoice);

  return (
    <div className="app">
      <ParticleField active={speaking} />

      <VoiceOverlay
        open={speaking}
        text={lastAiMessage ? lastAiMessage.text : "LARA is winding up..."}
        onStop={stopSpeaking}
      />

      <header className="navbar">
        <div className="brand">
          <div className="brand-mark">L</div>
          <div>
            <div className="logo">LARA</div>
            <div className="nav-subtitle">Your sparring partner</div>
          </div>
        </div>

        <div className="nav-status">
          <span className="status-dot"></span>
          In session
        </div>
      </header>

      <main className="main-layout">
        <aside className="sidebar">
          <div className="side-section">
            <div className="side-label">Your corner</div>

            <div className="session-card">
              <div className="session-icon">◉</div>
              <div>
                <strong>{messages.length ? "Bout in progress" : "Corner's empty"}</strong>
                <span>{messages.length ? `${round} rounds in` : "Give her a topic to start"}</span>
              </div>
            </div>
          </div>

          <div className="side-section">
            <div className="side-label">LARA's voice</div>

            <div className={`voice-picker ${voiceMenuOpen ? "is-open" : ""}`}>
              <button
                type="button"
                className="voice-picker__trigger"
                aria-expanded={voiceMenuOpen}
                onClick={() => setVoiceMenuOpen((open) => !open)}
              >
                <span className="voice-picker__icon">◌</span>
                <span className="voice-picker__current">
                  <strong>{selectedVoiceDetails?.name || "Default browser voice"}</strong>
                  <small>{selectedVoiceDetails?.lang || "System voice"}</small>
                </span>
                <span className="voice-picker__chevron">⌄</span>
              </button>

              {voiceMenuOpen && (
                <div className="voice-picker__menu">
                  <div className="voice-picker__menu-label">Pick who's talking back</div>

                  {voices.length === 0 ? (
                    <div className="voice-picker__empty">Default browser voice</div>
                  ) : (
                    voices.map((voice) => (
                      <button
                        type="button"
                        className={`voice-option ${voice.name === selectedVoice ? "is-selected" : ""}`}
                        key={`${voice.name}-${voice.lang}`}
                        onClick={() => {
                          setSelectedVoice(voice.name);
                          setVoiceMenuOpen(false);
                        }}
                      >
                        <span>
                          <strong>{voice.name}</strong>
                          <small>{voice.lang}</small>
                        </span>
                        {voice.name === selectedVoice && <b>✓</b>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="side-section">
            <div className="side-label">Controls</div>

            <button
              className="control-button"
              onClick={speaking ? stopSpeaking : () => messages.length && speak(messages[messages.length - 1].text)}
            >
              <span>{speaking ? "■" : "▶"}</span>
              {speaking ? "Cut her off" : "Replay last line"}
            </button>

            <button
              className="control-button danger"
              onClick={handleReset}
            >
              <span>↻</span>
              Clear the ring
            </button>
          </div>

          <div className="sidebar-bottom">
            <div className="lara-mini">
              <div className={`lara-orb ${speaking ? "speaking" : ""}`}>
                L
              </div>

              <div>
                <strong>LARA</strong>
                <span>{speaking ? "Talking now" : "Waiting on you"}</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="debate-area">
          <div className="debate-header">
            <div>
              <div className="tagline">you vs. an opponent who never gets tired</div>
              <h1>Pick a fight.<br />Back it up.</h1>
              <p>
                Throw out a topic, make your opening move, and LARA swings back
                immediately — out loud, with no script and no mercy.
              </p>
              <div className="hero-metrics" aria-label="Debate session details">
                <span><strong>{messages.length}</strong> lines thrown</span>
                <span><strong>{round || 1}</strong> round underway</span>
                <span><strong>0</strong> takebacks</span>
              </div>
            </div>

            <div className="round-badge">
              <span>Round</span>
              <strong>{round || 1}</strong>
            </div>
          </div>

          <div className="topic-panel">
            <div className="topic-heading">
              <div>
                <div className="topic-label">Tonight's motion</div>
                <span className="topic-helper">Set what you're fighting about before you swing.</span>
              </div>
            </div>

            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Cereal is a soup"
            />
          </div>

          <div className="conversation">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-visual">
                  <div className="empty-orb">
                    <span>◈</span>
                  </div>
                  <div className="orbit orbit-one"></div>
                  <div className="orbit orbit-two"></div>
                </div>

                <div className="empty-content">
                  <div className="empty-label">Corner's clear</div>
                  <h2>Throw the first punch</h2>
                  <p>
                    Set a topic above, then speak or type your opening argument.
                    LARA actually reads what you said and swings back with a real rebuttal —
                    not a summary of your point.
                  </p>

                  <div className="feature-row">
                    <span>Speak it</span>
                    <span>Get real pushback</span>
                    <span>Hear her fire back</span>
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
                      {message.role === "user" ? "You said" : "LARA fires back"}
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
                  <div className="message-label">LARA fires back</div>
                </div>

                <div className="thinking">
                  <span></span>
                  <span></span>
                  <span></span>
                  <em>Lining up a comeback...</em>
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
                    LARA is talking
                  </>
                ) : (
                  "Mic's ready when you are"
                )}
              </div>
            </div>

            <div className="composer-box">
              <textarea
                placeholder="What's your move?"
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
                <span>{loading ? "Sending" : "Swing"}</span>
                <strong>→</strong>
              </button>
            </div>

            <div className="composer-hint">
              Enter to send, Shift + Enter for a new line.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Debate;

import { useEffect, useState } from "react";
import { useDebate } from "../context/DebateContext";
import { estimateSpeechSeconds } from "../hooks/useSpeechSynthesis";
import { buildSpokenResponse, parseLaraResponse } from "../utils/laraResponse";
import { formatClock, formatTime } from "../utils/format";
import VoiceWaveform from "./VoiceWaveform";
import HighlightedText from "./HighlightedText";
import LaraFace from "./LaraFace";
import Icon from "./Icon";

function useNow(active) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [active]);

  return now;
}

// Live avatar: the waveform is LARA's measured stream audio and the clock is real elapsed time.
function AvatarPlayback({ message }) {
  const { voice, avatar, speakMessage, stopVoice } = useDebate();
  const status = voice.id === message.id ? voice.status : "idle";
  const speaking = status === "speaking";
  const busy = speaking || status === "pending";
  const now = useNow(speaking);
  const elapsed =
    voice.id === message.id && voice.startedAt ? ((voice.endedAt || now) - voice.startedAt) / 1000 : 0;

  return (
    <div className="playback">
      <button
        type="button"
        className="playback__toggle"
        onClick={busy ? stopVoice : () => speakMessage(message)}
        aria-label={busy ? "Stop LARA" : "Replay LARA's response"}
        title={busy ? "Stop LARA" : "Replay"}
      >
        <Icon name={busy ? "stop" : "replay"} size={18} />
      </button>

      <VoiceWaveform
        key={message.id}
        stream={avatar.media.stream}
        recording={speaking && !avatar.media.idleVideo}
      />

      <span className="playback__time">{status === "pending" ? "Starting..." : formatClock(elapsed)}</span>
    </div>
  );
}

// Browser speech fallback: progress follows the synthesizer's word boundaries.
function BrowserPlayback({ message }) {
  const { voice, speech, speakMessage } = useDebate();
  const isCurrent = voice.id === message.id;
  const status = isCurrent ? voice.status : "idle";
  const progress = isCurrent ? voice.progress : 0;
  const elapsed = isCurrent ? voice.elapsed : 0;

  let duration = isCurrent ? voice.estimate : estimateSpeechSeconds(buildSpokenResponse(message.text).text);

  if (status === "speaking" || status === "paused") {
    duration = progress > 0.15 ? Math.max(elapsed, elapsed / progress) : Math.max(elapsed, duration);
  }

  function handleToggle() {
    if (status === "speaking") {
      speech.pause();
    } else if (status === "paused") {
      speech.resume();
    } else {
      speakMessage(message);
    }
  }

  const label =
    status === "speaking" ? "Pause LARA" : status === "paused" ? "Resume LARA" : "Play LARA's response";

  return (
    <div className="playback">
      <button
        type="button"
        className="playback__toggle"
        onClick={handleToggle}
        disabled={!speech.supported || speech.muted}
        aria-label={label}
        title={speech.muted ? "LARA is muted" : label}
      >
        <Icon name={status === "speaking" ? "pause" : "play"} size={18} />
      </button>

      <span className="playback__track" aria-hidden="true">
        <i style={{ width: `${Math.min(1, progress) * 100}%` }} />
      </span>

      <span className="playback__time">
        {speech.muted
          ? "Muted"
          : `${formatClock(elapsed)} / ${status === "ended" ? "" : "~"}${formatClock(duration)}`}
      </span>
    </div>
  );
}

function PlaybackBar({ message }) {
  const { voice, avatar } = useDebate();
  const source = voice.id === message.id ? voice.source : avatar.engaged ? "avatar" : "browser";

  return source === "avatar" ? <AvatarPlayback message={message} /> : <BrowserPlayback message={message} />;
}

function ResponseCard() {
  const {
    session,
    messages,
    loading,
    pendingArgument,
    error,
    dismissError,
    submitArgument,
    voice
  } = useDebate();

  const latest = [...messages].reverse().find((message) => message.role === "ai");
  const isSpeakingLatest = Boolean(
    latest && voice.id === latest.id && (voice.status === "speaking" || voice.status === "paused")
  );
  const inChallenge = isSpeakingLatest && voice.inChallenge;

  let content;

  if (loading) {
    const round = messages.filter((message) => message.role === "user").length + 1;

    content = (
      <>
        <header className="response-card__head">
          <LaraFace size="md" />
          <strong>LARA</strong>
          <span className="response-card__round">Round {round}</span>
        </header>
        <p className="response-card__thinking">
          Weighing your argument
          <span className="thinking-dots">
            <i />
            <i />
            <i />
          </span>
        </p>
        <blockquote className="response-card__quote">{pendingArgument}</blockquote>
      </>
    );
  } else if (latest) {
    const { counter, challenge } = parseLaraResponse(latest.text);

    content = (
      <>
        <header className="response-card__head">
          <LaraFace size="md" active={isSpeakingLatest} />
          <strong>LARA</strong>
          <time>{formatTime(latest.at)}</time>
          <span className="response-card__round">Round {latest.round}</span>
        </header>
        <div className="response-card__scroll" key={latest.id}>
          <p className={`response-card__text ${isSpeakingLatest && !inChallenge ? "is-spoken" : ""}`}>
            <HighlightedText text={counter} />
          </p>
        </div>
        {challenge && (
          <div className={`response-card__challenge ${inChallenge ? "is-spoken" : ""}`}>
            <span className="section-label">Challenge</span>
            <p>
              <HighlightedText text={challenge} />
            </p>
          </div>
        )}
        <PlaybackBar message={latest} />
      </>
    );
  } else if (session) {
    content = (
      <div className="response-card__intro">
        <span className="eyebrow">Opening statement</span>
        <p>
          The floor is yours. Make your opening argument on{" "}
          <strong>&ldquo;{session.topic}&rdquo;</strong>. LARA will take the opposing side.
        </p>
      </div>
    );
  } else {
    content = (
      <div className="response-card__intro">
        <span className="eyebrow">Ready when you are</span>
        <p>
          Pick a field, choose a level and enter any topic. LARA will argue the other side
          and challenge you, round after round.
        </p>
      </div>
    );
  }

  return (
    <section
      className={`panel response-card ${isSpeakingLatest ? "is-speaking" : ""}`}
      aria-label="LARA's latest response"
      aria-live="polite"
    >
      {error && (
        <div className="inline-alert" role="alert">
          <Icon name="alert" size={18} />
          <span>{error}</span>
          <button type="button" className="inline-alert__action" onClick={submitArgument}>
            Try again
          </button>
          <button
            type="button"
            className="inline-alert__close"
            onClick={dismissError}
            aria-label="Dismiss error"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {content}
    </section>
  );
}

export default ResponseCard;

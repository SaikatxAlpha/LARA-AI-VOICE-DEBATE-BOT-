import { useEffect, useRef, useState } from "react";
import { useDebate } from "../context/DebateContext";
import { useMicLevel, useStreamLevel } from "../hooks/useAudioLevel";
import { LARA } from "../config/lara";
import { formatClock } from "../utils/format";
import LaraFace from "./LaraFace";
import LaraFigure from "./LaraFigure";
import LevelMeter from "./LevelMeter";
import Icon from "./Icon";

// Renders the provider's live MediaStream. Legacy streams hand over the agent's idle clip
// between answers, which plays muted on a loop.
function LiveVideo({ media, muted }) {
  const videoRef = useRef(null);
  const [blocked, setBlocked] = useState(false);
  const idle = Boolean(media.idleVideo);

  useEffect(() => {
    const video = videoRef.current;

    if (idle) {
      video.srcObject = null;
      video.src = media.idleVideo;
    } else {
      video.removeAttribute("src");
      video.srcObject = media.stream;
    }
  }, [media, idle]);

  useEffect(() => {
    const video = videoRef.current;
    video.muted = muted || idle || blocked;

    video.play().catch((playError) => {
      if (playError.name === "NotAllowedError" && !video.muted) {
        setBlocked(true);
      }
    });
  }, [media, muted, idle, blocked]);

  return (
    <>
      <video ref={videoRef} className="live-feed__video" autoPlay playsInline loop={idle} />
      {blocked && (
        <button type="button" className="live-feed__unmute" onClick={() => setBlocked(false)}>
          <Icon name="volume" size={18} />
          Click to hear LARA
        </button>
      )}
    </>
  );
}

function StreamMeter({ stream }) {
  return <LevelMeter level={useStreamLevel(stream)} bars={4} />;
}

function SessionClock({ startedAt }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="live-feed__clock">
      <i />
      {formatClock((now - startedAt) / 1000)}
    </span>
  );
}

function CallTile({ active, busy, title, children, action }) {
  return (
    <div className="live-feed__tile">
      <span className={`live-feed__tile-ring ${busy ? "is-busy" : ""}`}>
        <LaraFace size="xl" active={active} />
      </span>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

function describeTile({ avatar, inSession, onReconnect }) {
  const { connection } = avatar;

  if (connection === "connecting") {
    return { busy: true, title: "Connecting to LARA..." };
  }

  if (connection === "standby") {
    return {
      title: "LARA's video paused after a quiet spell",
      text: "She reconnects with her next reply.",
      action: (
        <button type="button" className="ghost-button" onClick={onReconnect}>
          Reconnect now
        </button>
      )
    };
  }

  return {
    title: inSession ? "LARA's video is starting" : "LARA joins when the debate starts",
    text: inSession ? "" : "Her live video connects as soon as you press Start Debate."
  };
}

function LiveAvatar({ presence, cameraOff, session }) {
  const { avatar, speech, voice } = useDebate();
  const { connection, media } = avatar;
  const speaking = presence === "speaking";
  const micLevel = useMicLevel(presence === "listening");
  // LARA's built-in figure is her live presence unless a streaming provider is set up and working.
  const streaming = avatar.availability.status === "available" && connection !== "failed";
  const hasVideo = streaming && connection === "live" && Boolean(media.stream || media.idleVideo);
  const voicedByBrowser = voice.source === "browser";

  let tile = null;

  if (cameraOff) {
    tile = { title: `${LARA.name}'s camera is off` };
  } else if (streaming && !hasVideo) {
    tile = describeTile({ avatar, inSession: Boolean(session), onReconnect: avatar.prepare });
  }

  return (
    <div className={`live-feed is-${presence} ${hasVideo && !cameraOff ? "has-video" : ""}`}>
      {hasVideo && (
        <div className={cameraOff ? "live-feed__hidden" : "live-feed__stage"}>
          <LiveVideo media={media} muted={speech.muted || avatar.silenced} />
        </div>
      )}

      {!streaming && !cameraOff && (
        <LaraFigure
          presence={presence}
          micLevel={micLevel}
          paused={voice.status === "paused"}
          spokenText={voicedByBrowser ? speech.playback.text : ""}
          charIndex={voicedByBrowser ? speech.playback.charIndex : 0}
        />
      )}

      {tile && (
        <CallTile active={speaking} busy={tile.busy} title={tile.title} action={tile.action}>
          {tile.text}
        </CallTile>
      )}

      <div className="live-feed__vignette" />

      {session && <SessionClock startedAt={session.startedAt} />}

      <div className="live-feed__badges">
        {speech.muted && (
          <span className="live-feed__badge">
            <Icon name="volumeOff" size={14} />
            Muted
          </span>
        )}

        {connection === "failed" && avatar.availability.status === "available" && (
          <button type="button" className="live-feed__badge is-action" onClick={() => avatar.retry().catch(() => {})}>
            <Icon name="replay" size={14} />
            Streaming video failed · Retry
          </button>
        )}
      </div>

      {presence === "listening" && (
        <div className="live-feed__hint">
          <LevelMeter level={micLevel} />
          Listening to you
        </div>
      )}

      {presence === "thinking" && (
        <div className="live-feed__hint">
          <span className="thinking-dots">
            <i />
            <i />
            <i />
          </span>
          {avatar.playback.status === "pending" ? "Getting ready to answer" : "Considering your argument"}
        </div>
      )}

      <div className="live-feed__name">
        {LARA.name}
        {speaking && hasVideo && !cameraOff && !media.idleVideo && <StreamMeter stream={media.stream} />}
      </div>
    </div>
  );
}

export default LiveAvatar;

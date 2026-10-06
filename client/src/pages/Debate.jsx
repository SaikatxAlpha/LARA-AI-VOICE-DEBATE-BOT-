import { useState } from "react";
import { useDebate } from "../context/DebateContext";
import { getField, getLevel, resolveFieldLabel } from "../config/debateOptions";
import DebateSetup from "../components/DebateSetup";
import SpeakingIndicator from "../components/SpeakingIndicator";
import LiveAvatar from "../components/LiveAvatar";
import CallControls from "../components/CallControls";
import ResponseCard from "../components/ResponseCard";
import DebateProgress from "../components/DebateProgress";
import ConversationPanel from "../components/ConversationPanel";
import VoiceComposer from "../components/VoiceComposer";
import LevelBars from "../components/LevelBars";
import Icon from "../components/Icon";

function Debate() {
  const { setup, session, presence, speech, endDebate } = useDebate();
  const [cameraOff, setCameraOff] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);

  const fieldId = session ? session.field : setup.field;
  const level = getLevel(session ? session.level : setup.level);
  const fieldLabel = session
    ? session.fieldLabel
    : setup.field && resolveFieldLabel(setup.field, setup.customField);

  return (
    <main className={`debate-layout ${session ? "is-live" : ""}`}>
      <DebateSetup />

      <section className="panel stage" aria-label="Live debate with LARA">
        <div className="stage__header">
          <SpeakingIndicator presence={presence} inSession={Boolean(session)} />

          <div className="stage__meta">
            <span>
              <LevelBars value={level?.bars || 0} />
              Level: <strong>{level?.label || "Not set"}</strong>
            </span>
            <span className="stage__meta-divider" />
            <span>
              <Icon name={getField(fieldId)?.icon || "laptop"} size={16} />
              Field: <strong>{fieldLabel || "Not set"}</strong>
            </span>
          </div>
        </div>

        <LiveAvatar presence={presence} cameraOff={cameraOff} session={session} />

        <CallControls
          muted={speech.muted}
          onToggleMute={() => speech.setMuted(!speech.muted)}
          cameraOff={cameraOff}
          onToggleCamera={() => setCameraOff((current) => !current)}
          inSession={Boolean(session)}
          onEnd={endDebate}
        />

        <ResponseCard />
      </section>

      <aside className="rail" aria-label="Debate progress and conversation">
        <DebateProgress />
        <ConversationPanel
          expanded={conversationOpen}
          onToggle={() => setConversationOpen((current) => !current)}
        />
        <VoiceComposer />
      </aside>
    </main>
  );
}

export default Debate;

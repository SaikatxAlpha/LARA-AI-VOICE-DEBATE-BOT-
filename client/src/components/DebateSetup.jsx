import { useState } from "react";
import { useDebate } from "../context/DebateContext";
import { getLevel } from "../config/debateOptions";
import FieldSelector from "./FieldSelector";
import LevelSelector from "./LevelSelector";
import TopicInput from "./TopicInput";
import Icon from "./Icon";

function SetupStep({ index, title, error, children }) {
  return (
    <section className="setup-step">
      <h2 className="setup-step__title">
        <span className="step-index">{index}</span>
        {title}
      </h2>
      {children}
      {error && (
        <p className="field-error" role="alert">
          <Icon name="alert" size={14} />
          {error}
        </p>
      )}
    </section>
  );
}

function DebateSetup() {
  const { setup, updateSetup, validation, session, startDebate, newDebate } = useDebate();
  const [expanded, setExpanded] = useState(false);
  const locked = Boolean(session);
  const open = !locked || expanded;

  function handleStart() {
    if (startDebate()) {
      setExpanded(false);
    } else {
      requestAnimationFrame(() =>
        document
          .querySelector(".setup-panel .field-error")
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
      );
    }
  }

  return (
    <aside className={`panel setup-panel ${open ? "is-expanded" : ""}`} aria-label="Debate setup">
      <div className="setup-panel__top">
        <button type="button" className="new-debate-button" onClick={newDebate}>
          <Icon name="plus" size={18} />
          New Debate
        </button>

        {locked && (
          <button
            type="button"
            className="panel-toggle"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={open}
          >
            <span>
              {session.fieldLabel} · {getLevel(session.level)?.label}
            </span>
            <Icon name="chevronDown" size={18} />
          </button>
        )}
      </div>

      <div className="setup-panel__body">
        {locked && (
          <p className="setup-lock">
            <Icon name="lock" size={14} />
            Setup is locked while you debate. End the debate or start a new one to change it.
          </p>
        )}

        <SetupStep index={1} title="Select Field" error={validation.field}>
          <FieldSelector
            value={setup.field}
            customValue={setup.customField}
            onChange={(field) => updateSetup({ field })}
            onCustomChange={(customField) => updateSetup({ customField })}
            disabled={locked}
            invalid={Boolean(validation.field)}
          />
        </SetupStep>

        <SetupStep index={2} title="Choose Level" error={validation.level}>
          <LevelSelector
            value={setup.level}
            onChange={(level) => updateSetup({ level })}
            disabled={locked}
            invalid={Boolean(validation.level)}
          />
        </SetupStep>

        <SetupStep index={3} title="Enter Debate Topic" error={validation.topic}>
          <TopicInput
            value={setup.topic}
            onChange={(topic) => updateSetup({ topic })}
            onSubmit={handleStart}
            disabled={locked}
            invalid={Boolean(validation.topic)}
          />
        </SetupStep>
      </div>

      <div className="setup-panel__footer">
        <button type="button" className="start-button" onClick={handleStart} disabled={locked}>
          <Icon name="play" size={16} />
          {locked ? "Debate in progress" : "Start Debate"}
        </button>
      </div>
    </aside>
  );
}

export default DebateSetup;

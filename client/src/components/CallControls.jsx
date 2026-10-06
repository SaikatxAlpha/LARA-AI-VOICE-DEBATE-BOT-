import Icon from "./Icon";

function CallControls({ muted, onToggleMute, cameraOff, onToggleCamera, inSession, onEnd }) {
  return (
    <div className="call-controls">
      <button
        type="button"
        className={`call-button ${muted ? "is-on" : ""}`}
        onClick={onToggleMute}
        aria-pressed={muted}
      >
        <span className="call-button__icon">
          <Icon name={muted ? "volumeOff" : "volume"} />
        </span>
        {muted ? "Unmute LARA" : "Mute LARA"}
      </button>

      <button
        type="button"
        className="call-button call-button--end"
        onClick={onEnd}
        disabled={!inSession}
      >
        <span className="call-button__icon">
          <Icon name="hangUp" size={22} />
        </span>
        End Debate
      </button>

      <button
        type="button"
        className={`call-button ${cameraOff ? "is-on" : ""}`}
        onClick={onToggleCamera}
        aria-pressed={cameraOff}
      >
        <span className="call-button__icon">
          <Icon name={cameraOff ? "videoOff" : "video"} />
        </span>
        {cameraOff ? "Camera On" : "Camera Off"}
      </button>
    </div>
  );
}

export default CallControls;

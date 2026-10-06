import { toSegments } from "../utils/laraResponse";

function HighlightedText({ text }) {
  return toSegments(text).map((segment, index) =>
    segment.highlight ? (
      <mark key={index} className="key-phrase">
        {segment.text}
      </mark>
    ) : (
      <span key={index}>{segment.text}</span>
    )
  );
}

export default HighlightedText;

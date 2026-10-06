import { useEffect, useState } from "react";

const SAMPLE_INTERVAL_MS = 60;

// Live RMS level (0–1) of the audio in `stream`, measured with WebAudio.
export function useStreamLevel(stream) {
  const [level, setLevel] = useState(0);
  const hasAudio = Boolean(stream?.getAudioTracks().length);

  useEffect(() => {
    if (!stream || !hasAudio) {
      return undefined;
    }

    const audioContext = new AudioContext();
    audioContext.resume().catch(() => {});
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    audioContext.createMediaStreamSource(stream).connect(analyser);

    const samples = new Uint8Array(analyser.fftSize);

    const timer = window.setInterval(() => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;

      for (const sample of samples) {
        const value = (sample - 128) / 128;
        sum += value * value;
      }

      setLevel(Math.min(1, Math.sqrt(sum / samples.length) * 5));
    }, SAMPLE_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      audioContext.close();
    };
  }, [stream, hasAudio]);

  return stream && hasAudio ? level : 0;
}

// Live microphone level while `active` is true.
export function useMicLevel(active) {
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (!active || !navigator.mediaDevices?.getUserMedia) {
      return undefined;
    }

    let cancelled = false;
    let mediaStream = null;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((granted) => {
        mediaStream = granted;

        if (cancelled) {
          granted.getTracks().forEach((track) => track.stop());
        } else {
          setStream(granted);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      mediaStream?.getTracks().forEach((track) => track.stop());
      setStream(null);
    };
  }, [active]);

  return useStreamLevel(active ? stream : null);
}

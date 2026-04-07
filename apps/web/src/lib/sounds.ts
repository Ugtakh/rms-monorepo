"use client";

const canUseAudio = () => typeof window !== "undefined";

type Tone = {
  frequency: number;
  durationMs: number;
  type?: OscillatorType;
  gain?: number;
};

function playToneSequence(tones: Tone[]) {
  if (!canUseAudio()) return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) return;

    const context = new AudioCtx();
    let offset = 0;

    tones.forEach((tone) => {
      const osc = context.createOscillator();
      const gain = context.createGain();

      const start = context.currentTime + offset;
      const end = start + tone.durationMs / 1000;

      osc.type = tone.type ?? "sine";
      osc.frequency.setValueAtTime(tone.frequency, start);

      const peak = tone.gain ?? 0.2;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, end);

      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(start);
      osc.stop(end);

      offset += tone.durationMs / 1000 + 0.04;
    });

    const totalDuration = tones.reduce((sum, t) => sum + t.durationMs, 0) + tones.length * 40;

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, totalDuration + 200);
  } catch {
    // Ignore browser audio restrictions/errors.
  }
}

export function playOrderPlacedSound() {
  playToneSequence([
    { frequency: 784, durationMs: 120, type: "triangle", gain: 0.16 },
    { frequency: 988, durationMs: 130, type: "triangle", gain: 0.18 },
    { frequency: 1175, durationMs: 180, type: "sine", gain: 0.2 }
  ]);
}

export function playPaymentSuccessSound() {
  playToneSequence([
    { frequency: 659, durationMs: 90, type: "sine", gain: 0.15 },
    { frequency: 831, durationMs: 100, type: "sine", gain: 0.17 },
    { frequency: 1047, durationMs: 120, type: "triangle", gain: 0.2 },
    { frequency: 1319, durationMs: 180, type: "triangle", gain: 0.22 }
  ]);
}

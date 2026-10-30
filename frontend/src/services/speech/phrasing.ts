/**
 * Phrasing from the audio itself (no React Native imports; tested in speech-engine/).
 *
 * Whisper's word timestamps are contiguous (silence is folded into word durations), so
 * pauses are measured here with RMS energy on 20 ms frames and then attached to the gap
 * between aligned words whose Whisper boundary is nearest.
 */
import type { AlignedWord } from './align';

export interface Silence {
  startMs: number;
  endMs: number;
}

export interface SilenceOptions {
  frameMs: number;
  /** silences shorter than this are ignored (stop consonants, breaths) */
  minSilenceMs: number;
  /** frame is silent below noiseFloor + this many dB (floor = 10th percentile frame) */
  marginDb: number;
}

export const DEFAULT_SILENCE_OPTIONS: SilenceOptions = { frameMs: 20, minSilenceMs: 150, marginDb: 10 };

/** Mono PCM samples in [-1, 1] -> silent intervals. */
export function detectSilences(samples: Float32Array, sampleRate: number, opts: SilenceOptions = DEFAULT_SILENCE_OPTIONS): Silence[] {
  const frame = Math.max(1, Math.round((sampleRate * opts.frameMs) / 1000));
  const db: number[] = [];
  for (let s = 0; s + frame <= samples.length; s += frame) {
    let sum = 0;
    for (let k = s; k < s + frame; k++) sum += samples[k] * samples[k];
    db.push(10 * Math.log10(sum / frame + 1e-12));
  }
  if (!db.length) return [];
  const sorted = [...db].sort((a, b) => a - b);
  const threshold = sorted[Math.floor(sorted.length * 0.1)] + opts.marginDb;

  const out: Silence[] = [];
  let runStart = -1;
  for (let f = 0; f <= db.length; f++) {
    const silent = f < db.length && db[f] < threshold;
    if (silent && runStart < 0) runStart = f;
    if (!silent && runStart >= 0) {
      const ms = (f - runStart) * opts.frameMs;
      if (ms >= opts.minSilenceMs) out.push({ startMs: runStart * opts.frameMs, endMs: f * opts.frameMs });
      runStart = -1;
    }
  }
  return out;
}

export type BoundaryKind = 'fullStop' | 'comma' | 'mid';

export interface Boundary {
  /** index of the word before the gap */
  after: number;
  kind: BoundaryKind;
  pauseMs: number;
}

export interface PhrasingOptions {
  /** a full stop with less silence than this was read through */
  fullStopMinPauseMs: number;
  /** a mid-sentence gap with more silence than this is a long pause */
  longPauseMs: number;
}

export const DEFAULT_PHRASING_OPTIONS: PhrasingOptions = { fullStopMinPauseMs: 250, longPauseMs: 700 };

export interface Phrasing {
  boundaries: Boundary[];
  /** word indexes whose full stop the child ran through */
  ranThroughFullStops: number[];
  /** word indexes followed by a long mid-sentence pause */
  longPauses: number[];
}

function kindOf(word: string): BoundaryKind {
  const w = word.replace(/["”’')\]]+$/, '');
  if (/[.!?]$/.test(w)) return 'fullStop';
  if (/[,;:]$/.test(w)) return 'comma';
  return 'mid';
}

export function analysePhrasing(
  results: AlignedWord[],
  targetStoryText: string,
  silences: Silence[],
  opts: PhrasingOptions = DEFAULT_PHRASING_OPTIONS,
): Phrasing {
  const target = targetStoryText.split(/\s+/).filter(Boolean);
  const timed = results.filter((w) => w.startMs !== undefined && w.endMs !== undefined);

  // gaps between consecutive timed words; Whisper's boundary time is where the next word starts
  const gaps = timed.slice(0, -1).map((w, k) => ({ after: w.index, at: timed[k + 1].startMs!, pauseMs: 0 }));
  for (const s of silences) {
    if (!gaps.length) break;
    const mid = (s.startMs + s.endMs) / 2;
    let best = gaps[0];
    for (const g of gaps) if (Math.abs(g.at - mid) < Math.abs(best.at - mid)) best = g;
    // a silence far from every boundary is inside a stretched word; don't count it
    if (Math.abs(best.at - mid) <= (s.endMs - s.startMs) / 2 + 400) best.pauseMs += s.endMs - s.startMs;
  }

  const boundaries: Boundary[] = gaps.map((g) => ({ after: g.after, kind: kindOf(target[g.after] ?? ''), pauseMs: g.pauseMs }));
  return {
    boundaries,
    ranThroughFullStops: boundaries.filter((b) => b.kind === 'fullStop' && b.pauseMs < opts.fullStopMinPauseMs).map((b) => b.after),
    longPauses: boundaries.filter((b) => b.kind === 'mid' && b.pauseMs > opts.longPauseMs).map((b) => b.after),
  };
}

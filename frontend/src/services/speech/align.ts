/**
 * Pure word alignment for the speech engine (no React Native imports, so the Node harness
 * in speech-engine/ tests exactly this code).
 *
 * Target words come from the story text split on whitespace, the same way storyWords()
 * does, so `index` here matches the UI's word index.
 */

export type InternalStatus = 'correct' | 'misread' | 'missed' | 'uncertain';

/** One recognised word, optionally with Whisper timestamps. */
export interface HeardWord {
  text: string;
  startMs?: number;
  endMs?: number;
}

export interface AlignedWord {
  index: number;
  /** word exactly as written in the story */
  word: string;
  status: InternalStatus;
  /** what Whisper heard for this word (joined if it split the word), null if missed */
  heard: string | null;
  similarity: number;
  /** Whisper time span of the heard word, if timestamps exist */
  startMs?: number;
  endMs?: number;
  /** duration of the heard word, if timestamps exist */
  durationMs?: number;
  /** silence between the previous heard word and this one, if timestamps exist */
  pauseBeforeMs?: number;
  /**
   * Soft hint, experimental: the child likely took a while on this word (Whisper heard it in
   * two pieces that don't join up exactly, or a false start of it right before). Never counts
   * against the child.
   */
  hesitated?: boolean;
}

export interface AlignOptions {
  /** similarity >= this is correct */
  correctAt: number;
  /** similarity < this is misread; between the two is uncertain */
  misreadBelow: number;
}

// Tuned against the human-verified reviews; see speech-engine/docs/speech-results.md.
export const DEFAULT_ALIGN_OPTIONS: AlignOptions = { correctAt: 0.8, misreadBelow: 0.5 };

const APOSTROPHES = /[‘’ʼʻ`´]/g;

/**
 * Lowercase, unify apostrophes, strip punctuation. Keeps the apostrophe inside "ng'".
 * "Ng’ombe," -> "ng'ombe"
 */
export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .replace(APOSTROPHES, "'")
    .replace(/[^\p{L}\p{N}']/gu, '')
    .replace(/^'+|'+$/g, '');
}

/**
 * Comparison key: also drops apostrophes, so "ng'ombe", "ngombe" and Whisper's
 * occasional "ng ombe" (re-joined by the aligner's merge step) all compare equal.
 */
export function compareKey(w: string): string {
  return normalizeWord(w).replace(/'/g, '');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** 1 = identical, 0 = nothing in common (normalised edit distance on comparison keys). */
export function similarity(a: string, b: string): number {
  const ka = compareKey(a);
  const kb = compareKey(b);
  if (!ka.length && !kb.length) return 1;
  return 1 - levenshtein(ka, kb) / Math.max(ka.length, kb.length);
}

/** Split a transcript into heard words (no timestamps). */
export function wordsFromText(text: string): HeardWord[] {
  return text.split(/\s+/).filter((t) => normalizeWord(t).length > 0).map((t) => ({ text: t }));
}

const GAP = 1; // cost of a skipped target word or an extra heard word

type Move = 'match' | 'merge' | 'skipTarget' | 'skipHeard';

/**
 * Needleman-Wunsch over words. Substitution cost = 1 - similarity, so near-misses align
 * with the word they were meant to be. 'merge' lets one target word align with two heard
 * words, which covers a child sounding a long word out in pieces ("ilinicheza cheza").
 */
export function alignWords(targetText: string, heard: HeardWord[], opts: AlignOptions = DEFAULT_ALIGN_OPTIONS): AlignedWord[] {
  const target = targetText.split(/\s+/).filter(Boolean);
  const hw = heard.filter((h) => normalizeWord(h.text).length > 0);
  const n = target.length;
  const m = hw.length;

  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
  const move: Move[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill('match'));
  cost[0][0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      const here = cost[i][j];
      if (here === Infinity) continue;
      const relax = (ni: number, nj: number, c: number, mv: Move) => {
        if (here + c < cost[ni][nj]) {
          cost[ni][nj] = here + c;
          move[ni][nj] = mv;
        }
      };
      if (i < n && j < m) relax(i + 1, j + 1, 1 - similarity(target[i], hw[j].text), 'match');
      // Merge only when neither piece alone already matches; otherwise a filler like "eee"
      // would get glued onto a correctly read word. Small surcharge so 1:1 wins ties.
      if (i < n && j + 1 < m
        && similarity(target[i], hw[j].text) < opts.correctAt
        && similarity(target[i], hw[j + 1].text) < opts.correctAt) {
        relax(i + 1, j + 2, 1 - similarity(target[i], hw[j].text + hw[j + 1].text) + 0.05, 'merge');
      }
      if (i < n) relax(i + 1, j, GAP, 'skipTarget');
      if (j < m) relax(i, j + 1, GAP, 'skipHeard');
    }
  }

  // backtrace; spans[k] holds the heard-word time span of out[k], for the pause pass
  const out: AlignedWord[] = [];
  const spans: { start?: number; end?: number }[] = [];
  const push = (w: AlignedWord, parts: HeardWord[] = []) => {
    out.push(w);
    spans.push({ start: parts[0]?.startMs, end: parts[parts.length - 1]?.endMs });
  };
  // extra heard words, keyed by the target word they precede (false starts, repeats)
  const extrasBefore = new Map<number, HeardWord[]>();
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const mv = move[i][j];
    if (i > 0 && j > 0 && mv === 'match') {
      const parts = [hw[j - 1]];
      push(classify(i - 1, target[i - 1], parts, opts), parts);
      i--; j--;
    } else if (i > 0 && j > 1 && mv === 'merge') {
      const parts = [hw[j - 2], hw[j - 1]];
      push(classify(i - 1, target[i - 1], parts, opts), parts);
      i--; j -= 2;
    } else if (i > 0 && (mv === 'skipTarget' || j === 0)) {
      push({ index: i - 1, word: target[i - 1], status: normalizeWord(target[i - 1]) ? 'missed' : 'correct', heard: null, similarity: 0 });
      i--;
    } else {
      // extra heard word: not a target word, but kept as a possible false start of target i
      if (i < n) extrasBefore.set(i, [hw[j - 1], ...(extrasBefore.get(i) ?? [])]);
      j--;
    }
  }
  out.reverse();
  spans.reverse();

  for (const w of out) {
    if (w.status === 'missed') continue;
    const key = compareKey(w.word);
    const falseStart = (extrasBefore.get(w.index) ?? []).some((h) => {
      const k = compareKey(h.text);
      return similarity(k, key) >= 0.5 || (k.length >= 2 && key.startsWith(k));
    });
    // two pieces that join up to the exact word are just Whisper's token split, not sounding out
    const soundedOut = (w.heard?.includes(' ') ?? false) && w.similarity < 1;
    w.hesitated = falseStart || soundedOut;
  }

  let prevEnd: number | undefined;
  out.forEach((w, k) => {
    const { start, end } = spans[k];
    if (start !== undefined && end !== undefined) {
      w.startMs = start;
      w.endMs = end;
      w.durationMs = Math.max(0, end - start);
    }
    if (start !== undefined && prevEnd !== undefined) w.pauseBeforeMs = Math.max(0, start - prevEnd);
    if (end !== undefined) prevEnd = end;
  });
  return out;
}

function classify(index: number, word: string, parts: HeardWord[], opts: AlignOptions): AlignedWord {
  const sim = similarity(word, parts.map((p) => p.text).join(''));
  const status: InternalStatus = sim >= opts.correctAt ? 'correct' : sim < opts.misreadBelow ? 'misread' : 'uncertain';
  return { index, word, status, heard: parts.map((p) => p.text).join(' '), similarity: Math.round(sim * 1000) / 1000 };
}

/** Frontend contract mapping: never mark a child wrong when unsure. */
export function toFrontendStatus(s: InternalStatus): 'correct' | 'missed' {
  return s === 'misread' || s === 'missed' ? 'missed' : 'correct';
}

/**
 * Conservative statuses for the UI: a fluent child must almost never be marked wrong, and a
 * real struggle the engine lets through can still be recorded with Help.
 * A word is 'missed' only if it is misread/missed (never uncertain), sits in a run of at most
 * two such words, and the words on both sides of the run were read correctly. Anything else,
 * including a mismatch inside a run of misaligned words, counts as correct.
 */
export const MAX_MISSED_RUN = 2;

export function conservativeStatuses(words: AlignedWord[]): ('correct' | 'missed')[] {
  const out = words.map(() => 'correct' as 'correct' | 'missed');
  let k = 0;
  while (k < words.length) {
    if (words[k].status === 'correct') { k++; continue; }
    let end = k;
    while (end < words.length && words[end].status !== 'correct') end++;
    const run = words.slice(k, end);
    const anchored = k > 0 && end < words.length; // neighbours are correct by construction
    const strong = run.every((w) => w.status === 'misread' || w.status === 'missed');
    if (anchored && strong && run.length <= MAX_MISSED_RUN) for (let r = k; r < end; r++) out[r] = 'missed';
    k = end;
  }
  return out;
}

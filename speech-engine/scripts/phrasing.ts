/**
 * Evaluate pause / phrasing detection against the human reviews.
 *
 *   npx tsx scripts/phrasing.ts data/child2.wav out/child2.small.heard.json data/child2-misreads.txt [--sweep]
 *
 * WAV must be 16-bit PCM mono (data/*.wav are). Prints indexes and numbers only, never passage text.
 */
import { readFileSync } from 'node:fs';
import { alignWords, type HeardWord } from '../../frontend/src/services/speech/align.ts';
import {
  analysePhrasing, DEFAULT_PHRASING_OPTIONS, DEFAULT_SILENCE_OPTIONS, detectSilences,
  type PhrasingOptions, type SilenceOptions,
} from '../../frontend/src/services/speech/phrasing.ts';

export interface PhrasingTruth {
  longPauses: Set<number>; // 0-based index of the word before the pause
  ranThrough: Set<number>; // 0-based index of the word whose full stop was read through
}

export function parsePhrasingReview(text: string): PhrasingTruth {
  const gt: PhrasingTruth = { longPauses: new Set(), ranThrough: new Set() };
  let section: keyof PhrasingTruth | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (/^#\s*long mid-sentence pause/i.test(line)) section = 'longPauses';
    else if (/^#\s*ran through full stop/i.test(line)) section = 'ranThrough';
    else if (/^#/.test(line)) section = null;
    else if (section) {
      const m = line.match(/(\d+)/); // first number: "between 9 and 10:" -> 9, "after 45:" -> 45
      if (m) gt[section].add(Number(m[1]) - 1);
    }
  }
  return gt;
}

export function readWav16Mono(path: string): { samples: Float32Array; sampleRate: number } {
  const b = readFileSync(path);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error('not a WAV');
  let off = 12;
  let sampleRate = 0;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === 'fmt ') {
      if (b.readUInt16LE(off + 8) !== 1 || b.readUInt16LE(off + 10) !== 1 || b.readUInt16LE(off + 22) !== 16) throw new Error('need 16-bit PCM mono');
      sampleRate = b.readUInt32LE(off + 12);
    } else if (id === 'data') {
      const n = Math.floor(Math.min(size, b.length - off - 8) / 2);
      const samples = new Float32Array(n);
      for (let k = 0; k < n; k++) samples[k] = b.readInt16LE(off + 8 + 2 * k) / 32768;
      return { samples, sampleRate };
    }
    off += 8 + size + (size % 2);
  }
  throw new Error('no data chunk');
}

const prf = (found: number[], truth: Set<number>) => {
  const tp = found.filter((i) => truth.has(i)).length;
  return { tp, fp: found.length - tp, fn: truth.size - tp };
};

export function evaluate(wav: string, heardPath: string, reviewPath: string, sOpts: SilenceOptions, pOpts: PhrasingOptions) {
  const { samples, sampleRate } = readWav16Mono(wav);
  const target = readFileSync('data/reading.txt', 'utf8');
  const heard: HeardWord[] = JSON.parse(readFileSync(heardPath, 'utf8'));
  const gt = parsePhrasingReview(readFileSync(reviewPath, 'utf8'));
  const silences = detectSilences(samples, sampleRate, sOpts);
  const p = analysePhrasing(alignWords(target, heard), target, silences, pOpts);
  return { gt, p, silences, longPauses: prf(p.longPauses, gt.longPauses), ranThrough: prf(p.ranThroughFullStops, gt.ranThrough) };
}

if (process.argv[1]?.endsWith('phrasing.ts')) {
  const [wav, heardPath, reviewPath] = process.argv.slice(2);
  if (process.argv.includes('--sweep')) {
    for (const marginDb of [6, 8, 10, 12, 15]) for (const minSilenceMs of [100, 150, 200]) {
      for (const fullStopMinPauseMs of [150, 250, 350]) for (const longPauseMs of [400, 500, 700, 900]) {
        const r = evaluate(wav, heardPath, reviewPath, { frameMs: 20, marginDb, minSilenceMs }, { fullStopMinPauseMs, longPauseMs });
        console.log(JSON.stringify({ marginDb, minSilenceMs, fullStopMinPauseMs, longPauseMs, long: r.longPauses, ran: r.ranThrough }));
      }
    }
  } else {
    const r = evaluate(wav, heardPath, reviewPath, DEFAULT_SILENCE_OPTIONS, DEFAULT_PHRASING_OPTIONS);
    console.log('silences', r.silences.length, 'total ms', r.silences.reduce((a, s) => a + s.endMs - s.startMs, 0));
    console.log('truth long pauses after (1-based)', [...r.gt.longPauses].map((i) => i + 1), 'ran through', [...r.gt.ranThrough].map((i) => i + 1));
    console.log('boundaries (after 1-based, kind, pauseMs):');
    console.log(r.p.boundaries.filter((b) => b.pauseMs > 0 || b.kind !== 'mid').map((b) => `${b.after + 1}${b.kind[0]}:${b.pauseMs}`).join(' '));
    console.log('detected long pauses', r.p.longPauses.map((i) => i + 1), r.longPauses);
    console.log('detected ran through', r.p.ranThroughFullStops.map((i) => i + 1), r.ranThrough);
  }
}

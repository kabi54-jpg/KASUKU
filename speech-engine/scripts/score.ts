/**
 * Score heard words against the human-verified reviews, optionally sweeping thresholds.
 *
 *   npx tsx scripts/score.ts out/child1.heard.json data/child1-misreads.txt [--sweep]
 *
 * heard.json is the `heard` array logged by the on-device self-test ([KASUKU-SELFTEST] heard).
 * Positions in the review files are 1-based; aligner indexes are 0-based.
 */
import { readFileSync } from 'node:fs';
import { alignWords, type AlignedWord, type AlignOptions, conservativeStatuses, DEFAULT_ALIGN_OPTIONS, type HeardWord } from '../../frontend/src/services/speech/align.ts';

export interface GroundTruth {
  struggled: Set<number>; // 0-based
  choppy: Set<number>;
}

export function parseReview(text: string): GroundTruth {
  const gt: GroundTruth = { struggled: new Set(), choppy: new Set() };
  let section: keyof GroundTruth | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (/^#\s*struggled/i.test(line)) section = 'struggled';
    else if (/^#\s*choppy/i.test(line)) section = 'choppy';
    else if (/^#/.test(line)) section = null;
    else if (section) {
      const m = line.match(/^\s*(\d+)\s*:/);
      if (m) gt[section].add(Number(m[1]) - 1);
    }
  }
  return gt;
}

export function score(target: string, heard: HeardWord[], gt: GroundTruth, opts: AlignOptions) {
  const words = alignWords(target, heard, opts);
  const flagged = new Set(words.filter((w) => w.status === 'misread' || w.status === 'missed').map((w) => w.index));
  const tp = [...flagged].filter((i) => gt.struggled.has(i)).length;
  const wronglyFlagged = [...flagged].filter((i) => !gt.struggled.has(i));
  return {
    opts,
    wordAccuracy: words.filter((w) => w.status === 'correct').length / words.length,
    flagged: flagged.size,
    struggled: gt.struggled.size,
    detected: tp,
    precision: flagged.size ? tp / flagged.size : null,
    recall: gt.struggled.size ? tp / gt.struggled.size : null,
    // a choppy-but-correct word being flagged is a softer error than a fluent one
    wronglyFlaggedFluent: wronglyFlagged.filter((i) => !gt.choppy.has(i)).map((i) => i + 1),
    wronglyFlaggedChoppy: wronglyFlagged.filter((i) => gt.choppy.has(i)).map((i) => i + 1),
    uncertain: words.filter((w) => w.status === 'uncertain').map((w) => w.index + 1),
    // what the UI shows with the conservative rule (1-based word positions)
    conservative: conservativeScore(words, gt),
    // soft "took a while" hint vs the struggled list (1-based word positions)
    hesitated: hintScore(words.filter((w) => w.hesitated).map((w) => w.index), gt),
  };
}

function conservativeScore(words: AlignedWord[], gt: GroundTruth) {
  const st = conservativeStatuses(words);
  const missed = words.filter((_, k) => st[k] === 'missed').map((w) => w.index);
  return {
    missed: missed.length,
    struggledMarkedMissed: `${missed.filter((i) => gt.struggled.has(i)).length}/${gt.struggled.size}`,
    fluentMarkedMissed: missed.filter((i) => !gt.struggled.has(i) && !gt.choppy.has(i)).map((i) => i + 1),
    choppyMarkedMissed: missed.filter((i) => gt.choppy.has(i)).map((i) => i + 1),
  };
}

function hintScore(hinted: number[], gt: GroundTruth) {
  const tp = hinted.filter((i) => gt.struggled.has(i)).length;
  return {
    hinted: hinted.length,
    struggledFound: `${tp}/${gt.struggled.size}`,
    precision: hinted.length ? Math.round((tp / hinted.length) * 100) / 100 : null,
    onChoppy: hinted.filter((i) => gt.choppy.has(i)).length,
    onFluent: hinted.filter((i) => !gt.struggled.has(i) && !gt.choppy.has(i)).length,
  };
}

if (process.argv[1]?.endsWith('score.ts')) {
  const [heardPath, reviewPath, ...flags] = process.argv.slice(2);
  const target = readFileSync(new URL('../data/reading.txt', import.meta.url), 'utf8');
  const heard = JSON.parse(readFileSync(heardPath, 'utf8')) as HeardWord[];
  const gt = parseReview(readFileSync(reviewPath, 'utf8'));
  if (!flags.includes('--sweep')) {
    console.log(JSON.stringify(score(target, heard, gt, DEFAULT_ALIGN_OPTIONS), null, 1));
  } else {
    for (const correctAt of [0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9]) {
      for (const misreadBelow of [0.3, 0.4, 0.5, 0.6]) {
        if (misreadBelow > correctAt) continue;
        const r = score(target, heard, gt, { correctAt, misreadBelow });
        console.log([correctAt, misreadBelow, r.precision?.toFixed(2), r.recall?.toFixed(2), r.wronglyFlaggedFluent.length, r.wordAccuracy.toFixed(2)].join('\t'));
      }
    }
  }
}

/**
 * Does Whisper word timing separate struggled words from fluent ones?
 *   npx tsx scripts/timing.ts out/childN.small.heard.json data/childN-misreads.txt
 * Features per target word: ms per letter of the word, pause before it, and their sum.
 * Reports AUC (0.5 = chance) and the best-F1 threshold for "struggled", and for
 * "struggled or choppy". Prints numbers only (no passage text).
 */
import { readFileSync } from 'node:fs';
import { alignWords, compareKey } from '../../frontend/src/services/speech/align.ts';
import { parseReview } from './score.ts';

const [h, r] = process.argv.slice(2);
const words = alignWords(readFileSync(new URL('../data/reading.txt', import.meta.url), 'utf8'), JSON.parse(readFileSync(h, 'utf8')));
const gt = parseReview(readFileSync(r, 'utf8'));
const timed = words.filter((w) => w.durationMs !== undefined);

const feats: Record<string, (w: (typeof words)[number]) => number> = {
  msPerLetter: (w) => w.durationMs! / Math.max(1, compareKey(w.word).length),
  pauseBefore: (w) => w.pauseBeforeMs ?? 0,
  combined: (w) => w.durationMs! / Math.max(1, compareKey(w.word).length) + (w.pauseBeforeMs ?? 0) / 10,
};

function evaluate(name: string, isPos: (i: number) => boolean) {
  const pos = timed.filter((w) => isPos(w.index)).length;
  console.log(`\n${name}: ${pos} positive / ${timed.length} timed words (${words.length - timed.length} untimed)`);
  for (const [f, fn] of Object.entries(feats)) {
    const v = timed.map((w) => ({ x: fn(w), y: isPos(w.index) }));
    const P = v.filter((a) => a.y), N = v.filter((a) => !a.y);
    let wins = 0;
    for (const p of P) for (const n of N) wins += p.x > n.x ? 1 : p.x === n.x ? 0.5 : 0;
    const auc = P.length && N.length ? wins / (P.length * N.length) : NaN;
    let best = { f1: 0, t: 0, p: 0, r: 0, fp: 0 };
    for (const t of [...new Set(v.map((a) => a.x))]) {
      const flag = v.filter((a) => a.x >= t), tp = flag.filter((a) => a.y).length;
      const p = tp / flag.length, rc = tp / P.length, f1 = p + rc ? (2 * p * rc) / (p + rc) : 0;
      if (f1 > best.f1) best = { f1, t, p, r: rc, fp: flag.length - tp };
    }
    console.log(`  ${f.padEnd(12)} AUC ${auc.toFixed(2)}  best: >=${best.t.toFixed(0)} P ${best.p.toFixed(2)} R ${best.r.toFixed(2)} (${best.fp} false flags)`);
  }
}
evaluate('struggled', (i) => gt.struggled.has(i));
evaluate('struggled or choppy', (i) => gt.struggled.has(i) || gt.choppy.has(i));

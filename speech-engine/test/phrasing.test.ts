import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analysePhrasing, detectSilences } from '../../frontend/src/services/speech/phrasing.ts';
import type { AlignedWord } from '../../frontend/src/services/speech/align.ts';
import { parsePhrasingReview } from '../scripts/phrasing.ts';

const SR = 16000;

/** tone/silence pattern in ms: [loud, quiet, loud, ...] */
function signal(pattern: number[]): Float32Array {
  const out = new Float32Array(pattern.reduce((a, b) => a + b, 0) * (SR / 1000));
  let pos = 0;
  pattern.forEach((ms, k) => {
    const n = ms * (SR / 1000);
    for (let i = 0; i < n; i++) out[pos + i] = k % 2 === 0 ? 0.3 * Math.sin((2 * Math.PI * 200 * (pos + i)) / SR) : 0.001 * Math.sin(i);
    pos += n;
  });
  return out;
}

const word = (index: number, w: string, startMs: number, endMs: number): AlignedWord =>
  ({ index, word: w, status: 'correct', heard: w, similarity: 1, startMs, endMs });

test('detectSilences finds gaps longer than the minimum only', () => {
  const s = detectSilences(signal([500, 800, 500, 60, 500, 300, 500]), SR);
  assert.equal(s.length, 2);
  assert.deepEqual(s[0], { startMs: 500, endMs: 1300 });
  assert.deepEqual(s[1], { startMs: 2360, endMs: 2660 });
});

test('analysePhrasing flags a read-through full stop and a long mid-sentence pause', () => {
  const text = 'moja mbili. tatu nne tano';
  const words = [word(0, 'moja', 0, 500), word(1, 'mbili.', 500, 1000), word(2, 'tatu', 1000, 1500), word(3, 'nne', 1500, 3000), word(4, 'tano', 3000, 3500)];
  const p = analysePhrasing(words, text, [{ startMs: 2100, endMs: 2950 }]);
  assert.deepEqual(p.ranThroughFullStops, [1]);
  assert.deepEqual(p.longPauses, [3]);
  assert.equal(p.boundaries.find((b) => b.after === 3)?.pauseMs, 850);
});

test('a pause at the full stop is not flagged', () => {
  const words = [word(0, 'moja.', 0, 800), word(1, 'mbili', 800, 1300)];
  const p = analysePhrasing(words, 'moja. mbili', [{ startMs: 500, endMs: 800 }]);
  assert.deepEqual(p.ranThroughFullStops, []);
  assert.deepEqual(p.longPauses, []);
});

test('untimed words produce no boundaries', () => {
  const p = analysePhrasing([{ index: 0, word: 'a.', status: 'missed', heard: null, similarity: 0 }], 'a.', []);
  assert.deepEqual(p.boundaries, []);
});

test('phrasing review parser uses the word before the pause', () => {
  const gt = parsePhrasingReview('# long mid-sentence pause `\nbetween 9 and 10: x ` y\n\n# ran through full stop .>>\nafter 45: x. >> y\n# total');
  assert.deepEqual([...gt.longPauses], [8]);
  assert.deepEqual([...gt.ranThrough], [44]);
});

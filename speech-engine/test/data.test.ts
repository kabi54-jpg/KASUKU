/**
 * Tests that need speech-engine/data/ (never committed). Skip cleanly when it is absent.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseReview } from '../scripts/score.ts';
import { alignWords, wordsFromText } from '../../frontend/src/services/speech/align.ts';

const data = (f: string) => new URL(`../data/${f}`, import.meta.url);
const skip = !existsSync(data('reading.txt')) && 'speech-engine/data/ not present';

test('review files parse to the documented counts', { skip }, () => {
  const c1 = parseReview(readFileSync(data('child1-misreads.txt'), 'utf8'));
  const c2 = parseReview(readFileSync(data('child2-misreads.txt'), 'utf8'));
  assert.equal(c1.struggled.size, 3);
  assert.equal(c1.choppy.size, 2);
  assert.equal(c2.struggled.size, 10);
  assert.equal(c2.choppy.size, 8);
});

test('passage aligned with itself is all correct (58 words)', { skip }, () => {
  const t = readFileSync(data('reading.txt'), 'utf8');
  const r = alignWords(t, wordsFromText(t));
  assert.equal(r.length, 58);
  assert.ok(r.every((w) => w.status === 'correct'));
});

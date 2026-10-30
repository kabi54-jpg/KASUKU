/**
 * Synthetic alignment cases. Always run; need no audio and no test passage.
 *   npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  alignWords,
  compareKey,
  normalizeWord,
  similarity,
  toFrontendStatus,
  wordsFromText,
} from '../../frontend/src/services/speech/align.ts';

const STORY = "Ng'ombe analala shambani. Baba anamletea nyasi nyingi.";
const statuses = (heard: string) => alignWords(STORY, wordsFromText(heard)).map((w) => w.status);

test('normalisation: case, punctuation, apostrophe variants', () => {
  assert.equal(normalizeWord('Shambani.'), 'shambani');
  assert.equal(normalizeWord('Ng’ombe,'), "ng'ombe");
  assert.equal(normalizeWord('Ng‘ombe'), "ng'ombe");
  assert.equal(normalizeWord("“Ng'ombe!”"), "ng'ombe");
  assert.equal(compareKey("ng'ombe"), compareKey('ngombe'));
});

test('perfect reading is all correct and keeps story indices and spelling', () => {
  const r = alignWords(STORY, wordsFromText(STORY));
  assert.deepEqual(r.map((w) => w.status), Array(7).fill('correct'));
  assert.deepEqual(r.map((w) => w.index), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(r[2].word, 'shambani.');
});

test("ng' variants count as correct", () => {
  for (const v of ['ngombe', 'ng’ombe', "Ng'ombe", 'ng ombe']) {
    assert.equal(statuses(`${v} analala shambani baba anamletea nyasi nyingi`)[0], 'correct', v);
  }
});

test('skipped word is missed, neighbours stay correct', () => {
  assert.deepEqual(statuses("ng'ombe analala baba anamletea nyasi nyingi"),
    ['correct', 'correct', 'missed', 'correct', 'correct', 'correct', 'correct']);
});

test('extra heard word is ignored', () => {
  assert.deepEqual(statuses("ng'ombe analala eee shambani baba anamletea nyasi nyingi"), Array(7).fill('correct'));
});

test('misread word is flagged, near-miss is uncertain or correct, never misread', () => {
  const s = statuses("ng'ombe analala shambani baba kitabu nyasi nyingi");
  assert.equal(s[4], 'misread');
  const near = statuses("ng'ombe analala shamban baba anamletea nyasi nyingi")[2];
  assert.notEqual(near, 'misread');
});

test('word sounded out in two pieces is merged', () => {
  const r = alignWords(STORY, wordsFromText("ng'ombe analala shambani baba anam letea nyasi nyingi"));
  assert.equal(r[4].status, 'correct');
  assert.equal(r[4].heard, 'anam letea');
  assert.equal(r[5].status, 'correct');
});

test('empty transcript: everything missed', () => {
  assert.deepEqual(statuses(''), Array(7).fill('missed'));
});

test('timestamps give duration and pause before', () => {
  const heard = [
    { text: 'Baba', startMs: 0, endMs: 400 },
    { text: 'anamletea', startMs: 1200, endMs: 2000 },
  ];
  const r = alignWords('Baba anamletea', heard);
  assert.equal(r[0].durationMs, 400);
  assert.equal(r[1].pauseBeforeMs, 800);
});

test('frontend mapping: uncertain is neutral', () => {
  assert.equal(toFrontendStatus('correct'), 'correct');
  assert.equal(toFrontendStatus('uncertain'), 'correct');
  assert.equal(toFrontendStatus('misread'), 'missed');
  assert.equal(toFrontendStatus('missed'), 'missed');
});

test('similarity bounds', () => {
  assert.equal(similarity('nyasi', 'nyasi'), 1);
  assert.ok(similarity('nyasi', 'kitabu') < 0.5);
});

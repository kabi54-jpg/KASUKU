import type { Story, WordResult } from '../types';
import { storyWords } from '../data/stories.mock';
import { cleanWord, hasSound, tagSounds } from './sounds';

/**
 * MOCK RESULTS — drives the clearly-labelled "mock results" control on the Reading screen.
 * These are NOT speech recognition output. Real results come from Person 1's
 * evaluateAudio() via src/services/speechEngine.ts and carry resultSource === 'live'.
 */
export type MockVariant = 'needs-ng' | 'accurate';

export const makeMockResults = (variant: MockVariant, story: Story): WordResult[] => {
  const words = storyWords(story);
  let helpedOne = false;

  const out: WordResult[] = words.map((word, index) => {
    if (variant === 'needs-ng') {
      // Practice-need reader: misses ng' words, needs help on the first ny word
      if (hasSound(word, "ng'")) return { index, word, status: 'missed', ms: 4200 };
      if (hasSound(word, 'ny') && !helpedOne) {
        helpedOne = true;
        return { index, word, status: 'helped', ms: 3800 };
      }
      return { index, word, status: 'correct', ms: 900 };
    }
    // Accurate reader
    return { index, word, status: 'correct', ms: 800 };
  });
  // Stories with no ng'/ny words: still show one missed word so the practice-need case is visible
  if (variant === 'needs-ng' && out.every((r) => r.status === 'correct') && out.length > 3) {
    out[3] = { ...out[3], status: 'missed', ms: 4200 };
  }
  return out;
};

export interface ResultSummary {
  total: number;
  correct: number;
  missed: number;
  helped: number;
  /** 0–100 */
  accuracy: number;
  stars: 1 | 2 | 3;
  weakSounds: { sound: string; count: number; examples: string[] }[];
  wordsToPractise: string[];
}

export const summarise = (results: WordResult[]): ResultSummary => {
  const total = results.length;
  const correct = results.filter((r) => r.status === 'correct').length;
  const missed = results.filter((r) => r.status === 'missed').length;
  const helped = results.filter((r) => r.status === 'helped').length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const stars: 1 | 2 | 3 = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

  const bySound = new Map<string, { count: number; examples: Set<string> }>();
  results
    .filter((r) => r.status !== 'correct')
    .forEach((r) => {
      tagSounds(r.word).forEach((s) => {
        const e = bySound.get(s) ?? { count: 0, examples: new Set<string>() };
        e.count += 1;
        e.examples.add(cleanWord(r.word));
        bySound.set(s, e);
      });
    });

  const weakSounds = [...bySound.entries()]
    .map(([sound, v]) => ({ sound, count: v.count, examples: [...v.examples] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const wordsToPractise = [...new Set(results.filter((r) => r.status !== 'correct').map((r) => cleanWord(r.word)))];

  return { total, correct, missed, helped, accuracy, stars, weakSounds, wordsToPractise };
};


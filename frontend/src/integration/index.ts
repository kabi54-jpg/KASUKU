/**
 * INTEGRATION SEAM — the only file that changes when teammates deliver their parts.
 * App code imports these names from here, never from the mock files directly.
 *
 *  Person 1 (speech)   -> evaluateAudio, speakWord, speechEngineAvailable   (src/services/speechEngine.ts)
 *  Person 2 (content)  -> STORIES / getStory / storyWords, getRecommendation, splitKiswahiliSyllables, tagSounds
 *  Person 4 (assets)   -> Andika font (App.tsx), Kasuku PNGs (KasukuBuddy.tsx), covers (StoryCover.tsx)
 *
 * To swap in a teammate's module, change ONE re-export below and keep the signature.
 */
import type { Child, Recommendation, WordResult } from '../types';
import { getStory, STORIES } from '../data/stories.mock';
import { mockRecommendation } from '../logic/recommendation.mock';

/* ---------- Person 2: stories (replace with assets/stories.json) ---------- */
export { STORIES, getStory, storyWords } from '../data/stories.mock';

/* ---------- Person 2: syllables & sound tags (replace with their tested helper) ---------- */
export { cleanWord, hasSound, splitKiswahiliSyllables, tagSounds } from '../logic/sounds';

/**
 * Person 2: getRecommendation(childProfile, lastWordResults): Recommendation.
 * The story just read is `child.lastSession.storyId` — callers set lastSession before calling.
 * Deterministic and offline. Replace the body with Person 2's function.
 */
export const getRecommendation = (child: Child, lastWordResults: WordResult[]): Recommendation => {
  const story = getStory(child.lastSession?.storyId ?? STORIES[0].id);
  return mockRecommendation(story, lastWordResults);
};

/* ---------- Person 1: speech engine ---------- */
export { evaluateAudio, speakWord, speechEngineAvailable, SpeechEngineNotConnected } from '../services/speechEngine';

/* ---------- Stuck detection (UI side) ---------- */
/**
 * No progress on the current word for this long -> Kasuku offers help.
 * 4 s is the plan's target; tune on a real device so normal pauses don't interrupt.
 * Person 1: when a streaming recogniser exists, call session.mark(index, status) for each word
 * heard — the timer then runs on real progress instead of the mock controls.
 */
export const STUCK_MS = 4000;

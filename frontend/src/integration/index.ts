/**
 * INTEGRATION SEAM — the only file that changes when teammates deliver their parts.
 * App code imports these names from here, never from the mock files directly.
 *
 *  Person 1 (speech)   -> evaluateAudio, speakWord, speechEngineAvailable, startLiveSpeechSession (stub)   (src/services/speechEngine.ts)
 *  Person 2 (content)  -> STORIES / getStory / storyWords, getRecommendation, splitKiswahiliSyllables, tagSounds
 *  Person 4 (assets)   -> Andika font (App.tsx), Kasuku PNGs (KasukuBuddy.tsx), covers (StoryCover.tsx)
 *
 */
export { STORIES, getStory, storyWords } from '../data/stories';
export { getRecommendation } from '../logic/recommendation';

/* ---------- Person 2: syllables & sound tags ---------- */
export { cleanWord, hasSound, splitKiswahiliSyllables, tagSounds } from '../logic/sounds';

/* ---------- Person 1: speech engine ---------- */
export {
  evaluateAudio,
  liveSpeechAvailable,
  speakWord,
  speechEngineAvailable,
  SpeechEngineNotConnected,
  speechOutputAvailable,
  startLiveSpeechSession,
  type LiveSpeechCallbacks,
  type LiveSpeechPhase,
  type LiveSpeechSession,
} from '../services/speechEngine';

/* ---------- Stuck detection (UI side) ---------- */
/**
 * No progress on the current word for this long -> Kasuku offers help.
 * 4 s is the plan's target; tune on a real device so normal pauses don't interrupt.
 * Person 1: when a streaming recogniser exists, call session.mark(index, status) for each word
 * heard — the timer then runs on real progress instead of the mock controls.
 */
export const STUCK_MS = 4000;

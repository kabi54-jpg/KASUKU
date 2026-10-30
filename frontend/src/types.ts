/**
 * Shared types.
 *
 * INTEGRATION CONTRACT (agree with Person 1 and Person 2 before wiring):
 *  - WordResult / WordStatus  -> produced by Person 1's evaluateAudio()
 *  - Story                    -> shape of Person 2's stories.json
 *  - Recommendation           -> returned by Person 2's getRecommendation()
 */

export type WordStatus = 'correct' | 'missed' | 'helped';

export interface WordResult {
  /** position of the word in the story's word list */
  index: number;
  word: string;
  status: WordStatus;
  /** optional elapsed time for the attempt, milliseconds */
  ms?: number;
}

export interface Story {
  id: string;
  title: string;
  /** 1 = easiest */
  level: 1 | 2 | 3;
  /** sounds practised in this story, e.g. ["ng'", "ny"] */
  soundTags: string[];
  text: string;
}

export interface Recommendation {
  kind: 'story' | 'drill';
  /** story to read next (for kind "story", or the story that follows the drill) */
  storyId: string;
  title: string;
  /** short, rule-based, child/parent friendly reason */
  reason: string;
  focusSound?: string;
}

/** none = nothing yet · mock = mock-results control · manual = tapped help in the app · live = real speech engine */
export type ResultSource = 'none' | 'mock' | 'manual' | 'live';

/* ---------------- Family & children (stored on this device only, no accounts) ---------------- */

export type AvatarKey = 'lion' | 'elephant' | 'giraffe' | 'turtle' | 'panda' | 'fox' | 'frog' | 'tiger';

export interface StoryProgress {
  bestStars: 1 | 2 | 3;
  accuracy: number; // latest, 0–100
  times: number;
  lastDate: string; // YYYY-MM-DD
  /** how the latest result was produced — "live" only for real speech recognition */
  source: ResultSource;
}

/** One logged word attempt. Never contains audio. */
export interface AttemptLog {
  storyId: string;
  word: string;
  status: WordStatus;
  ms?: number;
  date: string;
}

/** The most recent finished reading — feeds getRecommendation() and the Parent Corner. */
export interface LastSession {
  storyId: string;
  date: string;
  source: ResultSource;
  results: WordResult[];
}

export interface Child {
  id: string;
  name: string;
  avatar: AvatarKey;
  grade: 1 | 2 | 3;
  /** stories per day */
  dailyGoal: 1 | 2 | 3;
  streakDays: number;
  lastReadDate: string | null;
  progress: Record<string, StoryProgress>;
  /** rolling log of word attempts (capped) */
  wordLog: AttemptLog[];
  lastSession: LastSession | null;
}

export interface Family {
  id: string;
  children: Child[];
  /** true for the built-in demo family */
  demo?: boolean;
}

export type Screen = 'welcome' | 'setup' | 'who' | 'addChild' | 'tabs' | 'read';
export type TabKey = 'home' | 'stories' | 'family';

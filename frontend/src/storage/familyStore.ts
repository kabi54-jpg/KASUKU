import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Child, Family } from '../types';
import { yesterdayStr } from '../data/avatars';
import { getStory, storyWords } from '../data/stories';
import { hasSound } from '../logic/sounds';

/**
 * Local-only family store. No accounts, no server: everything lives in this phone's storage.
 * Audio recordings are never stored — only word results.
 */
const FAMILY_KEY = 'kasuku:family:v1';

export const uid = (): string => Crypto.randomUUID();

export const loadFamily = async (): Promise<Family | null> => {
  try {
    const raw = await AsyncStorage.getItem(FAMILY_KEY);
    return raw ? (JSON.parse(raw) as Family) : null;
  } catch {
    return null;
  }
};

export const saveFamily = async (family: Family | null): Promise<void> => {
  try {
    if (family) await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(family));
    else await AsyncStorage.removeItem(FAMILY_KEY);
  } catch {
    /* storage failure must not crash the UI */
  }
};

export const makeFamily = (children: Child[] = [], demo = false): Family => ({ id: uid(), children, ...(demo ? { demo } : {}) });

export const makeChild = (p: Pick<Child, 'name' | 'avatar' | 'grade'> & Partial<Child>): Child => ({
  id: uid(),
  dailyGoal: 1,
  streakDays: 0,
  lastReadDate: null,
  progress: {},
  wordLog: [],
  lastSession: null,
  ...p,
  name: p.name.trim(),
});

/* ---------- demo family (two seeded fixtures for the comparison demo) ---------- */
export const buildDemoFamily = (): Family => {
  const y = yesterdayStr();
  const ngStory = getStory('s2');
  const childAResults = storyWords(ngStory).map((word, index) => ({
    index,
    word,
    status: hasSound(word, "ng'") ? 'missed' as const : 'correct' as const,
    ms: hasSound(word, "ng'") ? 4200 : 850,
  }));
  const childBResults = storyWords(ngStory).map((word, index) => ({ index, word, status: 'correct' as const, ms: 800 }));
  const amani = makeChild({
    name: 'Amani', avatar: 'giraffe', grade: 1, dailyGoal: 1, streakDays: 3, lastReadDate: y,
    // Child A fixture: ng' has been missed, so an offline recommendation should select ng' practice.
    progress: {
      s1: { bestStars: 2, accuracy: 80, times: 1, lastDate: y, source: 'mock' },
      s2: { bestStars: 1, accuracy: 67, times: 1, lastDate: y, source: 'mock' },
    },
    wordLog: childAResults.map((r) => ({ storyId: 's2', word: r.word, status: r.status, ms: r.ms, date: y })),
    lastSession: { storyId: 's2', date: y, source: 'mock', results: childAResults },
  });
  const baraka = makeChild({
    name: 'Baraka', avatar: 'lion', grade: 2, dailyGoal: 2, streakDays: 7, lastReadDate: y,
    progress: {
      s1: { bestStars: 3, accuracy: 100, times: 2, lastDate: y, source: 'mock' },
      s2: { bestStars: 3, accuracy: 100, times: 1, lastDate: y, source: 'mock' },
    },
    // Child B fixture: the same sample story was read accurately and advances to the next story.
    wordLog: childBResults.map((r) => ({ storyId: 's2', word: r.word, status: r.status, ms: r.ms, date: y })),
    lastSession: { storyId: 's2', date: y, source: 'mock', results: childBResults },
  });
  return makeFamily([amani, baraka], true);
};

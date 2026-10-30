import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AttemptLog, AvatarKey, Child, Family, Recommendation, ResultSource, Screen, TabKey, WordResult,
} from '../types';
import { getRecommendation } from '../integration';
import { summarise, type ResultSummary } from '../logic/mockResults';
import { todayStr, yesterdayStr } from '../data/avatars';
import { buildDemoFamily, loadFamily, makeChild, makeFamily, saveFamily } from '../storage/familyStore';

export interface NewChildInput {
  name: string;
  avatar: AvatarKey;
  grade: 1 | 2 | 3;
  dailyGoal?: 1 | 2 | 3;
}

export interface FinishedReading {
  summary: ResultSummary;
  recommendation: Recommendation;
  child: Child;
}

const WORD_LOG_CAP = 300;

interface AppState {
  ready: boolean;
  screen: Screen;
  go: (s: Screen) => void;
  tab: TabKey;
  setTab: (t: TabKey) => void;

  family: Family | null;
  /** the child currently reading */
  child: Child | null;
  startFresh: () => void;
  startDemo: () => void;
  resetAll: () => void;
  addChild: (input: NewChildInput) => Child;
  updateChild: (id: string, patch: Partial<Child>) => void;
  removeChild: (id: string) => void;
  selectChild: (id: string) => void;
  /** where "Add a child" should return to */
  addChildReturn: Screen;
  startAddChild: (from: Screen) => void;

  storyId: string;
  openStory: (id: string) => void;
  closeStory: (toTab?: TabKey) => void;
  /** Save a finished reading (progress, streak, word log, last session) and get the next step. */
  finishReading: (childId: string, storyId: string, results: WordResult[], source: ResultSource) => FinishedReading | null;

  parentUnlocked: boolean;
  unlockParent: () => void;

  toast: string | null;
  showToast: (msg: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export const useApp = (): AppState => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
};

export const AppProvider = ({ children: kids }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [tab, setTabState] = useState<TabKey>('home');
  const [family, setFamily] = useState<Family | null>(null);
  const familyRef = useRef<Family | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [storyId, setStoryId] = useState('s1');
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [addChildReturn, setAddChildReturn] = useState<Screen>('tabs');
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const child = useMemo(
    () => family?.children.find((c) => c.id === activeChildId) ?? family?.children[0] ?? null,
    [family, activeChildId],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2800);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  /** Single write path: keeps the ref, React state and storage in step. */
  const commit = useCallback((next: Family | null) => {
    familyRef.current = next;
    setFamily(next);
    void saveFamily(next);
  }, []);

  const routeFor = useCallback((f: Family | null) => {
    setTabState('home');
    setParentUnlocked(false);
    if (!f) setScreen('welcome');
    else if (f.children.length === 0) setScreen('setup');
    else if (f.children.length === 1) { setActiveChildId(f.children[0].id); setScreen('tabs'); }
    else { setActiveChildId(null); setScreen('who'); }
  }, []);

  /* ---------- launch: restore the saved family ---------- */
  useEffect(() => {
    (async () => {
      const f = await loadFamily();
      familyRef.current = f;
      setFamily(f);
      routeFor(f);
      setReady(true);
    })();
  }, [routeFor]);

  /* ---------- start / demo / reset ---------- */
  const startFresh = useCallback(() => setScreen('setup'), []);

  const startDemo = useCallback(() => {
    const f = buildDemoFamily();
    commit(f);
    routeFor(f);
  }, [commit, routeFor]);

  const resetAll = useCallback(() => {
    commit(null);
    setActiveChildId(null);
    setParentUnlocked(false);
    setTabState('home');
    setScreen('welcome');
  }, [commit]);

  /* ---------- children ---------- */
  const addChild = useCallback((input: NewChildInput): Child => {
    const c = makeChild({ ...input, dailyGoal: input.dailyGoal ?? 1 });
    const f = familyRef.current ?? makeFamily();
    commit({ ...f, children: [...f.children, c] });
    setActiveChildId((cur) => cur ?? c.id);
    return c;
  }, [commit]);

  const updateChild = useCallback((id: string, patch: Partial<Child>) => {
    const f = familyRef.current;
    if (!f) return;
    commit({ ...f, children: f.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  }, [commit]);

  const removeChild = useCallback((id: string) => {
    const f = familyRef.current;
    if (!f) return;
    const remaining = f.children.filter((c) => c.id !== id);
    commit({ ...f, children: remaining });
    if (activeChildId === id) setActiveChildId(remaining[0]?.id ?? null);
    if (remaining.length === 0) setScreen('setup');
  }, [commit, activeChildId]);

  const selectChild = useCallback((id: string) => {
    setActiveChildId(id);
    setParentUnlocked(false);
    setTabState('home');
    setScreen('tabs');
  }, []);

  const startAddChild = useCallback((from: Screen) => {
    setAddChildReturn(from);
    setScreen('addChild');
  }, []);

  /* ---------- stories & reading ---------- */
  const openStory = useCallback((id: string) => {
    setStoryId(id);
    setScreen('read');
  }, []);

  const closeStory = useCallback((toTab?: TabKey) => {
    if (toTab) setTabState(toTab);
    setScreen('tabs');
  }, []);

  const finishReading = useCallback(
    (childId: string, sId: string, results: WordResult[], source: ResultSource): FinishedReading | null => {
      const f = familyRef.current;
      const c = f?.children.find((x) => x.id === childId);
      if (!f || !c || results.length === 0) return null;

      const today = todayStr();
      const summary = summarise(results);
      const prev = c.progress[sId];
      const streak =
        c.lastReadDate === today ? c.streakDays : c.lastReadDate === yesterdayStr() ? c.streakDays + 1 : 1;
      const log: AttemptLog[] = results.map((r) => ({ storyId: sId, word: r.word, status: r.status, ms: r.ms, date: today }));

      const next: Child = {
        ...c,
        streakDays: Math.max(streak, 1),
        lastReadDate: today,
        progress: {
          ...c.progress,
          [sId]: {
            bestStars: Math.max(prev?.bestStars ?? 1, summary.stars) as 1 | 2 | 3,
            accuracy: summary.accuracy,
            times: (prev?.times ?? 0) + 1,
            lastDate: today,
            source,
          },
        },
        wordLog: [...c.wordLog, ...log].slice(-WORD_LOG_CAP),
        lastSession: { storyId: sId, date: today, source, results },
      };
      commit({ ...f, children: f.children.map((x) => (x.id === childId ? next : x)) });
      return { summary, recommendation: getRecommendation(next, results), child: next };
    },
    [commit],
  );

  /* ---------- parent gate ---------- */
  const unlockParent = useCallback(() => setParentUnlocked(true), []);
  const setTab = useCallback((t: TabKey) => {
    if (t !== tab) setParentUnlocked(false);
    setTabState(t);
  }, [tab]);

  const value: AppState = {
    ready, screen, go: setScreen, tab, setTab, family, child, startFresh, startDemo, resetAll, addChild, updateChild,
    removeChild, selectChild, addChildReturn, startAddChild, storyId, openStory, closeStory, finishReading,
    parentUnlocked, unlockParent, toast, showToast,
  };
  return <Ctx.Provider value={value}>{kids}</Ctx.Provider>;
};

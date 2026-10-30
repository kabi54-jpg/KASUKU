import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ResultSource, WordResult, WordStatus } from '../types';
import { STUCK_MS } from '../integration';

/** A session that touches mock data is labelled mock; real speech stays "live". */
const mergeSource = (prev: ResultSource, next: ResultSource): ResultSource => {
  if (prev === 'mock' || next === 'mock') return 'mock';
  if (prev === 'live' || next === 'live') return 'live';
  return next === 'none' ? prev : next;
};

/**
 * One reading session: word results, the "current word" pointer, and stuck detection.
 *
 * Stuck detection: while `listening`, if the current word gets no progress for STUCK_MS,
 * `onStuck(index)` fires once (Kasuku offers help). Progress = mark()/markNext(). Right now
 * progress comes from the labelled mock controls or the child tapping "I said it!";
 * Person 1's engine should call mark(index, status, 'live') for each word it recognises.
 */
export const useReadingSession = (words: string[], paused: boolean, onStuck: (index: number) => void) => {
  const [map, setMap] = useState<Record<number, WordResult>>({});
  const [listening, setListening] = useState(false);
  const [source, setSource] = useState<ResultSource>('none');
  const lastAt = useRef(Date.now());
  const stuckRef = useRef(onStuck);
  stuckRef.current = onStuck;

  const results = useMemo(() => Object.values(map).sort((a, b) => a.index - b.index), [map]);
  const current = useMemo(() => {
    for (let i = 0; i < words.length; i += 1) if (!map[i]) return i;
    return words.length;
  }, [map, words]);
  const done = words.length > 0 && current >= words.length;

  const mark = useCallback(
    (index: number, status: WordStatus, src: ResultSource = 'manual') => {
      if (index < 0 || index >= words.length) return;
      const now = Date.now();
      const ms = now - lastAt.current;
      lastAt.current = now;
      setMap((p) => ({ ...p, [index]: { index, word: words[index], status, ms } }));
      setSource((s) => mergeSource(s, src));
    },
    [words],
  );

  const markNext = useCallback((status: WordStatus, src: ResultSource) => mark(current, status, src), [mark, current]);

  const applyAll = useCallback((list: WordResult[], src: ResultSource) => {
    setMap(Object.fromEntries(list.map((r) => [r.index, r])));
    setSource(src);
    lastAt.current = Date.now();
  }, []);

  const reset = useCallback(() => {
    setMap({});
    setSource('none');
    setListening(false);
    lastAt.current = Date.now();
  }, []);

  const start = useCallback(() => {
    lastAt.current = Date.now();
    setListening(true);
  }, []);
  const stop = useCallback(() => setListening(false), []);

  useEffect(() => {
    if (done) setListening(false);
  }, [done]);

  // Stuck timer: restarts whenever the current word changes, help closes, or listening starts.
  useEffect(() => {
    if (!listening || paused || done) return undefined;
    const t = setTimeout(() => stuckRef.current(current), STUCK_MS);
    return () => clearTimeout(t);
  }, [listening, paused, done, current]);

  return { results, current, done, listening, source, mark, markNext, applyAll, reset, start, stop };
};

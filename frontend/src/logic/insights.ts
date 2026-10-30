import type { AttemptLog, Child, Story } from '../types';
import { cleanWord, getRecommendation, getStory, STORIES, tagSounds } from '../integration';

export interface WeakSound {
  sound: string;
  count: number;
  examples: string[];
}

/** Top recurring sound-level difficulties across the logged attempts (missed or helped words). */
export const weakSoundsFromLog = (log: AttemptLog[], limit = 3): WeakSound[] => {
  const by = new Map<string, { count: number; examples: Set<string> }>();
  log
    .filter((a) => a.status !== 'correct')
    .forEach((a) => {
      tagSounds(a.word).forEach((s) => {
        const e = by.get(s) ?? { count: 0, examples: new Set<string>() };
        e.count += 1;
        e.examples.add(cleanWord(a.word));
        by.set(s, e);
      });
    });
  return [...by.entries()]
    .map(([sound, v]) => ({ sound, count: v.count, examples: [...v.examples].slice(0, 4) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/** Most recent distinct words that needed help or were missed. */
export const wordsToPractise = (log: AttemptLog[], limit = 8): string[] => {
  const out: string[] = [];
  for (let i = log.length - 1; i >= 0 && out.length < limit; i -= 1) {
    if (log[i].status === 'correct') continue;
    const w = cleanWord(log[i].word);
    if (!out.includes(w)) out.push(w);
  }
  return out;
};

/** Today's pick: the rule-based recommendation after a reading, otherwise a level-appropriate unread story. */
export const todaysPick = (child: Child): { story: Story; reason: string; recommended: boolean } => {
  if (child.lastSession) {
    const rec = getRecommendation(child, child.lastSession.results);
    return { story: getStory(rec.storyId), reason: rec.reason, recommended: true };
  }
  const fit = STORIES.filter((s) => s.level <= child.grade);
  const story = fit.find((s) => !child.progress[s.id]) ?? fit[0] ?? STORIES[0];
  return { story, reason: `A level ${story.level} story that suits Grade ${child.grade}.`, recommended: false };
};

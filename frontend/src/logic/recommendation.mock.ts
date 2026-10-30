import type { Recommendation, Story, WordResult } from '../types';
import { STORIES } from '../data/stories.mock';
import { summarise } from './mockResults';

/**
 * MOCK RECOMMENDATION — a small deterministic stand-in so the Results screen can be built.
 * Person 2 owns the real getRecommendation(childProfile, lastWordResults). Keep the
 * Recommendation shape (src/types.ts) in sync and swap the call in src/state/AppState.tsx.
 *
 * Rule used here (offline, explainable):
 *   1. If a sound caused missed/helped words -> drill that sound, then read again.
 *   2. Otherwise -> next story in the shelf.
 */
export const mockRecommendation = (story: Story, results: WordResult[]): Recommendation => {
  const s = summarise(results);
  const weak = s.weakSounds[0];

  if (weak) {
    const another = STORIES.find((x) => x.id !== story.id && x.soundTags.includes(weak.sound));
    return {
      kind: 'drill',
      storyId: another?.id ?? story.id,
      title: `Practise ${weak.sound} words`,
      focusSound: weak.sound,
      reason: `${weak.sound} was tricky in ${weak.count} word${weak.count > 1 ? 's' : ''} (${weak.examples.join(', ')}). ${
        another ? `Practise them, then try “${another.title}”.` : 'Practise them, then read this story again.'
      }`,
    };
  }

  const i = STORIES.findIndex((x) => x.id === story.id);
  const next = STORIES[(i + 1) % STORIES.length];
  return {
    kind: 'story',
    storyId: next.id,
    title: next.title,
    reason:
      s.missed + s.helped === 0
        ? 'You read every word without help, so you are ready for the next story.'
        : 'Good reading! A few words needed help, so the next story keeps the same level of challenge.',
  };
};

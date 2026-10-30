import { STORIES, getStory } from '../data/stories';
import type { Child, Recommendation, WordResult } from '../types';
import { cleanWord, tagSounds } from './sounds';

type Difficulty = { sound: string; count: number; examples: string[] };

const difficultiesFrom = (results: WordResult[]): Difficulty[] => {
  const counts = new Map<string, { count: number; examples: Set<string> }>();
  for (const result of results) {
    if (result.status === 'correct') continue;
    for (const sound of tagSounds(result.word)) {
      const current = counts.get(sound) ?? { count: 0, examples: new Set<string>() };
      current.count += 1;
      current.examples.add(cleanWord(result.word));
      counts.set(sound, current);
    }
  }
  return [...counts.entries()]
    .map(([sound, value]) => ({ sound, count: value.count, examples: [...value.examples] }))
    .sort((a, b) => b.count - a.count || a.sound.localeCompare(b.sound));
};

/**
 * Choose an explainable next activity without a network or model call.
 * A missed/helped tagged sound takes priority; otherwise the child advances through the shelf.
 */
export const getRecommendation = (child: Child, lastWordResults: WordResult[]): Recommendation => {
  const current = getStory(child.lastSession?.storyId ?? STORIES[0].id);
  const weak = difficultiesFrom(lastWordResults)[0];

  if (weak) {
    const practiceStory = STORIES.find((story) => story.id !== current.id && story.soundTags.includes(weak.sound));
    const exampleWords = weak.examples.slice(0, 2).join(', ');
    return {
      kind: 'drill',
      storyId: practiceStory?.id ?? current.id,
      title: `Practise ${weak.sound} words`,
      focusSound: weak.sound,
      reason: `${weak.sound} was tricky in ${weak.count} word${weak.count === 1 ? '' : 's'}${exampleWords ? ` (${exampleWords})` : ''}. Practise that sound, then read ${practiceStory ? `“${practiceStory.title}”` : 'this story'} again.`,
    };
  }

  const currentIndex = STORIES.findIndex((story) => story.id === current.id);
  const eligible = STORIES.filter((story) => story.level <= child.grade);
  const next = eligible.find((story) => STORIES.indexOf(story) > currentIndex && !child.progress[story.id])
    ?? eligible.find((story) => STORIES.indexOf(story) > currentIndex)
    ?? eligible.find((story) => story.id !== current.id)
    ?? current;

  return {
    kind: 'story',
    storyId: next.id,
    title: next.title,
    reason: 'You read every word without help, so you are ready for the next story.',
  };
};

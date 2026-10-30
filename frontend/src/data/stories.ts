import storyData from './stories.json';
import type { Story } from '../types';

/** Six short, bundled Kiswahili stories used by the offline demo. */
export const STORIES: Story[] = storyData as Story[];

export const getStory = (id: string): Story => STORIES.find((story) => story.id === id) ?? STORIES[0];

/** Reading tokens retain punctuation for display; matching code can normalise them with cleanWord. */
export const storyWords = (story: Story): string[] => story.text.trim().split(/\s+/u).filter(Boolean);

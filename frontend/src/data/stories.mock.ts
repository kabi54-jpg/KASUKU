import type { Story } from '../types';

/**
 * MOCK STORIES — placeholder content so the UI can be tested.
 * Person 2 owns the real stories.json. When it lands, replace this array with:
 *   import stories from '../../assets/stories.json';
 *   export const STORIES: Story[] = stories;
 * (keep the Story shape in src/types.ts in sync with Person 2's file).
 */
export const STORIES: Story[] = [
  {
    id: 's1',
    title: 'Kijana anapenda kusoma',
    level: 1,
    soundTags: [],
    text: 'Kijana anapenda kusoma vitabu. Kila siku anasoma kitabu kipya. Mama anafurahi sana.',
  },
  {
    id: 's2',
    title: "Ng'ombe wa Baba",
    level: 1,
    soundTags: ["ng'", 'ny'],
    text: "Ng'ombe analala shambani. Baba anamletea nyasi nyingi. Ng'ombe anakula nyasi zote.",
  },
  {
    id: 's3',
    title: 'Paka na Panya',
    level: 2,
    soundTags: ['ny', 'mw'],
    text: 'Paka mweusi anacheza uani. Anamkimbiza panya mdogo. Panya anaingia shimoni.',
  },
  {
    id: 's4',
    title: 'Samaki Mtoni',
    level: 2,
    soundTags: ['mv'],
    text: 'Samaki wanaogelea mtoni. Mvuvi anatupa wavu. Samaki wanakimbia haraka.',
  },
  {
    id: 's5',
    title: 'Shule Yetu',
    level: 3,
    soundTags: ['sh', 'mw'],
    text: 'Shule yetu iko karibu. Tunacheza mpira uwanjani. Mwalimu anatupongeza.',
  },
  {
    id: 's6',
    title: 'Mvua Leo',
    level: 3,
    soundTags: ['ny', 'th'],
    text: 'Mvua inanyesha leo. Watoto wanakaa nyumbani. Wanasikiliza hadithi ya bibi.',
  },
];

export const getStory = (id: string): Story => STORIES.find((s) => s.id === id) ?? STORIES[0];

/** Split a story into the word list the Reading Canvas renders (punctuation stays attached). */
export const storyWords = (story: Story): string[] => story.text.split(/\s+/).filter(Boolean);

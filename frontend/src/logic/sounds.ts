/**
 * Sound tagging + syllable splitting used by the UI.
 *
 * STUB NOTICE: Person 2 owns the real, tested splitKiswahiliSyllables(word) and the
 * tagged story data. The functions below are placeholders so the help sheet and the
 * weak-sound summary can be tested. Swap the import when Person 2's module lands.
 */

const SOUNDS = ["ng'", 'ny', 'mw', 'mv', 'mb', 'nd', 'sh', 'ch', 'dh', 'th'] as const;

export const cleanWord = (w: string): string => w.toLowerCase().replace(/[.,!?;:"“”()]/g, '');

/** Which practice sounds appear in a word. */
export const tagSounds = (word: string): string[] => {
  const w = cleanWord(word);
  return SOUNDS.filter((s) => w.includes(s));
};

const SYLLABLE_RE =
  /(?:ng'|ny|ch|sh|dh|th|gh|mb|nd|ng|nj|mw|mv|[bcdfghjklmnprstvwyz])*[aeiou]/g;

/** DRAFT splitter (verify with a Kiswahili speaker; replace with Person 2's helper). */
export const splitKiswahiliSyllables = (word: string): string[] => {
  const w = cleanWord(word);
  const parts = w.match(SYLLABLE_RE);
  if (!parts) return [w];
  const joined = parts.join('');
  // keep any trailing consonants so nothing is lost
  return joined.length < w.length ? [...parts.slice(0, -1), parts[parts.length - 1] + w.slice(joined.length)] : parts;
};

/** Words that practise a sound — feeds the "words to practise" list. */
export const hasSound = (word: string, sound: string): boolean => cleanWord(word).includes(sound);

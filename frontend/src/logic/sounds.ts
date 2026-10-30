/** Dependency-free Kiswahili sound tagging and practical syllable splitting for the demo. */

const SOUND_PATTERNS = ["ng'", 'mwa', 'ny', 'dh', 'sh', 'ch', 'th', 'mw', 'mv', 'mb', 'nd'] as const;
const ONSET_CLUSTERS = [
  "ng'", 'ny', 'ch', 'sh', 'dh', 'th', 'gh', 'mb', 'nd', 'ng', 'nj', 'nk', 'nt', 'ns', 'nz',
  'mf', 'ms', 'mt', 'mp', 'nb', 'nv', 'mw', 'mv', 'kw', 'tw', 'pw', 'bw', 'sw', 'zw',
] as const;
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/** Lowercase a displayed word while retaining the meaningful apostrophe in ng'. */
export const cleanWord = (word: string): string => word
  .toLocaleLowerCase()
  .replace(/[’`]/g, "'")
  .replace(/[^a-z']/g, '');

/** Which demo practice sounds appear in a word, longest/specific patterns first. */
export const tagSounds = (word: string): string[] => {
  const clean = cleanWord(word);
  const tags: string[] = [];
  for (const pattern of SOUND_PATTERNS) {
    if (!clean.includes(pattern)) continue;
    // “mwa” is the child-facing tag for that syllable; do not also count its “mw” prefix.
    if (pattern === 'mw' && clean.includes('mwa')) continue;
    tags.push(pattern);
  }
  return tags;
};

/**
 * Split common Kiswahili syllables into onset + vowel units.
 * It deliberately covers the demo patterns (ng', ny, mwa, dh and sh), not every
 * loanword or dialectal exception; words should be reviewed with a Kiswahili speaker.
 */
export const splitKiswahiliSyllables = (word: string): string[] => {
  const clean = cleanWord(word);
  if (!clean) return [];
  const syllables: string[] = [];
  let cursor = 0;

  while (cursor < clean.length) {
    const start = cursor;
    if (!VOWELS.has(clean[cursor])) {
      const cluster = ONSET_CLUSTERS.find((item) => clean.startsWith(item, cursor));
      cursor += cluster?.length ?? 1;
    }
    if (cursor < clean.length && VOWELS.has(clean[cursor])) cursor += 1;

    // A final consonant is kept with the preceding syllable so no character is lost.
    if (cursor === start) cursor += 1;
    syllables.push(clean.slice(start, cursor));
  }

  if (syllables.length > 1 && !VOWELS.has(syllables[syllables.length - 1].slice(-1))) {
    syllables[syllables.length - 2] += syllables.pop();
  }
  return syllables;
};

/** Words that practise a sound — feeds the "words to practise" list. */
export const hasSound = (word: string, sound: string): boolean => tagSounds(word).includes(sound) || cleanWord(word).includes(sound);

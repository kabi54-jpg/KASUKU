import type { WordResult } from '../types';

/**
 * INTEGRATION POINT — Person 1 (Speech Engine & QVAC pipeline).
 *
 * Replace the bodies below with the real @qvac/sdk-backed functions once the
 * runtime (Expo Go vs. development build) is confirmed. Signatures match the plan:
 *   evaluateAudio(audioUri, targetStoryText): Promise<WordResult[]>
 *   speakWord(word): Promise<void>
 *
 * Until then `speechEngineAvailable` is false and the UI says so honestly instead of
 * pretending to recognise speech.
 */
export const speechEngineAvailable = false;

export class SpeechEngineNotConnected extends Error {
  constructor(fn: string) {
    super(`${fn}() is not connected yet (waiting for Person 1's QVAC pipeline).`);
    this.name = 'SpeechEngineNotConnected';
  }
}

export async function evaluateAudio(_audioUri: string, _targetStoryText: string): Promise<WordResult[]> {
  throw new SpeechEngineNotConnected('evaluateAudio');
}

export async function speakWord(_word: string): Promise<void> {
  throw new SpeechEngineNotConnected('speakWord');
}

/**
 * DEV-ONLY on-device check of the QVAC pipeline, no UI needed.
 *
 * Does nothing unless the developer has copied files into the app's private document
 * directory with adb (debug builds only):
 *   selftest.wav   audio to score (16 kHz mono WAV, or an expo-audio .m4a renamed)
 *   selftest.txt   target text
 * Results go to the Metro log, prefixed [KASUKU-SELFTEST]. Both files are deleted after
 * the run so no audio stays on the phone. See speech-engine/docs/integration.md.
 */
import { File, Paths } from 'expo-file-system';
import { transcribeWords } from '../speechEngine';
import { alignWords } from './align';

const TAG = '[KASUKU-SELFTEST]';

export async function runSpeechSelfTest(): Promise<void> {
  const audio = ['selftest.wav', 'selftest.m4a'].map((n) => new File(Paths.document, n)).find((f) => f.exists);
  const target = new File(Paths.document, 'selftest.txt');
  if (!audio || !target.exists) return;

  console.log(TAG, 'start', audio.name);
  const t0 = Date.now();
  try {
    const heard = await transcribeWords(audio.uri);
    const ms = Date.now() - t0;
    const words = alignWords(await target.text(), heard);
    const counts = words.reduce<Record<string, number>>((acc, w) => ({ ...acc, [w.status]: (acc[w.status] ?? 0) + 1 }), {});
    console.log(TAG, 'done', JSON.stringify({ totalMs: ms, counts }));
    // raw heard words let speech-engine/scripts/score.ts re-tune thresholds offline
    console.log(TAG, 'heard', JSON.stringify(heard));
    console.log(TAG, 'words', JSON.stringify(words));
  } catch (e) {
    console.log(TAG, 'error', e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  } finally {
    for (const f of [audio, target]) {
      try {
        f.delete();
      } catch {
        // best effort
      }
    }
  }
}

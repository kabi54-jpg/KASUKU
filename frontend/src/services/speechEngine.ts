import { File, Paths } from 'expo-file-system';
import { loadModel, transcribe, unloadModel, WHISPER_SMALL_Q8_0 } from '@qvac/sdk';
import type { WordResult } from '../types';
import { alignWords, toFrontendStatus, type AlignedWord, type HeardWord } from './speech/align';

/**
 * INTEGRATION POINT — Person 1 (Speech Engine & QVAC pipeline).
 *
 *   evaluateAudio(audioUri, targetStoryText): Promise<WordResult[]>
 *   speakWord(word): Promise<void>
 *
 * Whisper runs on the phone through @qvac/sdk (development build, not Expo Go).
 * `speechEngineAvailable` flips to true only once this is verified on the demo phone;
 * until then the UI says so honestly instead of pretending to recognise speech.
 */
export const speechEngineAvailable = false;

export class SpeechEngineNotConnected extends Error {
  constructor(fn: string) {
    super(`${fn}() is not connected yet (waiting for Person 1's QVAC pipeline).`);
    this.name = 'SpeechEngineNotConnected';
  }
}

/** Optional pre-copied model (adb push, for offline demos); otherwise the SDK registry is used. */
const LOCAL_MODEL_NAME = 'ggml-small-q8_0.bin';

/** Whisper initial prompt. Off until Step 2 measures whether it hides struggled words. */
const PROMPT: string | undefined = undefined;

const toPath = (uri: string) => decodeURI(uri.replace(/^file:\/\//, ''));

function modelSource() {
  const local = new File(Paths.document, LOCAL_MODEL_NAME);
  return local.exists
    ? { modelSrc: toPath(local.uri), modelType: 'whispercpp-transcription' as const }
    : { modelSrc: WHISPER_SMALL_Q8_0 };
}

/** Transcribe with one Whisper segment per word. Loads the model only for this call. */
export async function transcribeWords(audioUri: string): Promise<HeardWord[]> {
  const modelId = await loadModel({
    ...modelSource(),
    modelConfig: {
      language: 'sw',
      strategy: 'greedy',
      temperature: 0.0,
      translate: false,
      no_timestamps: false,
      token_timestamps: true,
      max_len: 1,
      split_on_word: true,
      suppress_blank: true,
      suppress_nst: true,
    },
  } as Parameters<typeof loadModel>[0]);
  try {
    const segments = await transcribe({ modelId, audioChunk: toPath(audioUri), metadata: true, ...(PROMPT ? { prompt: PROMPT } : {}) });
    return segments.map((s) => ({ text: s.text.trim(), startMs: s.startMs, endMs: s.endMs }));
  } finally {
    await unloadModel({ modelId });
  }
}

/** Richer result for the harness and future UI (heard text, similarity, pauses). */
export async function evaluateAudioDetailed(audioUri: string, targetStoryText: string, keepAudio = false): Promise<AlignedWord[]> {
  try {
    return alignWords(targetStoryText, await transcribeWords(audioUri));
  } finally {
    // Children's audio is never kept after scoring.
    if (!keepAudio) {
      try {
        const f = new File(audioUri);
        if (f.exists) f.delete();
      } catch {
        // best effort
      }
    }
  }
}

export async function evaluateAudio(audioUri: string, targetStoryText: string): Promise<WordResult[]> {
  const aligned = await evaluateAudioDetailed(audioUri, targetStoryText);
  return aligned.map((w) => ({
    index: w.index,
    word: w.word,
    status: toFrontendStatus(w.status),
    ...(w.durationMs !== undefined ? { ms: w.durationMs } : {}),
  }));
}

export async function speakWord(_word: string): Promise<void> {
  throw new SpeechEngineNotConnected('speakWord');
}

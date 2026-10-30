# QVAC speech notes (verified from installed SDK, not guessed)

Sources: `node_modules/@qvac/sdk` 0.22.0 type definitions and `dist/examples/asr/*`,
`@qvac/sdk/models` constants (printed at runtime), official docs export
`https://docs.qvac.tether.io/llms-full.txt` (Expo tutorial: `/resources/tutorials/expo`).

## Versions
| Package | Version |
|---|---|
| `@qvac/sdk` | 0.22.0 (npm `latest` on 2026-10-30) |
| `@qvac/asr-ggml` / `asr-ggml-win32-x64` | 0.10.0 (pulled in by the SDK) |
| `react-native-bare-kit` | 0.16.0 latest; SDK peer `>=0.16.0`; tutorial `^0.16.0` |
| `bare-rpc` | 1.3.9 latest; tutorial adds it as a dependency |
| Expo SDK 54 pins | `expo-build-properties ~1.0.10`, `expo-device ~8.0.10`, `expo-file-system ~19.0.23`, `expo-audio ~1.1.1` |
| Node (laptop) | 24.15.0 |

## API used
```ts
import { loadModel, unloadModel, transcribe } from '@qvac/sdk';
import { WHISPER_SMALL_Q8_0 } from '@qvac/sdk/models';

const modelId = await loadModel({
  modelSrc: WHISPER_SMALL_Q8_0,          // or a local path + modelType: 'whispercpp-transcription'
  modelConfig: { language: 'sw', audio_format: 's16le', strategy: 'greedy', temperature: 0,
                 token_timestamps: true, max_len: 1, split_on_word: true, initial_prompt?: string,
                 contextParams: { use_gpu: boolean } },
  onProgress: (p) => p.percentage,       // { percentage, downloaded, total }
});
const segs = await transcribe({ modelId, audioChunk: pathOrBuffer, prompt?: string, metadata: true });
// segs: { text, startMs, endMs, append, id }[]   (without metadata: a joined string)
await unloadModel({ modelId });
```
- **Initial prompt: supported.** Either `transcribe({ prompt })` or `modelConfig.initial_prompt`.
- **Word timestamps: not exposed as a separate API.** `metadata: true` returns segment
  timestamps only. The Whisper config accepts `token_timestamps`, `max_len` and
  `split_on_word`; whisper.cpp semantics of `max_len: 1` + `split_on_word: true` is one
  segment per word. **Not yet verified through QVAC** (blocked, see Status).
- `audioChunk` accepts a file path or an in-memory buffer. The SDK bundles an FFmpeg
  decoder (`@qvac/decoder-audio`) by default; README: keep it when the app "decodes
  compressed audio files". Docs list `'wav' | 'mp3' | 'm4a'` as encoded input formats for
  the Whisper FFmpeg path. **m4a input not yet verified on device.**

## Model constants (multilingual Whisper; `.en` and single-language variants omitted)
| Constant | File | Bytes |
|---|---|---|
| `WHISPER_TINY_Q8_0` | ggml-tiny-q8_0.bin | 43,537,433 |
| `WHISPER_TINY` | ggml-tiny.bin | 77,691,713 |
| `WHISPER_BASE_Q8_0` | ggml-base-q8_0.bin | 81,768,585 |
| `WHISPER_BASE_Q0F16` | ggml-base.bin | 147,951,465 |
| `WHISPER_SMALL_Q8_0` | ggml-small-q8_0.bin | 264,464,607 |
| `WHISPER_SMALL_Q0F16` | ggml-small.bin | 487,601,967 |
| `WHISPER_LARGE_V3_TURBO` | ggml-large-v3-turbo.bin | 1,624,555,275 |

Registry paths point at `ggerganov/whisper.cpp` commit `5359861c…`; the same files are on
Hugging Face at that commit (used locally because the registry download ran ~0.15 MB/s).

## TTS constants (for Step 4, unverified)
Chatterbox multilingual: `TTS_T3_MULTILINGUAL_CHATTERBOX_{FP16,Q4_0,Q5_0,Q8_0}` (Q4_0 = 345 MB)
+ `TTS_S3GEN_MULTILINGUAL_CHATTERBOX_{,Q4_0,Q5_0,Q8_0}` (Q4_0 = 788 MB). Plugin
`@qvac/sdk/tts-ggml/plugin`. Output: 16-bit mono PCM, 24 kHz for Chatterbox.
Kiswahili support not yet verified.

## Expo (official tutorial, summarised)
Deps `@qvac/sdk`, `bare-rpc`, `react-native-bare-kit`; `npx expo install expo-file-system
expo-build-properties expo-device`; app.json plugins `["expo-build-properties", { android:
{ minSdkVersion: 29 } }]` and `["@qvac/sdk/expo-plugin", { installMissingPrebuilds: true }]`;
`qvac.config.json` with `plugins: ["@qvac/sdk/whispercpp-transcription/plugin"]`;
`npx expo prebuild` (re-run after every install); `npx expo run:android --device`.
Physical device only (no emulators). Exact proposed diff: `frontend-native.patch`.

## Recording format (expo-audio 1.1.1)
`RecordingPresets.HIGH_QUALITY` on Android = `.m4a`, MPEG-4/AAC, 44.1 kHz, 2 ch, 128 kbps.
Android MediaRecorder cannot write WAV. Proposed recorder options for speech:
`{ extension: '.m4a', sampleRate: 16000, numberOfChannels: 1, bitRate: 64000,
android: { outputFormat: 'mpeg4', audioEncoder: 'aac' } }` and pass the file path to
`transcribe` (SDK decodes via FFmpeg). Verify on the phone; if m4a is rejected, decode in
the app is the fallback (to be designed only if needed).

## Status
- **Windows (laptop): Whisper load fails.** `loadModel` with a local `ggml-base-q8_0.bin`
  (size matches registry) → `MODEL_LOAD_FAILED: Failed to activate model, error: Failed to
  initialize Whisper context` (code 52200). Same with `use_gpu: false` and with an
  absolute path. Registry download route not completed (too slow), so untested.
  Per instructions, not worked around; next test is on the Android phone.
- Offline proof: not done yet (needs a working load first).

/**
 * Step 1/2 harness: transcribe a 16 kHz mono WAV with a QVAC Whisper model.
 *
 *   npx tsx scripts/transcribe.ts <wav> [MODEL_CONSTANT] [none|short|full] [--words]
 *
 * MODEL is a constant from @qvac/sdk/models or a local whisper.cpp .bin path.
 * Prints one JSON line: transcript, segments, load/transcribe ms and the peak working
 * set of the QVAC worker process. Audio never leaves this machine.
 */
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { loadModel, unloadModel, transcribe } from '@qvac/sdk';
import * as models from '@qvac/sdk/models';

const [wav, modelName = 'WHISPER_SMALL_Q8_0', promptMode = 'none', ...flags] = process.argv.slice(2);
if (!wav) {
  console.error('Usage: tsx scripts/transcribe.ts <wav> [MODEL] [none|short|full] [--words]');
  process.exit(1);
}
const words = flags.includes('--words');
// Either a registry constant from @qvac/sdk/models or a local whisper.cpp .bin path
const isLocal = modelName.endsWith('.bin');
const modelSrc = isLocal ? modelName : (models as Record<string, unknown>)[modelName];
if (!modelSrc) throw new Error(`Unknown model constant ${modelName}`);

/** Peak working set (MB) of the QVAC worker processes spawned by this Node process (Windows). */
function workerPeakMb(): number | null {
  if (process.platform !== 'win32') return null;
  try {
    const ps = `Get-CimInstance Win32_Process -Filter "ParentProcessId=${process.pid}" | ForEach-Object { (Get-Process -Id $_.ProcessId).PeakWorkingSet64 } | Measure-Object -Maximum | ForEach-Object { $_.Maximum }`;
    const encoded = Buffer.from(ps, 'utf16le').toString('base64');
    const out = execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, { encoding: 'utf8' }).trim();
    return out ? Math.round(Number(out) / 1e6) : null;
  } catch {
    return null;
  }
}

const SHORT_PROMPT = 'Kijana anapenda kusoma';
const prompt =
  promptMode === 'short' ? SHORT_PROMPT
  : promptMode === 'full' ? readFileSync(new URL('../data/reading.txt', import.meta.url), 'utf8').trim()
  : undefined;

const t0 = performance.now();
const modelId = await loadModel({
  modelSrc: modelSrc as never,
  ...(isLocal ? { modelType: 'whispercpp-transcription' } : {}),
  modelConfig: {
    audio_format: 's16le',
    strategy: 'greedy',
    n_threads: 4,
    language: 'sw',
    translate: false,
    no_timestamps: false,
    single_segment: false,
    token_timestamps: true,
    ...(words ? { max_len: 1, split_on_word: true } : {}),
    temperature: 0.0,
    suppress_blank: true,
    suppress_nst: true,
    contextParams: { use_gpu: process.env.QVAC_GPU === '1' },
  },
  onProgress: (p) => process.stderr.write(`download ${p.percentage.toFixed(0)}%\r`),
});
const loadMs = performance.now() - t0;

const t1 = performance.now();
const segments = await transcribe({ modelId, audioChunk: wav, metadata: true, ...(prompt ? { prompt } : {}) });
const transcribeMs = performance.now() - t1;
const peakWorkerMb = workerPeakMb();
await unloadModel({ modelId });

console.log(JSON.stringify({
  model: modelName,
  promptMode,
  wordSegments: words,
  loadMs: Math.round(loadMs),
  transcribeMs: Math.round(transcribeMs),
  peakWorkerMb,
  text: segments.map((s) => s.text).join('').trim(),
  segments: segments.map((s) => ({ text: s.text, startMs: s.startMs, endMs: s.endMs })),
}));
process.exit(0);

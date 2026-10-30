# Speech results (measured only)

Package `@qvac/sdk` 0.22.0, `@qvac/asr-ggml-android-arm64` 0.10.0. Language `sw`, greedy,
temperature 0, word segments (`token_timestamps`, `max_len: 1`, `split_on_word: true`).
Scoring: `scripts/score.ts` against the human reviews, thresholds correct >= 0.8,
misread < 0.5 (untuned defaults).

## Runs
| Date/time (EAT) | Where | Model | Size | Prompt | Audio | Transcribe+load | Word acc. | Struggled detected | Fluent words wrongly flagged | Offline |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-30 14:11 | Phone SM-A065F (Android 16, 3.7 GB RAM) | WHISPER_BASE_Q8_0 (sha256 verified) | 82 MB | none | child1, 62.5 s | 35.1 s | 0.38 (22/58) | 0/3 (all 3 landed in "uncertain") | 18 | not proven (see below) |

Notes:
- Word-level timestamps ARE produced through QVAC with the config above (98 word segments
  for child1; base splits words into fragments).
- Peak memory on the phone: not measured yet.
- Offline: model loaded from a local file and the phone reported no Wi-Fi/mobile traffic
  during launch, but no airplane-mode run has been done, so offline is **not proven** yet.

## Failures
- Windows laptop: `MODEL_LOAD_FAILED ... Failed to initialize Whisper context` with
  WHISPER_BASE_Q8_0 (sha256 verified). Not investigated further (out of scope).
- Phone with a corrupt `ggml-small-q8_0.bin` (wrong sha256 from an interrupted download):
  same error message. Fixed by re-downloading; small not yet run on the phone.

## Not yet measured
Whisper small, prompt settings (none / short / full reading.txt), child2, threshold tuning,
precision/recall per child, peak memory, offline (airplane mode) run.

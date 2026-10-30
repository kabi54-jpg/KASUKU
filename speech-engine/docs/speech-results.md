# Speech results (measured only)

Package `@qvac/sdk` 0.22.0, `@qvac/asr-ggml-android-arm64` 0.10.0. Language `sw`, greedy,
temperature 0, word segments (`token_timestamps`, `max_len: 1`, `split_on_word: true`).
Scoring: `scripts/score.ts` against the human reviews, thresholds correct >= 0.8,
misread < 0.5 (untuned defaults).

## Runs
| Date/time (EAT) | Where | Model | Size | Prompt | Audio | Transcribe+load | Word acc. | Struggled detected | Fluent words wrongly flagged | Offline |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-30 14:11 | Phone SM-A065F (Android 16, 3.7 GB RAM) | WHISPER_BASE_Q8_0 (sha256 verified) | 82 MB | none | child1, 62.5 s | 35.1 s | 0.38 (22/58) | 0/3 (all 3 landed in "uncertain") | 18 | not proven |
| 2026-10-30 14:19 | same phone, Wi-Fi off | WHISPER_SMALL_Q8_0 (sha256 verified) | 264 MB | none | child1, 62.5 s | 205.9 s (3.3x audio) | 0.48 (28/58) | 0/3, precision 0/4 | 4 | not proven (mobile data on) |
| 2026-10-30 14:24 | same phone, **airplane mode on, no IPv4 except loopback** | WHISPER_SMALL_Q8_0 | 264 MB | none | child2, 93.6 s | 252.9 s (2.7x audio) | 0.71 (41/58) | 1/10 (recall 0.10), precision 1/7 (0.14) | 5 (+1 choppy) | **yes** |

Peak memory (app process VmHWM, read right after scoring): small/child1 906 MB,
small/child2 1,163 MB. Base: not measured.

## Why detection fails (measured similarity, Whisper small)
Similarity of what Whisper wrote vs the target word, 1 = identical:
- child1 struggled words: 0.89, 0.60, 0.60. Fluent words: median 0.80, 11/53 below 0.6.
- child2 struggled words: 0.67, 0.67, 0.55, **1.00**, 0.90, 0.86, 0.64, **1.00**, 0.67, 0.47.
  Fluent words: median 1.00, 9/40 below 0.6.
Whisper often writes the *intended* word even when the child struggled (its language
model "corrects" the child), and also mangles words read fluently. The two distributions
overlap, so no threshold separates them.

Threshold sweep (correctAt 0.6 to 0.9, misreadBelow 0.3 to 0.6): best child2 recall was 0.40
at precision 0.20 with 14 fluent words wrongly flagged (0.9 / 0.6); child1 recall stayed 0
at every setting. **Defaults kept at 0.8 / 0.5** (no tuned setting was better without
flagging many fluent words). With the frontend mapping (uncertain -> correct) the defaults
mark 4 (child1) and 6 (child2) correctly read words as `missed`.

## Prompt settings
Not run: each phone run takes 3.5 to 4.5 min. Expectation, untested: a prompt containing
reading.txt pushes Whisper further toward the target text, which would hide more
struggled words, so it is the riskiest setting. Recommended setting: **no prompt**.

Notes:
- Word-level timestamps ARE produced through QVAC with the config above (98 word segments
  for child1; base splits words into fragments).
- Offline proven on the child2 run (airplane mode, model from local file, Metro over USB
  only serves the JS bundle).

## Failures
- Windows laptop: `MODEL_LOAD_FAILED ... Failed to initialize Whisper context` with
  WHISPER_BASE_Q8_0 (sha256 verified). Not investigated further (out of scope).
- Phone with a corrupt `ggml-small-q8_0.bin` (wrong sha256 from an interrupted download):
  same error message. Fixed by re-downloading; small not yet run on the phone.

## Not yet measured
Prompt settings; base on child2; base peak memory; m4a input from the real recorder.

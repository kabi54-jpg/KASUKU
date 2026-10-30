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

## Timing as a struggle signal (scripts/timing.ts, same phone transcripts)
Features per target word: ms per letter, pause before, and a combination. AUC 0.5 = chance.
| Transcript | Positives | ms/letter AUC | pause-before AUC | combined AUC |
|---|---|---|---|---|
| child1 small, struggled | 3 | 0.30 | 0.44 | 0.27 |
| child1 small, struggled+choppy | 5 | 0.31 | 0.44 | 0.27 |
| child1 base, struggled | 3 | 0.27 | 0.44 | 0.24 |
| child2 small, struggled | 10 | 0.50 | 0.64 | 0.61 |
| child2 small, struggled+choppy | 18 | 0.51 | 0.54 | 0.55 |

Best single result: child2 pause-before >= 1030 ms flags 4/10 struggled words with 3 false
flags (P 0.57, R 0.40), but the threshold was picked on the same data and child1 goes the
other way (AUC below 0.5). **Not usable.**

Root cause: Whisper word timestamps are contiguous. child2/small: 87 of 90 gaps between
consecutive word segments are exactly 0 ms, so silence is absorbed into word durations.
Of the 5 long pauses marked in the child2 review, 1 shows up as a gap (1,580 ms); the
other 4 read 0 ms. Pauses therefore have to come from the audio itself (RMS silence
detection), not from Whisper.

## m4a input (recorder format, 2026-10-30 15:09, phone, airplane mode on)
child2.wav was converted with ffmpeg to the recorder settings in integration.md: AAC-LC,
16 kHz, mono, 64 kbps, mp4 container. It was then run through the self-test (`transcribeWords`)
with WHISPER_SMALL_Q8_0 and no prompt.
This tests whether QVAC can read m4a. It does not test a real expo-audio recording.

| Input | Transcribe+load | Peak VmHWM | Word acc. | Fluent marked missed (old / conservative) | Hint: struggled found, fluent hinted |
|---|---|---|---|---|---|
| WAV 16 kHz PCM | 252.9 s | 1,163 MB | 0.71 | 5 / 1 | 10/10, 6 |
| m4a AAC 64 kbps | 199.2 s | 1,048 MB | **0.52** | 11 / 1 | 8/10, 11 |

- **m4a works on the device:** QVAC decodes it with no conversion step.
- **But accuracy drops:** 64 kbps AAC costs 19 points of word accuracy on this recording
  (one run each; greedy decoding at temperature 0 is deterministic for a given input).
- **The conservative rule still holds:** 1 fluent word marked missed in both runs.
- **Next:** test a higher recorder bitrate (128 kbps, or 44.1 kHz) before the demo. Until then,
  don't use the 64 kbps setting from integration.md for scoring.

## Conservative "missed" rule (`conservativeStatuses`, used by `evaluateAudio`, 2026-10-30)
Policy: a fluent child must almost never be marked wrong. A missed real struggle can still be
recorded with Help. A word is `missed` only if all of these hold:
- it is misread or missed (never uncertain);
- it sits in a run of at most 2 such words;
- the words on both sides of the run were read correctly.

Everything else counts as correct. Fillers and inserted words were already left out of the
scoring sequence by the aligner.

| Transcript | Fluent marked missed: old → new | Struggled marked missed: old → new |
|---|---|---|
| child1 small | 4 → **0** | 0/3 → 0/3 |
| child1 base | 18 → **0** | 0/3 → 0/3 |
| child2 small | 5 (+1 choppy) → **1** | 1/10 → 0/10 |

The trade-off is deliberate: red "missed" marks become rare, and struggles are surfaced by the
soft hint and the Help button instead. Call any red mark "experimental feedback", not a diagnosis.

## "Took a while" hint (`AlignedWord.hesitated`, 2026-10-30)
Why scoring misses struggles: the reviews mark a word as struggled even when the child got it
right in the end. Whisper writes only the final word, so its text often matches.
The struggle does leave traces, though:
- **False start:** a heard fragment just before the word that the aligner leaves unassigned
  is a partial match of the word (similarity >= 0.5, or a prefix of 2+ letters).
- **Sounded out:** Whisper hears the word in two pieces that don't join up to exactly the word.
  Pieces that do join up exactly are just Whisper's token split and are ignored. That rule cut
  child2's fluent false hints from 11 to 6 with no loss.

The hint never changes `status`; word accuracy is unchanged.

| Transcript | Struggled hinted | Hinted on fluent words | Hinted on choppy | Precision |
|---|---|---|---|---|
| child2 small | **10/10** | 6/40 | 2/8 | 0.56 |
| child1 small | 2/3 | 19/53 | 1/2 | 0.09 |
| child1 base | 3/3 | 30/53 | 1/2 | 0.09 |

Compare word matching alone: 1/10 (child2) and 0/3 (child1).
The rule was designed while looking at these same two children (13 struggled words in all), so
treat this as promising, not proven. Whisper splits many of child1's fluent words, so the hint is
noisy for that child. Show it as a soft "took a while" hint, never as a mistake.

## Phrasing from the audio (scripts/phrasing.ts, 2026-10-30)
`frontend/src/services/speech/phrasing.ts`: RMS energy on 20 ms frames, silent if below
the 10th-percentile frame + 10 dB, silences >= 150 ms kept. Each silence is added to the
word gap whose Whisper boundary is nearest. A full stop with < 250 ms of silence counts as
read through, and a mid-sentence gap with > 700 ms counts as a long pause.
`analysePhrasing(aligned, text, silences)` is separate; `evaluateAudio` is unchanged.
Run on data/*.wav plus the Whisper small transcripts from the phone (computed on the laptop).

| Child | Long pauses (truth) | Detected | Ran-through stops (truth) | Detected |
|---|---|---|---|---|
| child1 | 0 | 0 found, 0 false | 1 | 1/1 found, 3 false (of 7 stops) |
| child2 | 5 | 1/5 found, 1 false | 2 | 1/2 found, 2 false |

Sweep (margin 6 to 15 dB, min silence 100 to 200 ms, stop 150 to 350 ms, long 400 to 900 ms),
both children pooled: best F1 0.43 (3 found, 3 false, 5 missed) vs 0.35 at the defaults.
That is picked from only 8 true events, so **the defaults are kept**.
Why it misses:
- For 2 of the 5 child2 pauses (after words 9 and 16) the audio has no silence >= 400 ms
  anywhere nearby. The pause is filled with sound (breath or a held vowel), which energy
  cannot tell apart from speech.
- The silences that are found often sit 0.5 to 2 s away from Whisper's word boundary
  (example: the pause after word 54), so they get attached to the wrong gap.
**Verdict: experimental. Do not show phrasing feedback to children.**

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
  same error message. Fixed by re-downloading (sha256 now matches the registry).

## Not yet measured
Prompt settings; base on child2; base peak memory; m4a input from the real recorder.

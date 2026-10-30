# Speech engine: notes for the frontend

Status: engine code is in; **`speechEngineAvailable` stays `false` until Whisper is verified
on the demo phone** (SM-A065F). Numbers live in `speech-results.md`; none are estimated.

## Running the app now
Expo Go can no longer run this app (QVAC is native code). From `frontend/`:
```
npm install
npx expo prebuild --platform android   # re-run after every npm install
npx expo run:android                   # phone on USB with debugging on; JDK 17
```
After the first install, `npx expo start` and open the installed "Soma Nami" dev build.
`android/` and `ios/` are generated and git-ignored.

## API (import from `src/integration`, unchanged names)
```ts
evaluateAudio(audioUri: string, targetStoryText: string): Promise<WordResult[]>
speakWord(word: string): Promise<void>        // still throws SpeechEngineNotConnected
speechEngineAvailable: boolean
SpeechEngineNotConnected
```
- Pass `story.text` as `targetStoryText`. `WordResult.index` = position in
  `story.text.split(/\s+/)`, the same as `storyWords()`; `word` is the story's spelling.
- `status` is only `'correct' | 'missed'`. The engine never returns `'helped'`; the UI sets
  it when Kasuku reads a word. Unsure words come back `'correct'` (never mark a child
  wrong when unsure).
- `ms` = how long the child took to say the word (Whisper word timestamps), when present.
- `evaluateAudio` **deletes the recording file** after scoring. Don't reuse the URI.
- Extra detail (what was heard, similarity, pause before each word) is available from
  `evaluateAudioDetailed` in `services/speechEngine.ts`. Adding optional `heard` /
  `pauseBeforeMs` to `WordResult` needs a `types.ts` change, proposed separately.

## Recording (expo-audio, in ReadingScreen)
Android can't record WAV; record AAC/m4a at speech settings and pass the URI:
```ts
const recorder = useAudioRecorder({
  extension: '.m4a', sampleRate: 16000, numberOfChannels: 1, bitRate: 128000, // 64 kbps measured worse
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
  ios: { audioQuality: AudioQuality.HIGH, outputFormat: IOSOutputFormat.MPEG4AAC },
});
// start: await recorder.prepareToRecord(); recorder.record();
// stop:  await recorder.stop(); const results = await evaluateAudio(recorder.uri!, story.text);
```
m4a input is **verified on the phone** (speech-results.md, "m4a input"), but 64 kbps AAC cut word
accuracy from 0.71 to 0.52 on child2. Use a higher bitrate (128 kbps) until that is measured;
see the self-test below for checking it. Show a "Kasuku is listening to your reading…"
state while `evaluateAudio` runs: transcription takes seconds (measured value in
speech-results.md).

## Model and first launch
- Model: `WHISPER_SMALL_Q8_0` (264 MB), Kiswahili (`language: 'sw'`).
- If `ggml-small-q8_0.bin` is in the app's document directory it is used (fully offline).
  Otherwise the SDK downloads it from the QVAC registry on first use: this was very slow
  on the laptop, so **for the demo pre-copy it** (below) and don't rely on venue Wi-Fi.
- Whisper is loaded inside each `evaluateAudio` call and unloaded at the end, so it uses
  memory only while scoring a reading (phone has ~3.7 GB RAM).

## Developer self-test (debug builds only)
`index.ts` runs `services/speech/selftest.ts` at startup in `__DEV__`; it does nothing unless
these files exist in the app's private document dir:
```
adb push model.bin /data/local/tmp/ && adb shell run-as com.kasuku.somanami cp /data/local/tmp/ggml-small-q8_0.bin files/
adb push audio.wav /data/local/tmp/selftest.wav && adb shell run-as com.kasuku.somanami cp /data/local/tmp/selftest.wav files/
adb push text.txt  /data/local/tmp/selftest.txt && adb shell run-as com.kasuku.somanami cp /data/local/tmp/selftest.txt files/
adb shell rm /data/local/tmp/selftest.*
```
Restart the app; results appear in the Metro log as `[KASUKU-SELFTEST]`. The audio and text
files are deleted after the run.

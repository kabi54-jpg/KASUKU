import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, role } from '../theme';
import { Badge, Btn, HardBox, MockBanner, ProgressBar, Txt } from '../components/ui';
import { KasukuBuddy, type BuddyState } from '../components/KasukuBuddy';
import { cleanWord, liveSpeechAvailable, speakWord, SpeechEngineNotConnected, speechOutputAvailable, splitKiswahiliSyllables, startLiveSpeechSession, STORIES, tagSounds, storyWords, type LiveSpeechSession } from '../integration';
import { weakSoundsFromLog, wordsToPractise } from '../logic/insights';
import { todayStr } from '../data/avatars';
import type { AttemptLog, ResultSource, WordResult, WordStatus } from '../types';
import { useApp } from '../state/AppState';

type PracticePhase = 'idle' | 'starting' | 'listening' | 'processing' | 'speaking' | 'result' | 'complete';

const makePracticeSet = (log: AttemptLog[]) => {
  const recent = wordsToPractise(log, 5);
  const focus = weakSoundsFromLog(log, 1)[0]?.sound
    ?? STORIES.find((story) => story.soundTags.length > 0)?.soundTags[0]
    ?? "ng'";
  const tagged = STORIES.flatMap((story) => storyWords(story))
    .map(cleanWord)
    .filter((word) => tagSounds(word).includes(focus));
  const recentForSound = recent.filter((word) => tagSounds(word).includes(focus));
  const words = [...new Set([...recentForSound, ...tagged])].slice(0, 5);
  return { focus, words: words.length ? words : ["ng'ombe", 'nyumba', 'shule'] };
};

export const PracticeScreen = () => {
  const { child, updateChild, showToast } = useApp();
  const [plan] = useState(() => makePracticeSet(child?.wordLog ?? []));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<PracticePhase>('idle');
  const [result, setResult] = useState<WordResult | null>(null);
  const [resultSource, setResultSource] = useState<ResultSource>('none');
  const [attempts, setAttempts] = useState<WordResult[]>([]);
  const sessionRef = useRef<LiveSpeechSession | null>(null);
  const startedAt = useRef(0);
  const resolvedAttempt = useRef(false);

  useEffect(() => () => { void sessionRef.current?.cancel(); }, []);

  const word = plan.words[index];
  const syllables = word ? splitKiswahiliSyllables(word) : [];
  const sounds = word ? tagSounds(word) : [];
  const passed = result?.status === 'correct' || result?.status === 'helped';

  const recordResult = useCallback((incoming: WordResult, source: ResultSource) => {
    if (!child || !word || resolvedAttempt.current) return;
    resolvedAttempt.current = true;
    const finalResult: WordResult = {
      ...incoming,
      index,
      word,
      ms: incoming.ms ?? Math.max(0, Date.now() - startedAt.current),
    };
    setResult(finalResult);
    setResultSource(source);
    setPhase('result');
    setAttempts((previous) => [...previous, finalResult]);
    updateChild(child.id, {
      wordLog: [
        ...child.wordLog,
        { storyId: 'practice', word, status: finalResult.status, ms: finalResult.ms, date: todayStr(), source },
      ].slice(-300),
    });
    if (source === 'live' && sessionRef.current) {
      const live = sessionRef.current;
      sessionRef.current = null;
      void live.stop().catch(() => undefined);
    }
  }, [child, index, updateChild, word]);

  const startAttempt = async () => {
    if (!word || !liveSpeechAvailable) {
      showToast('Local speech recognition is not connected yet. Use the labelled preview controls to explore this screen.');
      return;
    }
    resolvedAttempt.current = false;
    startedAt.current = Date.now();
    setResult(null);
    setResultSource('none');
    setPhase('starting');
    try {
      sessionRef.current = await startLiveSpeechSession(word, {
        onWordResult: (r) => recordResult(r, 'live'),
        onPhase: (next) => { if (!resolvedAttempt.current) setPhase(next); },
        onError: (error) => {
          if (resolvedAttempt.current) return;
          const active = sessionRef.current;
          sessionRef.current = null;
          void active?.cancel();
          setPhase('idle');
          showToast(error.message || 'Kasuku could not hear that attempt. Please try again.');
        },
      });
      setPhase((current) => current === 'starting' ? 'listening' : current);
    } catch (error) {
      setPhase('idle');
      showToast(error instanceof SpeechEngineNotConnected ? 'Local speech recognition is not connected yet.' : 'Could not start the microphone. Check microphone permission and try again.');
    }
  };

  const stopAttempt = async () => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session) return;
    setPhase('processing');
    try {
      const finalResults = await session.stop();
      if (!resolvedAttempt.current && finalResults[0]) recordResult(finalResults[0], 'live');
      else if (!resolvedAttempt.current) {
        setPhase('idle');
        showToast('Kasuku did not get a clear word. Try once more, a little closer to the microphone.');
      }
    } catch {
      setPhase('idle');
      showToast('Could not finish checking that word. Please try again.');
    }
  };

  const previewResult = (status: WordStatus) => {
    resolvedAttempt.current = false;
    startedAt.current = Date.now();
    recordResult({ index, word, status, ms: 950 }, 'mock');
  };

  const hearWord = async () => {
    if (!word || !speechOutputAvailable) {
      showToast('Kasuku’s local Kiswahili voice is not connected yet. Use the syllable guide for now.');
      return;
    }
    setPhase('speaking');
    try {
      await speakWord(word);
      setPhase('result');
    } catch {
      setPhase('result');
      showToast('Could not play Kasuku’s voice.');
    }
  };

  const retry = () => {
    setResult(null);
    setResultSource('none');
    setPhase('idle');
    resolvedAttempt.current = false;
  };

  const nextWord = () => {
    if (index + 1 >= plan.words.length) setPhase('complete');
    else {
      setIndex((previous) => previous + 1);
      setResult(null);
      setResultSource('none');
      setPhase('idle');
      resolvedAttempt.current = false;
    }
  };

  const buddyState: BuddyState = phase === 'listening'
    ? 'listening'
    : phase === 'processing'
      ? 'checking'
      : phase === 'speaking'
        ? 'speaking'
        : result?.status === 'correct'
          ? 'cheering'
          : result?.status === 'missed'
            ? 'helping'
            : 'idle';

  const mockWords = useMemo(() => new Set(child?.wordLog.filter((attempt) => attempt.source === 'mock').map((attempt) => cleanWord(attempt.word)) ?? []), [child?.wordLog]);
  const usesMockHistory = plan.words.some((item) => mockWords.has(item));

  if (!child) return null;

  if (phase === 'complete') {
    const correct = attempts.filter((attempt) => attempt.status === 'correct' || attempt.status === 'helped').length;
    return (
      <View style={{ gap: 18 }}>
        <Txt v="display">Practice complete!</Txt>
        <KasukuBuddy state="cheering" line="Hongera! You kept trying." />
        <HardBox r={radius.lg} contentStyle={{ padding: 18, gap: 10 }}>
          <Txt v="title">You worked on {plan.focus}</Txt>
          <Txt>{correct} of {attempts.length} attempts ended with a word read correctly or with help.</Txt>
          <Btn label="Practise these words again" icon="rotate-ccw" variant="primary" block onPress={() => { setIndex(0); setAttempts([]); setResult(null); setPhase('idle'); resolvedAttempt.current = false; }} />
        </HardBox>
      </View>
    );
  }

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Txt v="display">Word practice</Txt>
        <Txt v="small">A short practice set based on {usesMockHistory ? 'recent demo results' : 'reading words'}.</Txt>
      </View>

      {usesMockHistory && <MockBanner text="This practice set includes words from mock reading results. They are not evidence of live pronunciation recognition." />}

      <HardBox r={radius.lg} bg={role.brand.soft} contentStyle={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Badge label={`SOUND FOCUS · ${plan.focus}`} bg={colors.white} icon="target" />
          <Txt v="small">{index + 1} of {plan.words.length}</Txt>
        </View>
        <ProgressBar value={index / Math.max(plan.words.length, 1)} />
        <KasukuBuddy state={buddyState} line={
          phase === 'listening' ? 'Nasikiliza… say the word out loud.'
            : phase === 'processing' ? 'Let me check that word…'
              : phase === 'speaking' ? 'Listen to me say it first.'
                : result?.status === 'correct' ? 'Hongera! You said it clearly.'
                  : result?.status === 'missed' ? 'That one was tricky. Let’s try it together.'
                    : 'We can practise this word together.'
        } />
      </HardBox>

      <HardBox r={radius.lg} contentStyle={{ padding: 20, gap: 16, alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.readingBold, fontSize: 44, lineHeight: 58, color: colors.text, textAlign: 'center' }}>{word}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {syllables.map((part, partIndex) => (
            <HardBox key={`${part}-${partIndex}`} bg={role.action.fill} r={radius.sm} off={2} contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontFamily: fonts.readingBold, fontSize: 22, color: colors.white }}>{part}</Text>
            </HardBox>
          ))}
        </View>
        {sounds.length > 0 && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Txt v="small">Listen for:</Txt>{sounds.map((sound) => <Badge key={sound} label={sound} bg={role.highlight.mid} />)}</View>}
        {result && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name={result.status === 'correct' ? 'check-circle' : result.status === 'helped' ? 'help-circle' : 'rotate-ccw'} size={19} color={result.status === 'correct' ? role.correct.fill : result.status === 'helped' ? role.helped.fill : role.missed.text} />
            <Txt v="bodyStrong">{result.status === 'correct' ? 'Correct' : result.status === 'helped' ? 'Got it with help' : 'Try again'}</Txt>
          </View>
        )}
      </HardBox>

      {liveSpeechAvailable ? (
        <Btn
          label={phase === 'starting' ? 'Starting microphone…' : phase === 'listening' ? 'Finish this try' : phase === 'processing' ? 'Checking…' : 'Say the word'}
          icon={phase === 'listening' ? 'square' : 'mic'}
          variant="primary"
          block
          disabled={phase === 'starting' || phase === 'processing' || phase === 'speaking' || phase === 'result'}
          onPress={phase === 'listening' ? stopAttempt : startAttempt}
        />
      ) : (
        <Btn label="Local speech recognition not connected" icon="mic-off" variant="ghost" block disabled />
      )}

      {!speechOutputAvailable && <Txt v="small" style={{ textAlign: 'center' }}>Kasuku’s local voice is not connected yet. The syllables are shown as a reading guide.</Txt>}

      {phase === 'result' && result?.status === 'missed' && (
        <View style={{ gap: 10 }}>
          <Btn label="Hear Kasuku say it" icon="volume-2" variant="ghost" block disabled={!speechOutputAvailable} onPress={hearWord} />
          <Btn label="Try this word again" icon="rotate-ccw" variant="primary" block onPress={retry} />
        </View>
      )}

      {phase === 'result' && passed && <Btn label={index + 1 === plan.words.length ? 'Finish practice' : 'Next word'} icon="arrow-right" variant="primary" block onPress={nextWord} />}

      <HardBox r={radius.md} off={3} contentStyle={{ padding: 14, gap: 10, borderStyle: 'dashed' }}>
        <Txt v="label">PREVIEW FEEDBACK · MOCK ONLY</Txt>
        <Txt v="small">These buttons preview the screen states. They do not use the microphone or check pronunciation.</Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn label="Preview correct" icon="check" variant="ghost" small disabled={phase === 'starting' || phase === 'listening' || phase === 'processing'} style={{ flex: 1 }} onPress={() => previewResult('correct')} />
          <Btn label="Preview needs help" icon="help-circle" variant="ghost" small disabled={phase === 'starting' || phase === 'listening' || phase === 'processing'} style={{ flex: 1 }} onPress={() => previewResult('missed')} />
        </View>
        {resultSource === 'mock' && <Txt v="small" style={{ color: colors.text }}>Preview result only — no speech was recognized.</Txt>}
      </HardBox>
    </View>
  );
};

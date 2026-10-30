import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, radius } from '../theme';
import { Avatar, Badge, Btn, HardBox, LevelPill, MockBanner, ProgressBar, Txt } from '../components/ui';
import { KasukuBuddy, BuddyState } from '../components/KasukuBuddy';
import { Legend, WordChip } from '../components/WordChip';
import { HelpSheet } from '../components/HelpSheet';
import { StoryCover } from '../components/StoryCover';
import { getStory, speechEngineAvailable, STUCK_MS, storyWords } from '../integration';
import { makeMockResults } from '../logic/mockResults';
import { useReadingSession } from '../logic/readingSession';
import { Celebration, ResultPanel } from './ReadingFinish';
import { useApp, type FinishedReading } from '../state/AppState';

type Stage = 'read' | 'celebrate' | 'result';

/** Full-screen reading flow (no tab bar): Reading → Help moment → Celebration → Result + next step. */
export const ReadingScreen = () => {
  const { child, storyId, closeStory, openStory, finishReading, showToast } = useApp();
  const story = getStory(storyId);
  const words = useMemo(() => storyWords(story), [story]);

  const [stage, setStage] = useState<Stage>('read');
  const [finished, setFinished] = useState<FinishedReading | null>(null);
  const [help, setHelp] = useState<{ index: number; word: string; auto: boolean } | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const saved = useRef(false);

  const session = useReadingSession(words, !!help, (i) => setHelp({ index: i, word: words[i], auto: true }));
  const { results, current, done, listening, source } = session;

  // Finished: save once, then celebrate.
  useEffect(() => {
    if (!done || saved.current || !child) return;
    saved.current = true;
    setHelp(null);
    const r = finishReading(child.id, story.id, results, source === 'none' ? 'manual' : source);
    setFinished(r);
    setStage(r ? 'celebrate' : 'read');
  }, [done, child, story.id, results, source, finishReading]);

  const byIndex = useMemo(() => new Map(results.map((r) => [r.index, r.status])), [results]);
  const buddy: BuddyState = help ? 'helping' : listening ? 'listening' : done ? 'cheering' : 'idle';

  const toggleMic = () => {
    if (listening) {
      session.stop();
      showToast(speechEngineAvailable ? 'Stopped listening.' : 'Stopped. No speech engine is connected, so no words were recognised.');
    } else {
      session.start();
    }
    // Person 1: when connected, record audio here, stop it on "Stop", call evaluateAudio(uri, story.text)
    // and pass the WordResult[] to session.applyAll(results, 'live').
  };

  const again = () => {
    saved.current = false;
    session.reset();
    setFinished(null);
    setHelp(null);
    setStage('read');
  };

  const topBar = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={() => closeStory()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
        <HardBox off={2} r={12} contentStyle={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </HardBox>
      </Pressable>
      <View style={{ flex: 1 }}>
        {child && <Txt v="small">{child.name} is reading</Txt>}
        <Txt v="title">{story.title}</Txt>
      </View>
      {child && <Avatar avatar={child.avatar} size={40} off={2} />}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 18 }} keyboardShouldPersistTaps="handled">
        {topBar}

        {stage === 'celebrate' && finished && (
          <Celebration name={child?.name ?? 'friend'} finished={finished} onContinue={() => setStage('result')} />
        )}

        {stage === 'result' && finished && (
          <ResultPanel
            finished={finished}
            onReadNext={(id) => openStory(id)}
            onTryAgain={again}
            onHome={() => closeStory('home')}
            onDrill={() => showToast('Drills are follow-on scope (P1) — not built in this demo.')}
          />
        )}

        {stage === 'read' && (
          <>
            <HardBox r={radius.lg} contentStyle={{ overflow: 'hidden' }}>
              <StoryCover storyId={story.id} height={110} />
            </HardBox>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <LevelPill level={story.level} />
              {story.soundTags.map((s) => <Badge key={s} label={s} bg={colors.white} />)}
            </View>

            <KasukuBuddy state={buddy} />

            <HardBox r={radius.lg} contentStyle={{ padding: 16, gap: 14 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {words.map((w, i) => (
                  <WordChip
                    key={`${story.id}-${i}`}
                    word={w}
                    state={byIndex.get(i) ?? 'pending'}
                    current={listening && i === current}
                    onPress={() => setHelp({ index: i, word: w, auto: false })}
                  />
                ))}
              </View>
              <ProgressBar value={results.length / Math.max(words.length, 1)} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Legend />
                <Txt v="small">{results.length} of {words.length} words</Txt>
              </View>
            </HardBox>

            <Btn
              label={listening ? 'Stop' : 'Start reading'}
              icon={listening ? 'square' : 'mic'}
              variant="primary"
              block
              onPress={toggleMic}
            />
            {listening && (
              <Txt v="small" style={{ textAlign: 'center' }}>
                If a word takes longer than {STUCK_MS / 1000} seconds, Kasuku will help.
              </Txt>
            )}
            {!speechEngineAvailable && (
              <MockBanner text="Speech engine not connected yet. The mic does not recognise speech in this build — move on with “I said it!” or the test controls below." />
            )}

            {/* mock-results control — clearly labelled, never shown as live recognition */}
            <HardBox r={radius.md} off={3} bg={colors.paper} contentStyle={{ padding: 14, gap: 10, borderStyle: 'dashed' }}>
              <Pressable
                onPress={() => setTestOpen((o) => !o)}
                accessibilityRole="button"
                accessibilityState={{ expanded: testOpen }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Badge label="MOCK RESULTS" bg={colors.white} icon="sliders" />
                <Txt v="small" style={{ flex: 1, color: colors.text }}>testing only</Txt>
                <Feather name={testOpen ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text} />
              </Pressable>
              {testOpen && (
                <View style={{ gap: 10 }}>
                  <Txt v="small" style={{ color: colors.text }}>
                    Applies pre-set results so the screens can be tested. This is not speech recognition, and it is saved as a test result.
                  </Txt>
                  <Btn label="Mock: read the next word" icon="skip-forward" variant="ghost" small block onPress={() => session.markNext('correct', 'mock')} />
                  <Btn label="Mock: needs ng’ practice (Child A)" icon="play" variant="ghost" small block onPress={() => session.applyAll(makeMockResults('needs-ng', story), 'mock')} />
                  <Btn label="Mock: reads accurately (Child B)" icon="play" variant="ghost" small block onPress={() => session.applyAll(makeMockResults('accurate', story), 'mock')} />
                  <Btn label="Reset" icon="rotate-ccw" variant="ghost" small block onPress={again} />
                </View>
              )}
            </HardBox>
          </>
        )}
      </ScrollView>

      <HelpSheet
        word={help?.word ?? null}
        line={help?.auto ? 'Taking a little while? Let’s look at this word together.' : undefined}
        onClose={() => setHelp(null)}
        onHelped={() => help && session.mark(help.index, 'helped', 'manual')}
        notify={showToast}
      />
    </SafeAreaView>
  );
};

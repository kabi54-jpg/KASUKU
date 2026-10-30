import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { colors, fonts, radius, role } from '../theme';
import { Badge, Btn, HardBox, MockBanner, StatCard, Txt } from '../components/ui';
import { KasukuBuddy } from '../components/KasukuBuddy';
import { getStory } from '../integration';
import type { FinishedReading } from '../state/AppState';
import type { ResultSource } from '../types';

export const sourceBanner = (source: ResultSource): string | null =>
  source === 'mock'
    ? 'MOCK DATA — these results came from the mock-results control, not from speech recognition.'
    : source === 'manual'
      ? 'Results come from tapping “I said it!” in the app, not from speech recognition.'
      : null;

const CONFETTI = ['🎉', '⭐', '🎊', '✨', '🌟', '🎈'];
const SPOTS = [
  { top: 8, left: '6%' }, { top: 40, left: '78%' }, { top: 90, left: '14%' },
  { top: 120, left: '86%' }, { top: 12, left: '46%' }, { top: 150, left: '48%' },
] as const;

const BigStars = ({ n }: { n: number }) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start();
  }, [scale]);
  return (
    <Animated.View style={{ flexDirection: 'row', gap: 8, transform: [{ scale }] }} accessibilityLabel={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Text key={i} style={{ fontSize: 58, color: i <= n ? role.reward.fill : colors.textMuted }}>{i <= n ? '★' : '☆'}</Text>
      ))}
    </Animated.View>
  );
};

/** Celebration: confetti, stars (1–3 by accuracy), Kasuku cheers. */
export const Celebration = ({ name, finished, onContinue }: { name: string; finished: FinishedReading; onContinue: () => void }) => {
  const { stars } = finished.summary;
  const message = stars === 3 ? `Hongera, ${name}!` : stars === 2 ? `Nzuri, ${name}!` : `Good try, ${name}!`;
  const sub = stars === 3 ? 'You read it so well!' : stars === 2 ? 'Keep going — you are getting better!' : 'Let’s keep practising together.';
  return (
    <View style={{ gap: 22 }}>
      <HardBox r={radius.lg} off={5} bg={role.correct.mid} contentStyle={{ paddingVertical: 28, paddingHorizontal: 16, alignItems: 'center', gap: 12, overflow: 'hidden' }}>
        {CONFETTI.map((c, i) => (
          <Text key={i} style={{ position: 'absolute', fontSize: 26, ...SPOTS[i] }}>{c}</Text>
        ))}
        <View style={{ height: 60 }} />
        <BigStars n={stars} />
        <Text style={{ fontFamily: fonts.display, fontSize: 32, color: colors.text, textAlign: 'center' }}>{message}</Text>
        <Txt style={{ textAlign: 'center' }}>{sub}</Txt>
      </HardBox>
      <KasukuBuddy state="cheering" />
      {sourceBanner(finished.child.lastSession?.source ?? 'none') && (
        <MockBanner text={sourceBanner(finished.child.lastSession?.source ?? 'none') as string} />
      )}
      <Btn label="Continue" icon="arrow-right" variant="primary" block onPress={onContinue} />
    </View>
  );
};

/** Result + next step: counts, then the recommended next activity with its plain-words reason. */
export const ResultPanel = ({
  finished, onReadNext, onTryAgain, onHome, onDrill,
}: {
  finished: FinishedReading;
  onReadNext: (storyId: string) => void;
  onTryAgain: () => void;
  onHome: () => void;
  onDrill: () => void;
}) => {
  const { summary, recommendation, child } = finished;
  const next = getStory(recommendation.storyId);
  const banner = sourceBanner(child.lastSession?.source ?? 'none');
  return (
    <View style={{ gap: 18 }}>
      {banner && <MockBanner text={banner} />}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StatCard k="Correct" v={`${summary.correct}`} accent={role.correct.fill} />
        <StatCard k="Helped" v={`${summary.helped}`} accent={role.helped.fill} />
        <StatCard k="Missed" v={`${summary.missed}`} accent={role.missed.fill} />
      </View>

      <HardBox r={radius.lg} contentStyle={{ padding: 16, gap: 12 }}>
        <Badge
          label={recommendation.kind === 'drill' ? 'NEXT: PRACTISE' : 'NEXT STORY'}
          color={colors.white}
          bg={role.action.fill}
          icon="arrow-right-circle"
        />
        <Txt v="title">{recommendation.title}</Txt>
        <Txt>{recommendation.reason}</Txt>
        {recommendation.kind === 'drill' && summary.wordsToPractise.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {summary.wordsToPractise.map((w) => (
              <HardBox key={w} off={2} r={radius.sm} bg={role.missed.soft} contentStyle={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontFamily: fonts.reading, fontSize: 18, color: colors.text }}>{w}</Text>
              </HardBox>
            ))}
          </View>
        )}
        {recommendation.kind === 'drill' && (
          <Btn label="Word drill (coming soon)" icon="target" variant="ghost" block onPress={onDrill} />
        )}
        <Btn label={`Read: ${next.title}`} icon="book-open" variant="primary" block onPress={() => onReadNext(next.id)} />
      </HardBox>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Btn label="Read again" icon="rotate-ccw" variant="ghost" style={{ flex: 1 }} onPress={onTryAgain} />
        <Btn label="Home" icon="home" variant="ghost" style={{ flex: 1 }} onPress={onHome} />
      </View>
    </View>
  );
};

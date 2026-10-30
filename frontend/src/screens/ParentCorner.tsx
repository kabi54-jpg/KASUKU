import React from 'react';
import { Alert, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, fonts, radius, role } from '../theme';
import { Btn, Divider, HardBox, MockBanner, Segmented, StatCard, Txt } from '../components/ui';
import { getRecommendation, STORIES } from '../integration';
import { summarise } from '../logic/mockResults';
import { weakSoundsFromLog, wordsToPractise } from '../logic/insights';
import { currentStreak } from '../data/avatars';
import { sourceBanner } from './ReadingFinish';
import { useApp } from '../state/AppState';

/** Parent Corner content (shown after the 3-second hold gate): overview, weak sounds, words, why-next, settings. */
export const ParentCorner = () => {
  const { child, updateChild, resetAll } = useApp();
  if (!child) return null;

  const last = child.lastSession;
  const sum = last ? summarise(last.results) : null;
  const weak = weakSoundsFromLog(child.wordLog);
  const words = wordsToPractise(child.wordLog);
  const rec = last ? getRecommendation(child, last.results) : null;
  const banner = last ? sourceBanner(last.source) : null;
  const streak = currentStreak(child);
  const read = Object.keys(child.progress).length;

  const confirmReset = () =>
    Alert.alert('Reset all data?', 'This removes every child, all progress and reading history from this phone.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetAll },
    ]);

  return (
    <View style={{ gap: 18 }}>
      <Txt v="small">Showing {child.name}’s reading</Txt>
      {banner && <MockBanner text={banner} />}

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard k="Accuracy" v={sum ? `${sum.accuracy}%` : '—'} sub={sum ? `${sum.correct} of ${sum.total} words (latest)` : 'No reading yet'} accent={role.correct.fill} />
          <StatCard k="Streak" v={`${streak} ${streak === 1 ? 'day' : 'days'}`} sub="in a row" accent={role.reward.fill} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard k="Stories read" v={`${read} of ${STORIES.length}`} sub="on this phone" />
          <StatCard k="Words per minute" v="—" sub="not measured yet" />
        </View>
      </View>

      <HardBox r={radius.md} contentStyle={{ padding: 16, gap: 10 }}>
        <Txt v="title">Weak sounds</Txt>
        {weak.length === 0 ? (
          <Txt v="small">No sound-level difficulties logged yet.</Txt>
        ) : (
          weak.map((w, i) => (
            <View key={w.sound}>
              {i > 0 && <Divider />}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <HardBox bg={role.highlight.mid} off={2} r={radius.sm} contentStyle={{ minWidth: 52, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' }}>
                  <Text style={{ fontFamily: fonts.readingBold, fontSize: 20, color: colors.text }}>{w.sound}</Text>
                </HardBox>
                <View style={{ flex: 1 }}>
                  <Txt v="bodyStrong">{w.count} time{w.count > 1 ? 's' : ''}</Txt>
                  <Txt v="small">e.g. {w.examples.join(', ')}</Txt>
                </View>
              </View>
            </View>
          ))
        )}
      </HardBox>

      <HardBox r={radius.md} contentStyle={{ padding: 16, gap: 10 }}>
        <Txt v="title">Words to practise</Txt>
        {words.length === 0 ? (
          <Txt v="small">None yet — words that were missed or needed help will appear here.</Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {words.map((w) => (
              <HardBox key={w} off={2} r={radius.sm} contentStyle={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontFamily: fonts.reading, fontSize: 18, color: colors.text }}>{w}</Text>
              </HardBox>
            ))}
          </View>
        )}
      </HardBox>

      <HardBox r={radius.md} bg={role.brand.soft} contentStyle={{ padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Feather name="help-circle" size={18} color={role.action.fill} />
          <Txt v="title">Why this next?</Txt>
        </View>
        <Txt>{rec ? rec.reason : 'Available after the first finished story.'}</Txt>
        <Txt v="small" style={{ color: colors.text }}>Explained from simple rules on this device. It is not written by an AI model.</Txt>
      </HardBox>

      <HardBox r={radius.md} contentStyle={{ padding: 16, gap: 12 }}>
        <Txt v="title">Settings</Txt>
        <Txt v="label">Daily goal for {child.name}</Txt>
        <Segmented
          value={String(child.dailyGoal)}
          onChange={(k) => updateChild(child.id, { dailyGoal: Number(k) as 1 | 2 | 3 })}
          options={[{ key: '1', label: '1 story' }, { key: '2', label: '2 stories' }, { key: '3', label: '3 stories' }]}
        />
        <Txt v="small">Story language: Kiswahili</Txt>
        <Btn label="Reset all data" icon="trash-2" variant="danger" small onPress={confirmReset} style={{ alignSelf: 'flex-start' }} />
      </HardBox>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4 }}>
        <Feather name="shield" size={14} color={colors.textMuted} style={{ marginTop: 3 }} />
        <Txt v="small" style={{ flex: 1 }}>Privacy: audio recordings are not stored. Only word results are kept, on this phone.</Txt>
      </View>
    </View>
  );
};

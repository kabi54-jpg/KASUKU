import React from 'react';
import { Text, View } from 'react-native';
import { colors, fonts, radius, role } from '../theme';
import { Avatar, Badge, Btn, HardBox, LevelPill, ProgressBar, Txt } from '../components/ui';
import { GoalRing } from '../components/GoalRing';
import { StoryCard } from '../components/StoryCard';
import { StoryCover } from '../components/StoryCover';
import { STORIES } from '../integration';
import { todaysPick } from '../logic/insights';
import { currentStreak, storiesReadToday } from '../data/avatars';
import { useApp } from '../state/AppState';

/** Home — reader profile (hello, progress, streak, goal) → Today's pick → a few more stories. */
export const HomeScreen = () => {
  const { child, family, go, setTab, openStory } = useApp();
  if (!child) return null;

  const read = Object.keys(child.progress).length;
  const total = STORIES.length;
  const streak = currentStreak(child);
  const today = storiesReadToday(child);
  const multi = (family?.children.length ?? 0) > 1;
  const hasTest = Object.values(child.progress).some((p) => p.source !== 'live');
  const pick = todaysPick(child);
  const more = STORIES.filter((s) => s.id !== pick.story.id).slice(0, 3);

  return (
    <View style={{ gap: 22 }}>
      {/* profile header */}
      <HardBox r={radius.lg} off={5} bg={role.brand.soft} contentStyle={{ padding: 16, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar avatar={child.avatar} size={68} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 33, color: colors.text }}>Hello, {child.name}! 👋</Text>
            <Txt v="small" style={{ color: colors.text }}>Grade {child.grade} · Ready for a story?</Txt>
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt v="label">Reading progress</Txt>
            <Txt v="label">{read} of {total} stories</Txt>
          </View>
          <ProgressBar value={read / total} />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <HardBox style={{ flex: 1 }} off={2} r={radius.md} bg={role.reward.mid} contentStyle={{ padding: 12, gap: 2, flex: 1 }}>
            <Text style={{ fontSize: 22 }}>🔥</Text>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 20, color: colors.text }}>{streak} {streak === 1 ? 'day' : 'days'}</Text>
            <Txt v="small" style={{ color: colors.text }}>Reading streak</Txt>
          </HardBox>
          <HardBox style={{ flex: 1 }} off={2} r={radius.md} bg={colors.paper} contentStyle={{ padding: 12, gap: 4, alignItems: 'center', flex: 1 }}>
            <GoalRing done={today} goal={child.dailyGoal} size={72} />
            <Txt v="small" style={{ color: colors.text }}>Today’s goal</Txt>
          </HardBox>
        </View>

        {hasTest && <Txt v="small" style={{ color: colors.text }}>Progress may include test (mock) results.</Txt>}
        {multi && <Btn label="Switch reader" icon="repeat" variant="ghost" small block onPress={() => go('who')} />}
      </HardBox>

      {/* today's pick */}
      <View style={{ gap: 12 }}>
        <Txt v="title">Today’s pick</Txt>
        <HardBox r={radius.lg} off={5} bg={colors.paper} contentStyle={{ overflow: 'hidden' }}>
          <View style={{ borderBottomWidth: 2, borderBottomColor: colors.edge }}>
            <StoryCover storyId={pick.story.id} height={170} />
          </View>
          <View style={{ padding: 14, gap: 10 }}>
            <Badge label={pick.recommended ? 'Picked for you' : 'Start here'} icon="star" bg={role.highlight.mid} />
            <Txt v="title">{pick.story.title}</Txt>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <LevelPill level={pick.story.level} />
              {pick.story.soundTags.slice(0, 3).map((s) => <Badge key={s} label={s} bg={colors.white} />)}
            </View>
            <Txt>{pick.reason}</Txt>
            <Btn label="Soma!" icon="book-open" variant="primary" block onPress={() => openStory(pick.story.id)} />
          </View>
        </HardBox>
      </View>

      {/* more stories */}
      <View style={{ gap: 14 }}>
        <Txt v="title">More stories</Txt>
        {more.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
        <Btn label="See all stories" icon="arrow-right" variant="ghost" block onPress={() => setTab('stories')} />
      </View>
    </View>
  );
};

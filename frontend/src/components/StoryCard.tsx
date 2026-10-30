import React from 'react';
import { Text, View } from 'react-native';
import { colors, radius, role } from '../theme';
import { Badge, Btn, HardBox, LevelPill, Txt } from './ui';
import { StoryCover } from './StoryCover';
import { useApp } from '../state/AppState';
import type { Story } from '../types';

export const Stars = ({ n, size = 16 }: { n: number; size?: number }) => (
  <Text accessibilityLabel={`${n} of 3 stars`} style={{ fontSize: size, letterSpacing: 1, color: role.reward.fill }}>
    {'★'.repeat(n)}
    <Text style={{ color: colors.textMuted }}>{'☆'.repeat(3 - n)}</Text>
  </Text>
);

/** Story card: cover image, level pill, sound tags and a Read button that opens THIS story. */
export const StoryCard = ({ story, recommended }: { story: Story; recommended?: boolean }) => {
  const { child, openStory } = useApp();
  const p = child?.progress[story.id];
  return (
    <HardBox r={radius.lg} contentStyle={{ overflow: 'hidden' }}>
      <View style={{ borderBottomWidth: 2, borderBottomColor: colors.edge }}>
        <StoryCover storyId={story.id} />
      </View>
      <View style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <Txt v="title" style={{ flex: 1 }}>{story.title}</Txt>
          {p ? <Stars n={p.bestStars} /> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <LevelPill level={story.level} />
          {story.soundTags.slice(0, 3).map((s) => (
            <Badge key={s} label={s} bg={colors.white} />
          ))}
          {recommended && <Badge label="Recommended" icon="star" bg={role.highlight.mid} />}
        </View>
        <Btn label="Read" icon="book-open" variant="primary" block onPress={() => openStory(story.id)} />
      </View>
    </HardBox>
  );
};

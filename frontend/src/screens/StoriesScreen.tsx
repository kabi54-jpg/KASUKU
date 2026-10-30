import React from 'react';
import { View } from 'react-native';
import { StoryCard } from '../components/StoryCard';
import { Txt } from '../components/ui';
import { STORIES } from '../integration';
import { todaysPick } from '../logic/insights';
import { useApp } from '../state/AppState';

/** Story shelf — every bundled story with cover, level pill, sound tags and a recommended marker. */
export const StoriesScreen = () => {
  const { child } = useApp();
  const pickId = child ? todaysPick(child).story.id : null;
  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Txt v="display">Stories</Txt>
        <Txt v="small">{STORIES.length} stories saved on this phone — they open without internet.</Txt>
      </View>
      {STORIES.map((s) => (
        <StoryCard key={s.id} story={s} recommended={s.id === pickId} />
      ))}
    </View>
  );
};

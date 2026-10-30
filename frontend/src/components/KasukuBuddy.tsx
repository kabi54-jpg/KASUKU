import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageSourcePropType, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { HardBox } from './ui';

export type BuddyState = 'idle' | 'listening' | 'checking' | 'cheering' | 'helping' | 'speaking';

/** Kasuku's four exported states, supplied in the shared design assets. */
const BUDDY_IMAGES: Record<BuddyState, ImageSourcePropType> = {
  idle: require('../../assets/kasuku/kasuku-idle.png'),
  listening: require('../../assets/kasuku/kasuku-listening.png'),
  checking: require('../../assets/kasuku/kasuku-listening.png'),
  cheering: require('../../assets/kasuku/kasuku-cheering.png'),
  helping: require('../../assets/kasuku/kasuku-helping.png'),
  speaking: require('../../assets/kasuku/kasuku-listening.png'),
};

const META: Record<BuddyState, { line: string }> = {
  idle: { line: 'Soma nami! Tap the mic and read aloud.' },
  listening: { line: 'Nasikiliza… I am listening.' },
  checking: { line: 'Let me check that word…' },
  cheering: { line: 'Hongera! Great reading!' },
  helping: { line: 'Let’s look at this word together.' },
  speaking: { line: 'Listen to me say it first.' },
};

export const KasukuBuddy = ({ state, line, size = 88 }: { state: BuddyState; line?: string; size?: number }) => {
  const m = META[state];
  const img = BUDDY_IMAGES[state];
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const motion = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -3, duration: state === 'listening' || state === 'speaking' ? 500 : 850, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: state === 'listening' || state === 'speaking' ? 500 : 850, useNativeDriver: true }),
      ]),
    );
    motion.start();
    return () => motion.stop();
  }, [bob, state]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Animated.Image source={img} resizeMode="contain" style={{ width: size, height: size, transform: [{ translateY: bob }] }} />
      <HardBox style={{ flex: 1 }} r={radius.md} off={2} contentStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.text }}>{line ?? m.line}</Text>
      </HardBox>
    </View>
  );
};

import React from 'react';
import { Image, ImageSourcePropType, Text, View } from 'react-native';
import { colors, fonts, radius, role } from '../theme';
import { HardBox } from './ui';

export type BuddyState = 'idle' | 'listening' | 'cheering' | 'helping';

/**
 * Person 4 delivers the Kasuku the Parrot PNGs. Drop them in assets/kasuku/ and
 * register them here, e.g.  listening: require('../../assets/kasuku/listening.png').
 * Until then a labelled placeholder (🦜) is drawn so the three required states are testable.
 */
const BUDDY_IMAGES: Partial<Record<BuddyState, ImageSourcePropType>> = {};

const META: Record<BuddyState, { bg: string; line: string }> = {
  idle: { bg: role.brand.soft, line: 'Soma nami! Tap the mic and read aloud.' },
  listening: { bg: role.brand.mid, line: 'Nasikiliza… I am listening.' },
  cheering: { bg: role.correct.mid, line: 'Hongera! Great reading!' },
  helping: { bg: role.helped.mid, line: 'Let’s look at this word together.' },
};

export const KasukuBuddy = ({ state, line, size = 64 }: { state: BuddyState; line?: string; size?: number }) => {
  const m = META[state];
  const img = BUDDY_IMAGES[state];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <HardBox bg={m.bg} r={size / 2} off={3} contentStyle={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {img ? <Image source={img} style={{ width: size - 8, height: size - 8 }} resizeMode="contain" /> : <Text style={{ fontSize: size * 0.5 }}>🦜</Text>}
      </HardBox>
      <HardBox style={{ flex: 1 }} r={radius.md} off={2} contentStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.text }}>{line ?? m.line}</Text>
      </HardBox>
    </View>
  );
};

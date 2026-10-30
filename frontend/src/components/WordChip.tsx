import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, fonts, radius, role } from '../theme';
import { HardBox } from './ui';
import type { WordStatus } from '../types';

export type ChipState = WordStatus | 'pending';

/**
 * Reading Canvas word chip.
 *  pending -> plain card · correct -> solid green · missed -> soft cinnabar underline · helped -> orange tint
 * Chip states map 1:1 to WordResult.status from Person 1 (plus "pending" = not read yet).
 * All chip text is navy (≥4.6:1 on every chip colour).
 */
export const WordChip = ({
  word, state, onPress, current,
}: { word: string; state: ChipState; onPress: () => void; current?: boolean }) => {
  const [down, setDown] = useState(false);

  const bg =
    state === 'correct' ? role.correct.fill : state === 'helped' ? role.helped.mid : colors.paper;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      accessibilityRole="button"
      accessibilityLabel={`${word}, ${state === 'pending' ? 'not read yet' : state}. Tap for help.`}
    >
      <HardBox
        bg={current ? role.brand.mid : bg}
        r={radius.sm}
        off={current ? 4 : 2}
        pressed={down}
        contentStyle={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10 }}
      >
        <Text style={{ fontFamily: fonts.reading, fontSize: 24, lineHeight: 32, color: colors.text }}>{word}</Text>
        {state === 'missed' && (
          <View
            style={{
              position: 'absolute', left: 10, right: 10, bottom: 5, height: 4, borderRadius: 2,
              backgroundColor: role.missed.fill,
            }}
          />
        )}
      </HardBox>
    </Pressable>
  );
};

export const Legend = () => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
    {[
      { c: role.correct.fill, t: 'Correct', style: 'fill' as const },
      { c: role.missed.fill, t: 'Missed', style: 'line' as const },
      { c: role.helped.fill, t: 'Helped', style: 'tint' as const },
    ].map((l) => (
      <View key={l.t} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View
          style={{
            width: 20, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: colors.edge,
            backgroundColor: l.style === 'fill' ? l.c : l.style === 'tint' ? role.helped.mid : colors.paper,
            justifyContent: 'flex-end', alignItems: 'center',
          }}
        >
          {l.style === 'line' && <View style={{ width: 13, height: 3, marginBottom: 1, borderRadius: 2, backgroundColor: l.c }} />}
        </View>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text }}>{l.t}</Text>
      </View>
    ))}
  </View>
);

import React, { useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radius, role } from '../theme';
import { HardBox, Txt } from './ui';

/** Parent Corner gate: press and hold for 3 seconds. */
export const HoldGate = ({
  onUnlock, seconds = 3, title = 'Parent Corner', blurb,
}: { onUnlock: () => void; seconds?: number; title?: string; blurb?: string }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const [holding, setHolding] = useState(false);

  const start = () => {
    setHolding(true);
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: seconds * 1000, easing: Easing.linear, useNativeDriver: false }).start(
      ({ finished }) => {
        if (finished) {
          setHolding(false);
          onUnlock();
        }
      },
    );
  };
  const stop = () => {
    setHolding(false);
    progress.stopAnimation();
    Animated.timing(progress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  return (
    <View style={{ gap: 16 }}>
      <HardBox bg={colors.paper} r={radius.lg} contentStyle={{ padding: 22, alignItems: 'center', gap: 10 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: role.brand.mid, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.edge }}>
          <Feather name="lock" size={26} color={colors.text} />
        </View>
        <Txt v="title" style={{ textAlign: 'center' }}>{title}</Txt>
        <Txt v="small" style={{ textAlign: 'center' }}>
          {blurb ?? `Grown-ups only. Press and hold the button for ${seconds} seconds to open.`}
        </Txt>
      </HardBox>

      <Pressable
        onPressIn={start}
        onPressOut={stop}
        accessibilityRole="button"
        accessibilityLabel={`Press and hold for ${seconds} seconds to open the ${title}`}
      >
        <HardBox bg={colors.paper} r={radius.sm} pressed={holding} contentStyle={{ height: 56, justifyContent: 'center', overflow: 'hidden' }}>
          <Animated.View
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: role.brand.mid,
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }}
          />
          <Text style={{ textAlign: 'center', fontFamily: fonts.bodySemi, fontSize: 16, color: colors.text }}>
            {holding ? 'Keep holding…' : 'Hold to open'}
          </Text>
        </HardBox>
      </Pressable>
    </View>
  );
};

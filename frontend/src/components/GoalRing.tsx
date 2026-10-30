import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, role } from '../theme';

/** Daily goal ring: done / goal stories today. Navy numbers, green progress arc. */
export const GoalRing = ({ done, goal, size = 84 }: { done: number; goal: number; size?: number }) => {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, goal ? done / goal : 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Today's goal: ${Math.min(done, goal)} of ${goal} stories`}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={stroke} fill={colors.white} />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={frac >= 1 ? role.correct.fill : role.brand.fill} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={`${c * frac} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: size * 0.24, color: colors.text }}>
        {Math.min(done, goal)}/{goal}
      </Text>
    </View>
  );
};

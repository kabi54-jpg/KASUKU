import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { border, colors, fonts, radius, role } from '../theme';
import { HardBox } from './ui';
import type { TabKey } from '../types';

const TABS: { key: TabKey; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'stories', label: 'Stories', icon: 'book-open' },
  { key: 'family', label: 'Family', icon: 'users' },
];

/** Bottom tab bar — brown edge + hard shadow on the active tab. */
export const BottomNav = ({ value, onChange }: { value: TabKey; onChange: (k: TabKey) => void }) => {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: colors.paper, borderTopWidth: border, borderTopColor: colors.edge,
        paddingHorizontal: 12, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), flexDirection: 'row', gap: 10,
      }}
    >
      {TABS.map((t) => {
        const on = t.key === value;
        return (
          <Pressable
            key={t.key}
            style={{ flex: 1 }}
            onPress={() => onChange(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
          >
            <HardBox
              flat={!on}
              off={2}
              r={radius.sm}
              bg={on ? role.brand.soft : 'transparent'}
              contentStyle={{
                minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 2,
                borderColor: on ? colors.edge : 'transparent',
              }}
            >
              <Feather name={t.icon} size={22} color={on ? role.action.fill : colors.text} />
              <Text style={{ fontFamily: on ? fonts.bodySemi : fonts.bodyMedium, fontSize: 12, color: colors.text }}>{t.label}</Text>
            </HardBox>
          </Pressable>
        );
      })}
    </View>
  );
};

export const Toast = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: 104, alignItems: 'center' }}>
      <View
        style={{
          backgroundColor: colors.text, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 12,
          shadowColor: colors.edge, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
        }}
      >
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white, textAlign: 'center' }}>{message}</Text>
      </View>
    </View>
  );
};

import React from 'react';
import { Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, fonts, radius, role } from '../theme';
import { AuthPage } from '../components/AuthPage';
import { Btn, HardBox, LinkBtn, Txt } from '../components/ui';
import { useApp } from '../state/AppState';

const Feature = ({ icon, text, bg }: { icon: React.ComponentProps<typeof Feather>['name']; text: string; bg: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: bg, borderWidth: 2, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={icon} size={18} color={colors.text} />
    </View>
    <Txt style={{ flex: 1 }}>{text}</Txt>
  </View>
);

/** Splash / first launch — Kasuku says hello. No account needed. */
export const WelcomeScreen = () => {
  const { startFresh, startDemo } = useApp();
  return (
    <AuthPage>
      <HardBox r={radius.lg} off={5} bg={role.brand.soft} contentStyle={{ padding: 24, alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', top: -30, left: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: role.reward.mid }} />
        <View style={{ position: 'absolute', bottom: -34, right: -24, width: 120, height: 120, borderRadius: 60, backgroundColor: role.highlight.mid }} />
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 64 }}>🦜</Text>
        </View>
        <Text style={{ fontFamily: fonts.display, fontSize: 38, color: colors.text }}>Soma Nami</Text>
        <Txt style={{ textAlign: 'center' }}>Read aloud with Kasuku the parrot</Txt>
      </HardBox>

      <View style={{ gap: 14 }}>
        <Feature icon="mic" bg={role.brand.mid} text="Read out loud and see every word light up" />
        <Feature icon="book-open" bg={role.brand.mid} text="Short Kiswahili stories at the right level" />
        <Feature icon="users" bg={role.brand.mid} text="Add all your children in one place" />
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: 14 }}>
        <Btn label="Get started" icon="arrow-right" block onPress={startFresh} />
        <View style={{ alignItems: 'center' }}>
          <LinkBtn label="Try the demo family" onPress={startDemo} />
          <Txt v="small" style={{ textAlign: 'center' }}>Two ready-made children for testing. Nothing to type.</Txt>
        </View>
      </View>
    </AuthPage>
  );
};

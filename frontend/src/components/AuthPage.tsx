import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, role } from '../theme';
import { HardBox, Txt } from './ui';

/** Full-screen page for the account / set-up flow (no tab bar). */
export const AuthPage = ({
  children, onBack, step,
}: { children: React.ReactNode; onBack?: () => void; step?: { current: number; total: number } }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
    <StatusBar style="dark" />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {(onBack || step) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {onBack ? (
              <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
                <HardBox off={2} r={12} contentStyle={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="arrow-left" size={22} color={colors.text} />
                </HardBox>
              </Pressable>
            ) : (
              <View style={{ width: 44 }} />
            )}
            {step && (
              <View style={{ flex: 1, gap: 6 }}>
                <Txt v="small">Step {step.current} of {step.total}</Txt>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {Array.from({ length: step.total }).map((_, i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.edge,
                        backgroundColor: i < step.current ? role.brand.fill : colors.white,
                      }}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

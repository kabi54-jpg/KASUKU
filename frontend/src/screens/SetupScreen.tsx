import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { colors, fonts, radius, role } from '../theme';
import { AuthPage } from '../components/AuthPage';
import { ChildForm } from '../components/ChildForm';
import { Avatar, Btn, HardBox, Txt } from '../components/ui';
import { KasukuBuddy } from '../components/KasukuBuddy';
import { useApp } from '../state/AppState';

const GOALS: { n: 1 | 2 | 3; title: string; sub: string; bg: string }[] = [
  { n: 1, title: '1 story a day', sub: 'A gentle start', bg: role.brand.mid },
  { n: 2, title: '2 stories a day', sub: 'Keep the streak going', bg: role.brand.mid },
  { n: 3, title: '3 stories a day', sub: 'Reading champion', bg: role.brand.mid },
];

/** First-run set-up: first child → daily goal → microphone + "works offline" → done. */
export const SetupScreen = () => {
  const { family, go, addChild, updateChild, selectChild } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState('');
  const [goal, setGoal] = useState<1 | 2 | 3>(1);
  const [mic, setMic] = useState<'idle' | 'granted' | 'denied'>('idle');

  const askMic = async () => {
    try {
      const r = await requestRecordingPermissionsAsync();
      setMic(r.granted ? 'granted' : 'denied');
    } catch {
      setMic('denied');
    }
  };

  const finish = () => {
    if (childId) selectChild(childId);
  };

  const onBack = step === 1 ? () => go('welcome') : () => setStep((s) => (s - 1) as 1 | 2 | 3);

  return (
    <AuthPage step={{ current: step, total: 3 }} onBack={onBack}>
      {step === 1 && (
        <>
          <View style={{ gap: 6 }}>
            <Txt v="display">Let’s set up your reader 👋</Txt>
            <Txt>Tell us about your first child. You can add more children later, all in this one family.</Txt>
          </View>
          <ChildForm
            submitLabel="Next"
            onSubmit={(v) => {
              if (childId) updateChild(childId, { name: v.name, avatar: v.avatar, grade: v.grade });
              else setChildId(addChild(v).id);
              setChildName(v.name);
              setStep(2);
            }}
          />
        </>
      )}

      {step === 2 && (
        <>
          <View style={{ gap: 6 }}>
            <Txt v="display">Pick a daily goal</Txt>
            <Txt>How many stories should {childName || 'your child'} try to read each day? You can change this later.</Txt>
          </View>
          <View style={{ gap: 14 }}>
            {GOALS.map((g) => {
              const on = goal === g.n;
              return (
                <Pressable key={g.n} onPress={() => setGoal(g.n)} accessibilityRole="radio" accessibilityState={{ selected: on }}>
                  <HardBox r={radius.md} off={on ? 5 : 2} bg={on ? role.brand.soft : colors.paper} contentStyle={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: g.bg, borderWidth: 2, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.text }}>{g.n}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt v="bodyStrong">{g.title}</Txt>
                      <Txt v="small">{g.sub}</Txt>
                    </View>
                    <Feather name={on ? 'check-circle' : 'circle'} size={24} color={on ? colors.text : colors.textMuted} />
                  </HardBox>
                </Pressable>
              );
            })}
          </View>
          <Btn
            label="Next"
            icon="arrow-right"
            block
            onPress={() => {
              if (childId) updateChild(childId, { dailyGoal: goal });
              setStep(3);
            }}
          />
        </>
      )}

      {step === 3 && (
        <>
          <View style={{ gap: 6 }}>
            <Txt v="display">Let Kasuku listen</Txt>
            <Txt>To hear {childName || 'your child'} read aloud, Soma Nami needs to use the microphone.</Txt>
          </View>
          <KasukuBuddy state="listening" line="I only listen while you read. Then I stop." />
          <HardBox r={radius.md} contentStyle={{ padding: 16, gap: 12 }}>
            {[
              { i: 'wifi-off' as const, t: 'Built to work offline: the stories and reading progress stay on this phone.' },
              { i: 'mic' as const, t: 'The microphone is used only on the reading screen.' },
              { i: 'trash-2' as const, t: 'Audio recordings are not stored.' },
              { i: 'settings' as const, t: 'You can change this any time in your phone settings.' },
            ].map((r) => (
              <View key={r.t} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Feather name={r.i} size={18} color={role.action.fill} />
                <Txt style={{ flex: 1 }}>{r.t}</Txt>
              </View>
            ))}
          </HardBox>

          {mic === 'granted' && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Feather name="check-circle" size={20} color={colors.text} />
              <Txt v="bodyStrong">Microphone is ready.</Txt>
            </View>
          )}
          {mic === 'denied' && (
            <Txt v="small" style={{ color: role.missed.text }}>
              Microphone access wasn’t allowed. You can still look around, and turn it on later in your phone’s settings.
            </Txt>
          )}

          <View style={{ gap: 12 }}>
            {mic !== 'granted' && <Btn label="Allow microphone" icon="mic" variant="primary" block onPress={askMic} />}
            <Btn label={mic === 'granted' ? 'Start reading' : 'Maybe later — start reading'} icon="arrow-right" variant={mic === 'granted' ? 'primary' : 'ghost'} block onPress={finish} />
          </View>
          {childId && (
            <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Avatar avatar={family?.children.find((c) => c.id === childId)?.avatar ?? 'lion'} size={32} off={2} />
              <Txt v="small">Reading as {childName}</Txt>
            </View>
          )}
        </>
      )}
    </AuthPage>
  );
};

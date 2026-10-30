import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { colors, radius, role } from '../theme';
import { AuthPage } from '../components/AuthPage';
import { ChildForm } from '../components/ChildForm';
import { Avatar, Badge, HardBox, Txt } from '../components/ui';
import { currentStreak } from '../data/avatars';
import { useApp } from '../state/AppState';

/** "Who's reading?" — shown at launch when the family has more than one child. */
export const WhoScreen = () => {
  const { family, selectChild, startAddChild } = useApp();
  const kids = family?.children ?? [];
  return (
    <AuthPage>
      <View style={{ gap: 6 }}>
        <Txt v="display">Who’s reading?</Txt>
        <Txt>Tap your picture to start.</Txt>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {kids.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => selectChild(c.id)}
            style={{ width: '47%' }}
            accessibilityRole="button"
            accessibilityLabel={`${c.name}, grade ${c.grade}`}
          >
            <HardBox r={radius.lg} contentStyle={{ padding: 16, alignItems: 'center', gap: 10 }}>
              <Avatar avatar={c.avatar} size={80} />
              <Txt v="title">{c.name}</Txt>
              <Badge label={`${currentStreak(c)} day streak`} icon="zap" bg={role.reward.mid} />
            </HardBox>
          </Pressable>
        ))}

        <Pressable onPress={() => startAddChild('who')} style={{ width: '47%' }} accessibilityRole="button" accessibilityLabel="Add a child">
          <HardBox r={radius.lg} bg={role.brand.soft} contentStyle={{ padding: 16, alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 190, borderStyle: 'dashed' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="plus" size={30} color={role.action.fill} />
            </View>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: colors.text }}>Add a child</Text>
          </HardBox>
        </Pressable>
      </View>
    </AuthPage>
  );
};

/** Add another child to the family. */
export const AddChildScreen = () => {
  const { go, addChild, addChildReturn, showToast } = useApp();
  return (
    <AuthPage onBack={() => go(addChildReturn)}>
      <View style={{ gap: 6 }}>
        <Txt v="display">Add a child</Txt>
        <Txt>They’ll get their own streak, progress and results in your family.</Txt>
      </View>
      <ChildForm
        submitLabel="Add child"
        onSubmit={(v) => {
          const c = addChild(v);
          showToast(`${c.name} was added.`);
          go(addChildReturn);
        }}
      />
    </AuthPage>
  );
};

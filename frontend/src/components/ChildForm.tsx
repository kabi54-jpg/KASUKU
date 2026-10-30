import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, role } from '../theme';
import { AVATARS } from '../data/avatars';
import { Avatar, Btn, Field, Segmented, Txt } from './ui';
import type { AvatarKey } from '../types';

export interface ChildFormValue {
  name: string;
  avatar: AvatarKey;
  grade: 1 | 2 | 3;
}

/** Name + animal avatar + grade. Used by the set-up flow and by "Add a child". */
export const ChildForm = ({
  submitLabel, onSubmit, secondary,
}: {
  submitLabel: string;
  onSubmit: (v: ChildFormValue) => void;
  secondary?: React.ReactNode;
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarKey>('lion');
  const [grade, setGrade] = useState<'1' | '2' | '3'>('1');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const n = name.trim();
    if (!n) return setError('Please type your child’s first name.');
    if (n.length > 20) return setError('That name is a little long — please use 20 letters or fewer.');
    setError(null);
    onSubmit({ name: n, avatar, grade: Number(grade) as 1 | 2 | 3 });
  };

  return (
    <View style={{ gap: 20 }}>
      <Field
        label="Child’s first name"
        value={name}
        onChangeText={(t) => { setName(t); if (error) setError(null); }}
        placeholder="e.g. Amani"
        icon="smile"
        autoCapitalize="words"
        maxLength={24}
        error={error}
        returnKeyType="done"
        onSubmitEditing={submit}
      />

      <View style={{ gap: 10 }}>
        <Txt v="label">Pick a reading buddy</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between' }}>
          {AVATARS.map((a) => {
            const on = a.key === avatar;
            return (
              <Pressable
                key={a.key}
                onPress={() => setAvatar(a.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={a.key}
                style={{ width: '21%', alignItems: 'center' }}
              >
                <View style={on ? { transform: [{ scale: 1.1 }] } : { opacity: 0.85 }}>
                  <Avatar avatar={a.key} size={60} off={on ? 4 : 2} />
                  {on && (
                    <View
                      style={{
                        position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12,
                        backgroundColor: role.action.fill, borderWidth: 2, borderColor: colors.edge,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Feather name="check" size={14} color={role.action.onFill} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Txt v="label">Reading grade</Txt>
        <Segmented
          value={grade}
          onChange={setGrade}
          options={[
            { key: '1', label: 'Grade 1' },
            { key: '2', label: 'Grade 2' },
            { key: '3', label: 'Grade 3' },
          ]}
        />
      </View>

      <View style={{ gap: 12 }}>
        <Btn label={submitLabel} icon="arrow-right" block onPress={submit} />
        {secondary}
      </View>
    </View>
  );
};

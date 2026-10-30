import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { colors, radius, role } from '../theme';
import { Avatar, Badge, Btn, HardBox, Segmented, Txt } from '../components/ui';
import { HoldGate } from '../components/HoldGate';
import { ParentCorner } from './ParentCorner';
import { STORIES } from '../integration';
import { currentStreak } from '../data/avatars';
import { useApp } from '../state/AppState';

type Mode = 'children' | 'corner';

/** Family tab (grown-ups only, behind the 3-second hold gate): children + Parent Corner. */
export const FamilyScreen = () => {
  const { family, child, parentUnlocked, unlockParent, selectChild, removeChild, startAddChild } = useApp();
  const [mode, setMode] = useState<Mode>('children');

  if (!parentUnlocked) {
    return (
      <View style={{ gap: 18 }}>
        <Txt v="display">Family</Txt>
        <HoldGate onUnlock={unlockParent} title="Parent Corner" blurb="Manage your children and see how they are reading. Press and hold the button for 3 seconds." />
      </View>
    );
  }
  if (!family) return null;

  const confirmRemove = (id: string, name: string) =>
    Alert.alert(`Remove ${name}?`, `${name}’s profile and reading progress will be deleted from this phone.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeChild(id) },
    ]);

  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Txt v="display">Family</Txt>
        {family.demo && <Badge label="Demo family" bg={role.brand.soft} />}
      </View>

      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { key: 'children', label: 'Children', icon: 'users' },
          { key: 'corner', label: 'Reading report', icon: 'bar-chart-2' },
        ]}
      />

      {mode === 'corner' ? (
        <ParentCorner />
      ) : (
        <View style={{ gap: 14 }}>
          <Txt v="title">Your children ({family.children.length})</Txt>
          {family.children.map((c) => {
            const active = c.id === child?.id;
            const read = Object.keys(c.progress).length;
            return (
              <HardBox key={c.id} r={radius.lg} bg={active ? role.brand.soft : colors.paper} contentStyle={{ padding: 14, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Avatar avatar={c.avatar} size={60} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Txt v="title">{c.name}</Txt>
                      {active && <Badge label="Reading now" bg={role.brand.mid} icon="check" />}
                    </View>
                    <Txt v="small">Grade {c.grade} · {read} of {STORIES.length} stories · {currentStreak(c)} day streak</Txt>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Btn label={active ? 'Go to Home' : `Read as ${c.name}`} icon="book-open" variant={active ? 'ghost' : 'primary'} small style={{ flex: 1 }} onPress={() => selectChild(c.id)} />
                  <Btn label="Remove" icon="trash-2" variant="danger" small onPress={() => confirmRemove(c.id, c.name)} />
                </View>
              </HardBox>
            );
          })}
          <Btn label="Add a child" icon="user-plus" variant="ghost" block onPress={() => startAddChild('tabs')} />
        </View>
      )}
    </View>
  );
};

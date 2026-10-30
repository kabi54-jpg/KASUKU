import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { colors, fonts, radius, role } from '../theme';
import { Badge, Btn, HardBox, Txt } from './ui';
import { KasukuBuddy } from './KasukuBuddy';
import { cleanWord, speakWord, SpeechEngineNotConnected, splitKiswahiliSyllables, tagSounds } from '../integration';

/** "Help moment": the word zooms in, Kasuku splits it into syllables, the child repeats it. */
export const HelpSheet = ({
  word, onClose, onHelped, notify, line,
}: {
  line?: string;
  word: string | null;
  onClose: () => void;
  onHelped: () => void;
  notify: (msg: string) => void;
}) => {
  const w = word ? cleanWord(word) : '';
  const syllables = word ? splitKiswahiliSyllables(word) : [];
  const sounds = word ? tagSounds(word) : [];

  const hear = async () => {
    try {
      await speakWord(w);
    } catch (e) {
      notify(e instanceof SpeechEngineNotConnected ? 'Voice is not connected yet (Person 1’s speakWord).' : 'Could not play the word.');
    }
  };

  return (
    <Modal visible={!!word} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={() => {}} accessibilityViewIsModal>
          <HardBox r={radius.lg} off={0} flat bg={colors.bg} contentStyle={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 20, gap: 16, paddingBottom: 32 }}>
            <KasukuBuddy state="helping" size={52} line={line ?? 'Let’s say it slowly, piece by piece.'} />

            <View style={{ alignItems: 'center', gap: 10 }}>
              <Text style={{ fontFamily: fonts.readingBold, fontSize: 52, lineHeight: 64, color: colors.text }}>{w}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {syllables.map((s, i) => (
                  <HardBox key={`${s}-${i}`} bg={role.action.fill} r={radius.sm} off={2} contentStyle={{ paddingHorizontal: 14, paddingVertical: 6 }}>
                    <Text style={{ fontFamily: fonts.readingBold, fontSize: 28, color: colors.white }}>{s}</Text>
                  </HardBox>
                ))}
              </View>
              {sounds.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <Txt v="small">Sound to listen for:</Txt>
                  {sounds.map((s) => (
                    <Badge key={s} label={s} bg={role.highlight.mid} />
                  ))}
                </View>
              )}
              <Txt v="small" style={{ textAlign: 'center' }}>
                Let’s say each part slowly, then say the whole word.
              </Txt>
            </View>

            <View style={{ gap: 12 }}>
              <Btn label="Hear it" icon="volume-2" variant="ghost" block onPress={hear} />
              <Btn
                label="I said it!"
                icon="check"
                variant="primary"
                block
                onPress={() => {
                  onHelped();
                  onClose();
                }}
              />
              <Btn label="Close" variant="ghost" block onPress={onClose} />
            </View>
          </HardBox>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

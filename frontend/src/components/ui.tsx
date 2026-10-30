import React, { useState } from 'react';
import { Pressable, StyleProp, Text, TextInput, TextStyle, View, ViewStyle, TextInputProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { border, colors, fonts, radius, role, shadowOffset } from '../theme';
import { getAvatar } from '../data/avatars';
import type { AvatarKey } from '../types';

export type IconName = React.ComponentProps<typeof Feather>['name'];

/* ---------- Text (navy only — never brown) ---------- */
type Variant = 'display' | 'title' | 'body' | 'bodyStrong' | 'small' | 'label';
const textStyles: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 28, lineHeight: 36, color: colors.text },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 27, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 22, color: colors.text },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.text },
};
export const Txt = ({ v = 'body', style, ...rest }: React.ComponentProps<typeof Text> & { v?: Variant }) => (
  <Text {...rest} style={[textStyles[v], style]} />
);

/* ---------- Hard-shadow box: brown edge + brown hard shadow, nothing else brown ---------- */
interface HardBoxProps {
  children?: React.ReactNode;
  bg?: string;
  r?: number;
  off?: number;
  /** press state: sink the box onto its shadow */
  pressed?: boolean;
  flat?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}
export const HardBox = ({
  children, bg = colors.paper, r = radius.md, off = shadowOffset.md, pressed = false, flat = false, style, contentStyle,
}: HardBoxProps) => (
  <View style={[{ paddingRight: off, paddingBottom: off }, style]}>
    {!flat && (
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: off, top: off, right: 0, bottom: 0, backgroundColor: colors.edge, borderRadius: r }}
      />
    )}
    <View
      style={[
        {
          backgroundColor: bg, borderWidth: border, borderColor: colors.edge, borderRadius: r,
          transform: pressed && !flat ? [{ translateX: off }, { translateY: off }] : [],
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  </View>
);

/* ---------- Buttons ---------- */
export type BtnVariant = 'primary' | 'ghost' | 'danger';
const btnColors: Record<BtnVariant, { bg: string; fg: string }> = {
  primary: { bg: role.action.fill, fg: role.action.onFill },
  danger: { bg: colors.paper, fg: role.missed.text },
  // Three button styles only: one main action (blue), one quiet, one destructive.
  ghost: { bg: colors.paper, fg: colors.text },
};
interface BtnProps {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: IconName;
  small?: boolean;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}
export const Btn = ({ label, onPress, variant = 'primary', icon, small, block, disabled, loading, style }: BtnProps) => {
  const [down, setDown] = useState(false);
  const c = btnColors[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off }}
      disabled={off}
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      style={[block && { alignSelf: 'stretch' }, off && { opacity: 0.55 }, style]}
    >
      <HardBox
        bg={c.bg}
        r={radius.sm}
        off={small ? shadowOffset.sm : shadowOffset.md}
        pressed={down}
        contentStyle={{
          minHeight: small ? 40 : 50,
          paddingHorizontal: small ? 14 : 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {icon && <Feather name={icon} size={small ? 16 : 19} color={c.fg} />}
        <Text style={{ fontFamily: fonts.bodySemi, fontSize: small ? 14 : 16, color: c.fg }}>
          {loading ? 'Please wait…' : label}
        </Text>
      </HardBox>
    </Pressable>
  );
};

/** Text-only link button */
export const LinkBtn = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={{ paddingVertical: 8 }}>
    <Text style={{ fontFamily: fonts.bodySemi, fontSize: 15, color: role.action.fill, textDecorationLine: 'underline' }}>{label}</Text>
  </Pressable>
);

/* ---------- Badge / Pill ---------- */
export const Badge = ({
  label, color = colors.text, bg = colors.paper, icon, style,
}: { label: string; color?: string; bg?: string; icon?: IconName; style?: StyleProp<ViewStyle> }) => (
  <View
    style={[
      {
        flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 26, paddingHorizontal: 10,
        borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.edge, backgroundColor: bg,
      },
      style,
    ]}
  >
    {icon && <Feather name={icon} size={13} color={color} />}
    <Text style={{ fontFamily: fonts.bodySemi, fontSize: 12, color }}>{label}</Text>
  </View>
);

export const LevelPill = ({ level }: { level: 1 | 2 | 3 }) => (
  <Badge label={`Level ${level}`} bg={role.brand.soft} icon="award" />
);

/** Persistent honesty label — shown whenever on-screen results are not live speech recognition. */
export const MockBanner = ({ text }: { text: string }) => (
  <View
    style={{
      flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.sm,
      borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.text, backgroundColor: colors.paper,
    }}
  >
    <Feather name="alert-triangle" size={16} color={colors.text} />
    <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: colors.text }}>{text}</Text>
  </View>
);

/* ---------- Stat card ---------- */
export const StatCard = ({
  k, v, sub, accent, style,
}: { k: string; v: string; sub?: string; accent?: string; style?: StyleProp<ViewStyle> }) => (
  <HardBox style={[{ flex: 1 }, style]} contentStyle={{ padding: 14, minHeight: 96, justifyContent: 'space-between', gap: 6 }}>
    <Txt v="small">{k}</Txt>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {accent ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: accent }} /> : null}
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 24, lineHeight: 30, color: colors.text }}>{v}</Text>
    </View>
    {sub ? <Txt v="small">{sub}</Txt> : null}
  </HardBox>
);

/* ---------- Segmented tabs ---------- */
export const Segmented = <T extends string>({
  options, value, onChange,
}: { options: { key: T; label: string; icon?: IconName }[]; value: T; onChange: (k: T) => void }) => (
  <HardBox r={radius.sm} off={shadowOffset.sm} contentStyle={{ flexDirection: 'row', padding: 4, gap: 4 }}>
    {options.map((o) => {
      const on = o.key === value;
      return (
        <Pressable
          key={o.key}
          onPress={() => onChange(o.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: on }}
          style={{
            flex: 1, minHeight: 42, borderRadius: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: on ? role.action.fill : 'transparent',
          }}
        >
          {o.icon && <Feather name={o.icon} size={15} color={on ? colors.white : colors.text} />}
          <Text style={{ fontFamily: fonts.bodySemi, fontSize: 13, color: on ? colors.white : colors.text }}>{o.label}</Text>
        </Pressable>
      );
    })}
  </HardBox>
);

export const Divider = () => <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 12 }} />;

/* ---------- Progress bar ---------- */
export const ProgressBar = ({ value, color = role.brand.fill }: { value: number; color?: string }) => (
  <View
    accessibilityRole="progressbar"
    accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    style={{ height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.edge, backgroundColor: colors.white, overflow: 'hidden' }}
  >
    <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: color }} />
  </View>
);

/* ---------- Avatar ---------- */
export const Avatar = ({ avatar, size = 56, off = 3 }: { avatar: AvatarKey; size?: number; off?: number }) => {
  const a = getAvatar(avatar);
  return (
    <HardBox bg={a.bg} r={size / 2} off={off} contentStyle={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.52 }}>{a.emoji}</Text>
    </HardBox>
  );
};

/* ---------- Text field ---------- */
interface FieldProps extends Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'autoComplete' | 'returnKeyType' | 'onSubmitEditing' | 'maxLength'> {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secure?: boolean;
  error?: string | null;
  hint?: string;
  icon?: IconName;
}
export const Field = ({ label, value, onChangeText, placeholder, secure, error, hint, icon, ...rest }: FieldProps) => {
  const [focus, setFocus] = useState(false);
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 14, borderRadius: radius.sm,
          backgroundColor: colors.white, borderWidth: border, borderColor: error ? role.missed.text : focus ? role.brand.fill : colors.edge,
        }}
      >
        {icon && <Feather name={icon} size={18} color={colors.textMuted} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure && !show}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          accessibilityLabel={label}
          style={{ flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.text, paddingVertical: 10 }}
          {...rest}
        />
        {secure && (
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={10} accessibilityRole="button" accessibilityLabel={show ? 'Hide password' : 'Show password'}>
            <Feather name={show ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Feather name="alert-circle" size={14} color={role.missed.text} />
          <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: role.missed.text }}>{error}</Text>
        </View>
      ) : hint ? (
        <Txt v="small">{hint}</Txt>
      ) : null}
    </View>
  );
};

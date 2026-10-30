import type { AvatarKey, Child } from '../types';
import { palette } from '../theme';

export const AVATARS: { key: AvatarKey; emoji: string; bg: string }[] = [
  { key: 'lion', emoji: '🦁', bg: palette.orangePeel },
  { key: 'elephant', emoji: '🐘', bg: palette.lochmara },
  { key: 'giraffe', emoji: '🦒', bg: palette.carissma },
  { key: 'turtle', emoji: '🐢', bg: palette.chateauGreen },
  { key: 'panda', emoji: '🐼', bg: palette.lochmara },
  { key: 'fox', emoji: '🦊', bg: palette.cinnabar },
  { key: 'frog', emoji: '🐸', bg: palette.chateauGreen },
  { key: 'tiger', emoji: '🐯', bg: palette.orangePeel },
];

export const getAvatar = (key: AvatarKey) => AVATARS.find((a) => a.key === key) ?? AVATARS[0];

/* ---------- dates (local time, YYYY-MM-DD) ---------- */
const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayStr = (): string => fmt(new Date());
export const yesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fmt(d);
};

/** Streak shown to the user: only alive if the child read today or yesterday. */
export const currentStreak = (c: Child): number =>
  c.lastReadDate === todayStr() || c.lastReadDate === yesterdayStr() ? c.streakDays : 0;

export const storiesReadToday = (c: Child): number =>
  Object.values(c.progress).filter((p) => p.lastDate === todayStr()).length;

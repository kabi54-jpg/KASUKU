/**
 * Soma Nami colour system — "one colour, one job".
 * Full rules + examples: frontend/COLOUR_SYSTEM.md
 *
 * Layers (components only touch the last two):
 *   palette  raw brand colours  (theme.ts, StoryCover art and avatar backgrounds ONLY)
 *   tints    solid pre-mixed soft/mid fills — never alpha overlays on the beige canvas
 *   role     what a colour MEANS  -> use these in components
 *   colors   neutrals: ink, canvas, cards, edge
 *
 * Hard rules:
 *  - ALL text is navy ink (colors.text / colors.textMuted). White text only on role.action.fill.
 *  - Navy ink is only used on soft/mid tints or on green/orange/pink fills. It FAILS on raw
 *    Lochmara (3.4:1) and raw Cinnabar (3.9:1) — never put text on those.
 *  - Brown (colors.edge) is for card/button edges and hard shadows ONLY.
 *  - Status is never colour alone: pair it with an icon, underline or label.
 */

export const palette = {
  dutchWhite: '#F5E4C3',
  carissma: '#E1809C',
  orangePeel: '#E19C00',
  cinnabar: '#E2562C',
  lochmara: '#0580C4',
  chateauGreen: '#37A468', // brief said "#37A46"; #37A468 confirmed in the colour-system doc
  navyInk: '#0E2A3F',
  paper: '#FFFBF2',
} as const;

/** Solid tints (20% = soft, 40% = mid, mixed onto Paper). Navy ink on every one is >= 8:1. */
export const tints = {
  blueSoft: '#CDE2E9', blueMid: '#9BCAE0',
  greenSoft: '#D7EAD5', greenMid: '#AFD8B8',
  orangeSoft: '#F9E8C2', orangeMid: '#F3D591',
  pinkSoft: '#F9E2E1', pinkMid: '#F3CAD0',
  redSoft: '#F9DACA', redMid: '#F3B9A3',
} as const;

const hue = (fill: string, soft: string, mid: string) => ({ fill, soft, mid }) as const;

/**
 * Roles. `fill` = the solid colour (use for non-text shapes: dots, bars, rings, underlines, stars,
 * or green/orange/pink chips that carry navy ink). `soft` / `mid` = backgrounds that carry navy ink.
 */
export const role = {
  /** Brand blue: progress, focus, current word, info panels, Kasuku listening. Not for text on it. */
  brand: hue(palette.lochmara, tints.blueSoft, tints.blueMid),
  /** Every main action. Deepened Lochmara so white text passes (6.0:1; raw #0580C4 is 4.3:1). */
  action: { fill: '#0468A0', onFill: '#FFFFFF' },
  /** Correct words, goal reached, success, Kasuku cheering. */
  correct: hue(palette.chateauGreen, tints.greenSoft, tints.greenMid),
  /** Stars, streak, badges. */
  reward: hue(palette.orangePeel, tints.orangeSoft, tints.orangeMid),
  /** Words that needed help, Kasuku helping. */
  helped: hue(palette.orangePeel, tints.orangeSoft, tints.orangeMid),
  /** "Recommended" / "Picked for you", sound chips (ng', ny). */
  highlight: hue(palette.carissma, tints.pinkSoft, tints.pinkMid),
  /** Missed words, errors, destructive actions. `text` is the deep shade safe on paper (5.6:1). */
  missed: { fill: palette.cinnabar, soft: tints.redSoft, mid: tints.redMid, text: '#B8391A' },
} as const;

/** Neutrals and structure. */
export const colors = {
  text: palette.navyInk, // all text ink
  textMuted: '#46607A', // secondary text (6.3:1 on paper, 4.9:1 on blue soft)
  edge: '#4B2E14', // brown: card/button edges + hard shadows ONLY
  paper: palette.paper, // card surface
  white: '#FFFFFF',
  bg: palette.dutchWhite, // canvas
  line: 'rgba(14,42,63,0.12)',
  track: '#DBDFE2', // empty bars, empty stars, ring track
  scrim: 'rgba(14,42,63,0.5)', // modal backdrop (the only alpha colour)
} as const;

export const fonts = {
  body: 'Poppins_400Regular',
  bodyMedium: 'Poppins_500Medium',
  bodySemi: 'Poppins_600SemiBold',
  display: 'PlayfairDisplay_700Bold',
  // Reading text. Andika (SIL OFL) is designed for early readers.
  // Person 4 delivers Andika-Regular.ttf; until it is swapped into the useFonts() call
  // in App.tsx, the @expo-google-fonts build of Andika is used.
  reading: 'Andika_400Regular',
  readingBold: 'Andika_700Bold',
} as const;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;
export const border = 2;
export const shadowOffset = { sm: 2, md: 3, lg: 5 } as const;

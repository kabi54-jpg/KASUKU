import React from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { colors, palette } from '../theme';

/**
 * Story cover art — simple flat illustrations drawn in code with the Kasuku palette, so the
 * app has real pictures with no image files or licences. Person 4 can replace any of these
 * with exported artwork by adding an entry to COVER_IMAGES in StoryCover below.
 */
const SKY = '#CFE8F6';
const NAVY = colors.text;
const SKIN = '#9B6B43';

const Sun = ({ x = 275, y = 36 }: { x?: number; y?: number }) => (
  <G>
    <Circle cx={x} cy={y} r={20} fill={palette.orangePeel} />
    <Circle cx={x} cy={y} r={28} fill={palette.orangePeel} opacity={0.25} />
  </G>
);
const Grass = ({ color = palette.chateauGreen }: { color?: string }) => <Rect x={0} y={118} width={320} height={42} fill={color} />;

/* 1 — boy reading */
const Boy = () => (
  <G>
    <Rect width={320} height={160} fill={SKY} />
    <Sun />
    <Grass />
    <Rect x={118} y={92} width={84} height={52} rx={14} fill={palette.lochmara} />
    <Circle cx={160} cy={68} r={26} fill={SKIN} />
    <Path d="M134 62 Q160 30 186 62 Q160 48 134 62Z" fill={NAVY} />
    <Circle cx={150} cy={70} r={3} fill={NAVY} />
    <Circle cx={170} cy={70} r={3} fill={NAVY} />
    <Path d="M150 80 Q160 88 170 80" stroke={NAVY} strokeWidth={3} fill="none" strokeLinecap="round" />
    <Path d="M100 112 L160 100 L160 138 L100 146Z" fill={palette.carissma} />
    <Path d="M220 112 L160 100 L160 138 L220 146Z" fill={palette.dutchWhite} />
    <Path d="M160 100 L160 138" stroke={NAVY} strokeWidth={2} />
  </G>
);

/* 2 — cow (ng'ombe) */
const Cow = () => (
  <G>
    <Rect width={320} height={160} fill={SKY} />
    <Sun x={50} />
    <Grass />
    <Rect x={96} y={112} width={14} height={34} fill={NAVY} />
    <Rect x={196} y={112} width={14} height={34} fill={NAVY} />
    <Ellipse cx={155} cy={96} rx={72} ry={36} fill={colors.white} />
    <Ellipse cx={130} cy={86} rx={16} ry={11} fill={NAVY} />
    <Ellipse cx={180} cy={104} rx={14} ry={10} fill={NAVY} />
    <Circle cx={236} cy={78} r={27} fill={colors.white} />
    <Ellipse cx={246} cy={92} rx={17} ry={12} fill={palette.carissma} />
    <Circle cx={240} cy={72} r={3.5} fill={NAVY} />
    <Polygon points="222,54 214,36 230,50" fill={palette.orangePeel} />
    <Polygon points="250,52 262,36 256,56" fill={palette.orangePeel} />
    <Path d="M84 90 Q70 100 76 118" stroke={NAVY} strokeWidth={4} fill="none" strokeLinecap="round" />
  </G>
);

/* 3 — cat & mouse */
const CatMouse = () => (
  <G>
    <Rect width={320} height={160} fill="#F8E7C2" />
    <Rect x={0} y={118} width={320} height={42} fill={palette.orangePeel} opacity={0.55} />
    <Ellipse cx={120} cy={104} rx={50} ry={32} fill={NAVY} />
    <Circle cx={170} cy={78} r={28} fill={NAVY} />
    <Polygon points="148,58 150,34 168,52" fill={NAVY} />
    <Polygon points="192,58 190,34 174,52" fill={NAVY} />
    <Circle cx={160} cy={78} r={6} fill={palette.orangePeel} />
    <Circle cx={182} cy={78} r={6} fill={palette.orangePeel} />
    <Path d="M72 96 Q40 80 52 56" stroke={NAVY} strokeWidth={9} fill="none" strokeLinecap="round" />
    <Ellipse cx={262} cy={128} rx={22} ry={13} fill="#A8B8C6" />
    <Circle cx={280} cy={120} r={10} fill="#A8B8C6" />
    <Circle cx={276} cy={110} r={6} fill={palette.carissma} />
    <Circle cx={284} cy={119} r={2.5} fill={NAVY} />
    <Path d="M240 130 Q222 140 214 128" stroke="#A8B8C6" strokeWidth={3} fill="none" />
  </G>
);

/* 4 — fish in the river */
const Fish = () => (
  <G>
    <Rect width={320} height={160} fill={palette.lochmara} />
    <Path d="M0 34 Q40 20 80 34 T160 34 T240 34 T320 34 L320 0 L0 0Z" fill="#7CC4EA" />
    <Circle cx={60} cy={110} r={6} fill={colors.white} opacity={0.7} />
    <Circle cx={74} cy={90} r={4} fill={colors.white} opacity={0.7} />
    <Ellipse cx={150} cy={90} rx={46} ry={26} fill={palette.orangePeel} />
    <Polygon points="196,90 236,64 236,116" fill={palette.orangePeel} />
    <Circle cx={124} cy={84} r={6} fill={colors.white} />
    <Circle cx={123} cy={84} r={3} fill={NAVY} />
    <Path d="M150 70 Q160 90 150 110" stroke={palette.cinnabar} strokeWidth={4} fill="none" />
    <Ellipse cx={250} cy={128} rx={28} ry={14} fill={palette.carissma} />
    <Polygon points="276,128 298,114 298,142" fill={palette.carissma} />
    <Circle cx={236} cy={124} r={3.5} fill={NAVY} />
    <Rect x={0} y={142} width={320} height={18} fill={palette.chateauGreen} />
  </G>
);

/* 5 — school */
const School = () => (
  <G>
    <Rect width={320} height={160} fill={SKY} />
    <Sun x={40} y={34} />
    <Grass />
    <Rect x={90} y={64} width={140} height={70} fill={palette.carissma} />
    <Polygon points="80,66 160,30 240,66" fill={palette.cinnabar} />
    <Rect x={146} y={96} width={28} height={38} fill={NAVY} />
    <Rect x={104} y={78} width={26} height={22} fill={colors.white} />
    <Rect x={190} y={78} width={26} height={22} fill={colors.white} />
    <Circle cx={272} cy={132} r={13} fill={colors.white} />
    <Path d="M272 119 L276 130 L268 130Z M262 138 L270 134 L272 142Z" fill={NAVY} />
    <Rect x={156} y={14} width={3} height={20} fill={NAVY} />
    <Polygon points="159,14 182,20 159,26" fill={palette.orangePeel} />
  </G>
);

/* 6 — rainy day */
const Rain = () => (
  <G>
    <Rect width={320} height={160} fill="#BFD6E6" />
    <Ellipse cx={120} cy={42} rx={56} ry={22} fill={colors.white} />
    <Ellipse cx={170} cy={34} rx={44} ry={24} fill={colors.white} />
    <Ellipse cx={212} cy={46} rx={46} ry={20} fill={colors.white} />
    {[96, 124, 152, 180, 208, 236].map((x, i) => (
      <Path key={x} d={`M${x} ${72 + (i % 2) * 10} l-6 16`} stroke={palette.lochmara} strokeWidth={4} strokeLinecap="round" />
    ))}
    <Rect x={0} y={128} width={320} height={32} fill={palette.chateauGreen} />
    <Ellipse cx={86} cy={142} rx={30} ry={7} fill={palette.lochmara} opacity={0.6} />
    <Rect x={196} y={96} width={64} height={44} fill={palette.dutchWhite} />
    <Polygon points="188,98 228,66 268,98" fill={palette.cinnabar} />
    <Rect x={219} y={112} width={20} height={28} fill={NAVY} />
  </G>
);

const SCENES: Record<string, () => React.ReactElement> = { s1: Boy, s2: Cow, s3: CatMouse, s4: Fish, s5: School, s6: Rain };

/** Replace a story's drawn cover with real artwork: COVER_IMAGES.s1 = require('../../assets/covers/s1.png') */
export const COVER_IMAGES: Record<string, number | undefined> = {};

export const StoryCover = ({ storyId, height = 150 }: { storyId: string; height?: number }) => {
  const Scene = SCENES[storyId] ?? Boy;
  const img = COVER_IMAGES[storyId];
  return (
    <View style={{ height, width: '100%', overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {img ? (
        <Image source={img} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <Svg width="100%" height="100%" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">
          <Scene />
        </Svg>
      )}
    </View>
  );
};

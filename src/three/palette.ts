// Scene colours derived only from the supplied six-colour palette (plus white).
export const PALETTE = {
  forest: '#051F20',
  pine: '#0B2B26',
  spruce: '#163832',
  moss: '#235347',
  sage: '#8EB69B',
  mint: '#DAF1DE',
  white: '#FFFFFF',
} as const;

export type SceneTheme = {
  exposure: number;
  envIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  key: string;
  keyIntensity: number;
  rim: string;
  rimIntensity: number;
  drum: string;
  overlay: string;
  overlayAlpha: number;
  topLow: string;
  shadow: string;
  shadowOpacity: number;
  glowCore: string;
  glowColor: string;
  glowStreak: string;
  glowAdditive: boolean;
  glowIntensity: number;
  shell: string;
  paint: string;
  far: string;
  mid: string;
  near: string;
  city: string;
  backdropAlpha: number;
  dust: string;
  dustOpacity: number;
  map: { bg: string; block: string; minor: string; major: string; casing: string; water: string; park: string; grid: string };
  pinCar: string;
  pinBike: string;
};

export const SCENE_THEMES: Record<'light' | 'dark', SceneTheme> = {
  light: {
    exposure: 1.0,
    envIntensity: 1.0,
    hemiSky: PALETTE.white,
    hemiGround: PALETTE.sage,
    hemiIntensity: 1.1,
    key: PALETTE.white,
    keyIntensity: 2.0,
    rim: PALETTE.mint,
    rimIntensity: 1.4,
    drum: '#cfe4d6',
    overlay: '#eef7f0',
    overlayAlpha: 0.6,
    topLow: '#e4f1e8',
    shadow: PALETTE.spruce,
    shadowOpacity: 0.32,
    glowCore: PALETTE.white,
    glowColor: PALETTE.sage,
    glowStreak: PALETTE.moss,
    glowAdditive: false,
    glowIntensity: 1.0,
    shell: '#f4faf6',
    paint: '#b9d5c2',
    far: PALETTE.sage,
    mid: PALETTE.sage,
    near: PALETTE.moss,
    city: PALETTE.sage,
    backdropAlpha: 0.42,
    dust: PALETTE.moss,
    dustOpacity: 0.35,
    map: { bg: '#e7f3ea', block: '#d9ebdf', minor: '#f7fbf8', major: '#ffffff', casing: '#b9d6c2', water: '#c7e0cf', park: '#c4e0cc', grid: '#d2e6d8' },
    pinCar: PALETTE.moss,
    pinBike: PALETTE.pine,
  },
  dark: {
    exposure: 1.15,
    envIntensity: 0.42,
    hemiSky: PALETTE.sage,
    hemiGround: PALETTE.forest,
    hemiIntensity: 0.55,
    key: PALETTE.mint,
    keyIntensity: 1.2,
    rim: PALETTE.sage,
    rimIntensity: 2.4,
    drum: PALETTE.pine,
    overlay: PALETTE.pine,
    overlayAlpha: 0.5,
    topLow: '#10322b',
    shadow: '#000000',
    shadowOpacity: 0.55,
    glowCore: PALETTE.mint,
    glowColor: PALETTE.sage,
    glowStreak: PALETTE.white,
    glowAdditive: true,
    glowIntensity: 1.25,
    shell: '#dfece4',
    paint: '#e3f0e7',
    far: PALETTE.spruce,
    mid: PALETTE.pine,
    near: PALETTE.forest,
    city: PALETTE.spruce,
    backdropAlpha: 0.8,
    dust: PALETTE.sage,
    dustOpacity: 0.55,
    map: { bg: '#0a2924', block: '#0f312b', minor: '#163832', major: '#235347', casing: '#0b2b26', water: '#051F20', park: '#12372f', grid: '#0f2f29' },
    pinCar: PALETTE.mint,
    pinBike: PALETTE.sage,
  },
};

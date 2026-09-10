import type { ShowcaseProduct } from '../../data/site';

export interface FloatObject {
  key: 'logo' | 'avatars' | 'send' | 'role' | 'archive' | 'wave' | 'start';
  product: ShowcaseProduct['key'];
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  scale: number;
  angle: number;
}

// Coordinates refer to the supplied screenshot's 2048 × 1139 viewing plane.
// These are decorative reconstructions, not embedded controls from either product.
export const floatObjects: readonly FloatObject[] = [
  { key: 'logo', product: 'dual', label: 'Logo', x: 26, y: 23, w: 38, h: 37, dx: 34, dy: 28, scale: 2.8, angle: -7 },
  { key: 'avatars', product: 'dual', label: '我 / 她', x: 1633, y: 783, w: 190, h: 52, dx: -25, dy: -24, scale: 1.6, angle: -5 },
  { key: 'send', product: 'dual', label: '发送箭头', x: 1388, y: 951, w: 57, h: 57, dx: -22, dy: -28, scale: 1.65, angle: -5 },
  { key: 'role', product: 'dual', label: '角色选择', x: 243, y: 1024, w: 303, h: 78, dx: 26, dy: -24, scale: 1.35, angle: -4 },
  { key: 'archive', product: 'aoai', label: '声纹档案', x: 1700, y: 180, w: 161, h: 44, dx: 0, dy: 48, scale: 1.65, angle: -5 },
  { key: 'wave', product: 'aoai', label: '声波', x: 1620, y: 129, w: 34, h: 35, dx: -34, dy: -20, scale: 2.1, angle: -7 },
  { key: 'start', product: 'aoai', label: '开始转写', x: 1488, y: 124, w: 112, h: 48, dx: -85, dy: 10, scale: 1.55, angle: -4 },
];

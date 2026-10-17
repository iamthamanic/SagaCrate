/**
 * procedural-eldoria — offline-generated basemap rasters for demo LOD.
 * Location: src/app/world/atlas/unified/procedural-eldoria.ts
 */
import { WORLD_RECT } from './eldoria-scene';

function mulberry(seed: number): () => number {
  let v = seed >>> 0;
  return () => {
    v = (Math.imul(v, 1664525) + 1013904223) >>> 0;
    return v / 4294967296;
  };
}

function curvePath(
  c: CanvasRenderingContext2D,
  coords: readonly (readonly [number, number])[],
  close = true,
): void {
  c.beginPath();
  c.moveTo(coords[0][0], coords[0][1]);
  for (let i = 1; i < coords.length; i += 1) c.lineTo(coords[i][0], coords[i][1]);
  if (close) c.closePath();
}

function label(
  c: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  c.save();
  c.fillStyle = color;
  c.font = `${size >= 22 ? '700' : '600'} ${size}px "Darker Grotesque", Georgia, serif`;
  c.textAlign = 'center';
  c.fillText(text, x, y);
  c.restore();
}

function evergreen(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = '#466850';
  for (let j = 0; j < 3; j += 1) {
    c.beginPath();
    c.moveTo(0, -17 + j * 7);
    c.lineTo(-13 + j * 2, 7 + j * 4);
    c.lineTo(13 - j * 2, 7 + j * 4);
    c.closePath();
    c.fill();
  }
  c.restore();
}

function mountain(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = '#9d9b8b';
  c.beginPath();
  c.moveTo(-35, 31);
  c.lineTo(-5, -35);
  c.lineTo(13, -8);
  c.lineTo(25, -26);
  c.lineTo(40, 31);
  c.closePath();
  c.fill();
  c.fillStyle = '#e2dcc6';
  c.beginPath();
  c.moveTo(-5, -35);
  c.lineTo(-17, -7);
  c.lineTo(-1, -13);
  c.lineTo(9, -2);
  c.closePath();
  c.fill();
  c.restore();
}

function cityRoof(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  c.fillStyle = '#b8a88a';
  c.fillRect(x - 2, y - 2, w + 4, h + 4);
  c.fillStyle = '#86533f';
  c.fillRect(x, y, w, h);
  c.fillStyle = '#bd8a67';
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + w / 2, y + h * 0.15);
  c.lineTo(x + w, y);
  c.lineTo(x + w / 2, y + h * 0.8);
  c.closePath();
  c.fill();
}

export type EldoriaArtBundle = {
  readonly world: HTMLCanvasElement;
  readonly region: HTMLCanvasElement;
  readonly city: HTMLCanvasElement;
  readonly interior: HTMLCanvasElement;
};

let cached: EldoriaArtBundle | null = null;

export function getEldoriaArt(): EldoriaArtBundle {
  if (cached) return cached;

  const world = document.createElement('canvas');
  world.width = WORLD_RECT.width;
  world.height = WORLD_RECT.height;
  const wc = world.getContext('2d');
  if (!wc) throw new Error('Canvas 2D nicht verfügbar');
  const wr = mulberry(981);
  const sea = wc.createLinearGradient(0, 0, 1440, 900);
  sea.addColorStop(0, '#285568');
  sea.addColorStop(1, '#4b8790');
  wc.fillStyle = sea;
  wc.fillRect(0, 0, 1440, 900);
  const land: [number, number][] = [
    [130, 120],
    [370, 95],
    [655, 84],
    [952, 170],
    [1205, 318],
    [1244, 548],
    [985, 789],
    [590, 827],
    [217, 618],
    [93, 409],
  ];
  wc.fillStyle = '#a0ab84';
  curvePath(wc, land);
  wc.fill();
  wc.save();
  curvePath(wc, land);
  wc.clip();
  for (let i = 0; i < 60; i += 1) evergreen(wc, 190 + wr() * 520, 310 + wr() * 400, 0.5 + wr() * 0.6);
  for (let i = 0; i < 40; i += 1) mountain(wc, 760 + wr() * 300, 170 + wr() * 170, 0.4 + wr() * 0.5);
  wc.restore();
  wc.strokeStyle = '#557f83';
  wc.lineWidth = 10;
  wc.beginPath();
  wc.moveTo(811, 207);
  wc.bezierCurveTo(740, 345, 915, 385, 897, 471);
  wc.bezierCurveTo(862, 558, 1055, 647, 970, 795);
  wc.stroke();
  label(wc, 'DAS NORDREICH', 990, 245, 28, '#314544');
  label(wc, 'WESTMARK', 423, 495, 26, '#344944');
  label(wc, 'Dornhain', 965, 503, 18, '#29494a');
  label(wc, 'Eldoria', 475, 170, 36, '#38534d');

  const region = document.createElement('canvas');
  region.width = 1200;
  region.height = 900;
  const rc = region.getContext('2d');
  if (!rc) throw new Error('Canvas 2D nicht verfügbar');
  const rr = mulberry(633);
  rc.fillStyle = '#9dad81';
  rc.fillRect(0, 0, 1200, 900);
  for (let i = 0; i < 200; i += 1) evergreen(rc, rr() * 1200, rr() * 900, 0.6 + rr() * 0.8);
  rc.strokeStyle = '#6e8b8a';
  rc.lineWidth = 40;
  rc.lineCap = 'round';
  rc.beginPath();
  rc.moveTo(40, 0);
  rc.bezierCurveTo(160, 320, 500, 240, 670, 500);
  rc.bezierCurveTo(900, 720, 1000, 650, 1140, 900);
  rc.stroke();
  label(rc, 'DORNHAINER MARK', 612, 130, 32, '#485a4b');

  const city = document.createElement('canvas');
  city.width = 1200;
  city.height = 900;
  const cc = city.getContext('2d');
  if (!cc) throw new Error('Canvas 2D nicht verfügbar');
  const cr = mulberry(153);
  cc.fillStyle = '#b1b79a';
  cc.fillRect(0, 0, 1200, 900);
  cc.strokeStyle = '#656b60';
  cc.lineWidth = 20;
  cc.strokeRect(32, 32, 1136, 836);
  cc.fillStyle = '#978b72';
  cc.fillRect(0, 400, 1200, 100);
  cc.fillRect(545, 0, 130, 900);
  for (let i = 0; i < 50; i += 1) {
    cityRoof(cc, 40 + cr() * 1100, 40 + cr() * 800, 30 + cr() * 60, 30 + cr() * 50);
  }
  cityRoof(cc, 590, 340, 185, 185);
  label(cc, 'MARKT', 337, 530, 22, '#4e5349');
  label(cc, 'KUPFERLATERNE', 735, 330, 20, '#5b4232');

  const interior = document.createElement('canvas');
  interior.width = 1400;
  interior.height = 1000;
  const ic = interior.getContext('2d');
  if (!ic) throw new Error('Canvas 2D nicht verfügbar');
  ic.fillStyle = '#393a38';
  ic.fillRect(0, 0, 1400, 1000);
  ic.fillStyle = '#946a4d';
  ic.fillRect(95, 95, 1220, 803);
  for (let x = 95; x < 1320; x += 33) {
    ic.fillStyle = x % 66 === 0 ? '#a47754' : '#855e45';
    ic.fillRect(x, 95, 30, 803);
  }
  ic.strokeStyle = '#a6a298';
  ic.lineWidth = 18;
  ic.strokeRect(92, 92, 1220, 805);
  ic.fillStyle = '#ac6a43';
  ic.fillRect(225, 112, 220, 80);

  cached = { world, region, city, interior };
  return cached;
}

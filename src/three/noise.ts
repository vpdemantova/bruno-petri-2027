/* ════════════════════════════════════════════════════════════════════
   RUÍDO EM TEXTURA 3D.

   Os materiais precisam de muito ruído (veios, anéis, grão). Calcular o
   ruído de Perlin dentro do shader gera um código enorme, que o Windows
   (D3D12) leva segundos para compilar na primeira visita. Aqui o ruído é
   calculado UMA vez, na abertura, numa textura 3D de 64³ que se repete sem
   emenda (ruído periódico), e os shaders só consultam a textura: código
   curto, compilação rápida, desenho leve.

   Quatro canais, quatro ruídos de Perlin independentes, cada um com 8
   células por período. No shader, `fbm` e `turb` somam oitavas lendo a
   textura em escalas que dobram (1, 2, 4, 8).

   Unidade: n(p) tem uma "célula" por unidade de p, como o mx_noise do
   MaterialX; por isso as fórmulas antigas trocam só o nome da função.
════════════════════════════════════════════════════════════════════ */
import { Data3DTexture, DataUtils, HalfFloatType, LinearFilter, RGBAFormat, RepeatWrapping } from "three/webgpu";
import { texture3D, float, abs } from "three/tsl";

const SIZE = 64, CELLS = 8;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Perlin 3D periódico: gradientes aleatórios numa grade CELLS³ que se repete */
function perlin(seed: number) {
  const r = rng(seed), n = CELLS ** 3, g = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    // direção uniforme na esfera
    const z = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
    g[i * 3] = Math.cos(a) * s; g[i * 3 + 1] = Math.sin(a) * s; g[i * 3 + 2] = z;
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const at = (x: number, y: number, z: number) => (((x % CELLS) * CELLS + (y % CELLS)) * CELLS + (z % CELLS)) * 3;
  return (x: number, y: number, z: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = fade(xf), v = fade(yf), w = fade(zf);
    let out = 0;
    for (let c = 0; c < 8; c++) {
      const dx = c & 1, dy = (c >> 1) & 1, dz = (c >> 2) & 1;
      const k = at(xi + dx, yi + dy, zi + dz);
      const d = g[k] * (xf - dx) + g[k + 1] * (yf - dy) + g[k + 2] * (zf - dz);
      out += d * (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    }
    return out * 1.6; // ~[-1, 1]
  };
}

function build(): Data3DTexture {
  const ch = [perlin(11), perlin(29), perlin(47), perlin(83)];
  const data = new Uint16Array(SIZE ** 3 * 4);
  const k = CELLS / SIZE;
  let i = 0;
  for (let z = 0; z < SIZE; z++) for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    for (let c = 0; c < 4; c++) data[i++] = DataUtils.toHalfFloat(ch[c](x * k, y * k, z * k));
  }
  const t = new Data3DTexture(data, SIZE, SIZE, SIZE);
  t.format = RGBAFormat;
  t.type = HalfFloatType;
  t.minFilter = t.magFilter = LinearFilter;
  t.wrapS = t.wrapT = t.wrapR = RepeatWrapping;
  t.generateMipmaps = false;
  t.unpackAlignment = 1;
  t.needsUpdate = true;
  return t;
}

let tex: Data3DTexture | null = null;
export const noiseTexture = () => (tex ??= build());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type N = any;
const S = (p: N) => texture3D(noiseTexture(), p.div(CELLS));
/** ruídos simples, com sinal (~−1…1), uma célula por unidade */
export const nA = (p: N): N => S(p).r;
export const nB = (p: N): N => S(p).g;
export const nC = (p: N): N => S(p).b;
export const nD = (p: N): N => S(p).a;
/** soma de oitavas (fbm), como o mx_fractal_noise_float(p, oct, 2, 0.5) */
export function fbm(p: N, oct = 4, gain = 0.5): N {
  let sum: N = float(0), amp = 1, q: N = p;
  for (let i = 0; i < oct; i++) {
    const n = i % 2 ? nC(q.add(17.3)) : nA(q);
    sum = sum.add(n.mul(amp));
    amp *= gain; q = q.mul(2.03);
  }
  return sum;
}
/** turbulência de Perlin: soma de |ruído| (vincos agudos, bom para veios) */
export function turb(p: N, oct = 4): N {
  let sum: N = float(0), amp = 1, q: N = p;
  for (let i = 0; i < oct; i++) {
    sum = sum.add(abs(nB(q)).mul(amp));
    amp *= 0.5; q = q.mul(2.07).add(3.1);
  }
  return sum;
}

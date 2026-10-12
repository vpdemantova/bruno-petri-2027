/* ════════════════════════════════════════════════════════════════════
   PINTURAS E MANDALAS GERADAS (canvas 2D).

   Ficam no lugar das obras planas do artista até chegarem as fotos (ver
   TAREFAS.md, BP-02). Cada uma nasce de uma semente: a mesma semente dá
   sempre a mesma imagem.

   · Pintura a óleo: cada pincelada é um feixe de cerdas (linhas finas
     com cor e carga de tinta que variam); a mesma pincelada é desenhada
     num segundo canvas, em cinza, que vira o mapa de altura do relevo
     (a tinta grossa pega a luz rasante no visualizador 3D).
   · Mandala: desenho a compasso e régua em simetria de n, em ouro sobre
     preto ou nanquim sobre papel; o traço vira também a máscara de metal
     (folha de ouro) no 3D.
════════════════════════════════════════════════════════════════════ */

export interface Flat { color: HTMLCanvasElement; height?: HTMLCanvasElement; metal?: HTMLCanvasElement; aspect: number; gold?: boolean }

function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.round(w); c.height = Math.round(h);
  return c;
};

function hex(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgb = (c: [number, number, number], k = 1, a = 1) =>
  `rgba(${Math.max(0, Math.min(255, c[0] * k)) | 0},${Math.max(0, Math.min(255, c[1] * k)) | 0},${Math.max(0, Math.min(255, c[2] * k)) | 0},${a})`;
const mixc = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const PALETTES: string[][] = [
  ["#f2c230", "#e8742a", "#c42c8c", "#2b2a6b", "#f2ead6"],
  ["#fce818", "#c42c8c", "#6cc8d8", "#161616", "#efe9dd"],
  ["#0e3a5b", "#1d6f8f", "#6cc8d8", "#e8e2cf", "#c9a24a"],
  ["#7a2e1e", "#c86b3c", "#e8c07a", "#2f3b2b", "#efe4cf"],
  ["#121433", "#2b3a8a", "#c42c8c", "#f2c230", "#e9e4f2"],
  ["#e4a5b5", "#c42c8c", "#6b1d4a", "#f4d8a0", "#fbf3ea"],
  ["#1f4a3a", "#3f8a5f", "#d9c36a", "#e8742a", "#f1ece0"],
];

type P = [number, number];

/* ── a pincelada ── */
interface Brush { c: CanvasRenderingContext2D; h: CanvasRenderingContext2D; r: () => number }
function stroke(b: Brush, path: P[], width: number, col: [number, number, number], o: { load?: number; knife?: boolean; alpha?: number } = {}) {
  const { c, h, r } = b;
  const n = Math.max(6, Math.min(46, Math.round(width / 2.2)));
  const load = o.load ?? 1;
  // normais ao longo do caminho
  const nm: P[] = path.map((_p, i) => {
    const a = path[Math.max(0, i - 1)], z = path[Math.min(path.length - 1, i + 1)];
    const dx = z[0] - a[0], dy = z[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });
  c.lineCap = h.lineCap = "round";
  for (let k = 0; k < n; k++) {
    const off = (k / (n - 1) - 0.5) * width * (0.9 + r() * 0.2);
    const tone = 0.86 + r() * 0.28;
    const lw = (width / n) * (o.knife ? 2.2 : 1.6 + r() * 1.2);
    const dry = o.knife ? 1 : 0.55 + r() * 0.45; // quanto da cerda chega ao fim
    const last = Math.max(2, Math.floor(path.length * Math.min(1, dry * load + 0.25)));
    c.strokeStyle = rgb(col, tone, (o.alpha ?? 0.9) * (0.55 + r() * 0.45));
    c.lineWidth = lw;
    h.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.07})`;
    h.lineWidth = lw * 0.8;
    c.beginPath(); h.beginPath();
    for (let i = 0; i < last; i++) {
      const j = (r() - 0.5) * lw * 0.6;
      const x = path[i][0] + nm[i][0] * (off + j), y = path[i][1] + nm[i][1] * (off + j);
      if (i === 0) { c.moveTo(x, y); h.moveTo(x, y); } else { c.lineTo(x, y); h.lineTo(x, y); }
    }
    c.stroke(); h.stroke();
  }
  // a crista de tinta nas bordas da pincelada
  h.lineWidth = Math.max(1.2, width * 0.05);
  h.strokeStyle = `rgba(255,255,255,${o.knife ? 0.28 : 0.16})`;
  for (const side of [-0.5, 0.5]) {
    h.beginPath();
    path.forEach((p, i) => { const x = p[0] + nm[i][0] * side * width, y = p[1] + nm[i][1] * side * width; if (i === 0) h.moveTo(x, y); else h.lineTo(x, y); });
    h.stroke();
  }
}

const line = (a: P, b: P, steps = 18, wob = 0, r?: () => number): P[] =>
  Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    const w = r ? (r() - 0.5) * wob : 0;
    return [a[0] + (b[0] - a[0]) * t + w, a[1] + (b[1] - a[1]) * t + w];
  });
const arc = (cx: number, cy: number, rad: number, a0: number, a1: number, steps = 40): P[] =>
  Array.from({ length: steps }, (_, i) => { const a = a0 + ((a1 - a0) * i) / (steps - 1); return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]; });
const curve = (pts: P[], steps = 40): P[] => {
  // Catmull-Rom pelos pontos de controle
  const out: P[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * (pts.length - 1), k = Math.min(pts.length - 2, Math.floor(t)), u = t - k;
    const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)];
    const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
};

/* ── tela: trama do linho, no relevo e um pouco na cor ── */
function ground(b: Brush, W: number, H: number, col: [number, number, number]) {
  b.c.fillStyle = rgb(col); b.c.fillRect(0, 0, W, H);
  b.h.fillStyle = "#000"; b.h.fillRect(0, 0, W, H);
  b.h.globalAlpha = 0.05; b.h.fillStyle = "#fff";
  for (let x = 0; x < W; x += 3) b.h.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 3) b.h.fillRect(0, y, W, 1);
  b.h.globalAlpha = 1;
  // camada de fundo em pinceladas largas, quase da cor do chão
  for (let i = 0; i < 26; i++) {
    const y = b.r() * H, x = -60 + b.r() * W * 0.4;
    stroke(b, line([x, y], [x + W * (0.6 + b.r() * 0.6), y + (b.r() - 0.5) * 60], 24, 8, b.r), 60 + b.r() * 90, mixc(col, [255, 255, 255], (b.r() - 0.5) * 0.12), { alpha: 0.45 });
  }
}

export function painting(style: string, seed: number, wcm: number, hcm: number): Flat {
  const long = 1024;
  const W = wcm >= hcm ? long : (long * wcm) / hcm, H = wcm >= hcm ? (long * hcm) / wcm : long;
  const col = canvas(W, H), hei = canvas(W, H);
  const r = rng(seed);
  const b: Brush = { c: col.getContext("2d")!, h: hei.getContext("2d")!, r };
  const pal = PALETTES[seed % PALETTES.length].map(hex);
  const pick = () => pal[Math.floor(r() * pal.length)];
  const S = Math.min(W, H);

  if (style === "campos") {
    ground(b, W, H, pal[3]);
    const n = 2 + (seed % 2);
    const top = H * 0.07, gap = H * 0.05, fh = (H - top * 2 - gap * (n - 1)) / n;
    for (let f = 0; f < n; f++) {
      const c = pal[(f + seed) % 3], y0 = top + f * (fh + gap);
      for (let i = 0; i < 70; i++) {
        const y = y0 + r() * fh, x = W * 0.08 + r() * W * 0.05;
        stroke(b, line([x, y], [W * (0.86 + r() * 0.06), y + (r() - 0.5) * 18], 26, 5, r), 26 + r() * 40, mixc(c, pal[4], (r() - 0.5) * 0.25), { alpha: 0.55 });
      }
    }
  } else if (style === "geometria") {
    ground(b, W, H, pal[4]);
    const cx = W * (0.35 + r() * 0.3), cy = H * (0.35 + r() * 0.3), R = S * (0.22 + r() * 0.08);
    for (let k = 0; k < 26; k++) stroke(b, arc(cx, cy, R * (0.15 + (k / 26) * 0.85), r() * 6, r() * 6 + 5.2, 46), R * 0.12, pal[0], { alpha: 0.8 });
    const tri: P[] = [[W * 0.15, H * 0.85], [W * 0.55, H * 0.2], [W * 0.88, H * 0.82]];
    for (let k = 0; k < 3; k++) for (let j = 0; j < 7; j++) {
      const a = tri[k], z = tri[(k + 1) % 3], t = j / 7;
      stroke(b, line([a[0] + (z[0] - a[0]) * t * 0.05, a[1] + (z[1] - a[1]) * t * 0.05], z, 20), S * 0.022, pal[1 + (k % 2)], { knife: true, alpha: 0.85 });
    }
    for (let i = 0; i < 6; i++) {
      const y = H * (0.1 + r() * 0.8);
      stroke(b, line([W * 0.05, y], [W * 0.95, y + (r() - 0.5) * H * 0.2], 20), S * 0.012, pick(), { knife: true });
    }
    const c2 = [W * (0.2 + r() * 0.6), H * (0.2 + r() * 0.6)];
    for (let k = 0; k < 14; k++) stroke(b, arc(c2[0], c2[1], S * 0.04 + k * S * 0.006, 0, 6.28, 30), S * 0.018, pal[2], { alpha: 0.9 });
  } else if (style === "gestos") {
    ground(b, W, H, seed % 2 ? pal[3] : pal[4]);
    for (let i = 0; i < 55; i++) {
      const pts: P[] = Array.from({ length: 4 }, () => [r() * W, r() * H] as P);
      stroke(b, curve(pts, 48), S * (0.03 + r() * 0.07), pick(), { load: 0.7 + r() * 0.3, alpha: 0.85 });
    }
    for (let i = 0; i < 14; i++) {
      const x = r() * W, y = r() * H * 0.6;
      stroke(b, line([x, y], [x + (r() - 0.5) * 8, y + H * (0.1 + r() * 0.3)], 20, 2, r), 3 + r() * 4, pick(), { alpha: 0.8 });
    }
  } else if (style === "horizonte") {
    ground(b, W, H, pal[3]);
    const bands = 7;
    for (let k = 0; k < bands; k++) {
      const y0 = (k / bands) * H, c = mixc(pal[k % 3], pal[(k + 1) % 5], r() * 0.4);
      for (let i = 0; i < 14; i++) {
        const y = y0 + r() * (H / bands), x = -20 + r() * W * 0.2;
        stroke(b, line([x, y], [x + W * (0.5 + r() * 0.7), y], 14), H / bands * (0.4 + r() * 0.5), c, { knife: true, alpha: 0.8 });
      }
    }
    const sx = W * (0.3 + r() * 0.4), sy = H * 0.42;
    for (let k = 0; k < 18; k++) stroke(b, arc(sx, sy, S * 0.02 + k * S * 0.007, 0, 6.28, 40), S * 0.02, pal[0], { alpha: 0.9 });
  } else {
    // radial: um sol de pinceladas
    ground(b, W, H, pal[3]);
    const cx = W / 2, cy = H / 2, R = S * 0.48;
    for (let i = 0; i < 160; i++) {
      const a = r() * Math.PI * 2, r0 = R * (0.12 + r() * 0.2), r1 = R * (0.55 + r() * 0.5);
      stroke(b, line([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1], 22), S * (0.012 + r() * 0.02), mixc(pal[i % 3], pal[4], r() * 0.3), { alpha: 0.8 });
    }
    for (let k = 0; k < 16; k++) stroke(b, arc(cx, cy, S * 0.01 + k * S * 0.009, r() * 6, r() * 6 + 6.28, 44), S * 0.02, pal[0], { alpha: 0.9 });
  }
  // verniz final: um véu leve que puxa as cores para o mesmo tom
  b.c.globalCompositeOperation = "soft-light";
  b.c.fillStyle = "rgba(255,240,215,0.18)";
  b.c.fillRect(0, 0, W, H);
  b.c.globalCompositeOperation = "source-over";
  return { color: col, height: hei, aspect: W / H };
}

/* ── mandala: compasso e régua ── */
export function mandala(seed: number, folds: number): Flat {
  const N = 1024, cv = canvas(N, N), mk = canvas(N, N);
  const r = rng(seed);
  const c = cv.getContext("2d")!, m = mk.getContext("2d")!;
  const gold = seed % 2 === 1;
  const ink = gold ? "#d9b45c" : "#1b1a19";
  const accents = ["#c42c8c", "#6cc8d8", "#fce818"];
  c.fillStyle = gold ? "#0d0d0f" : "#efe8da";
  c.fillRect(0, 0, N, N);
  if (!gold) {
    // fibra do papel
    for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(120,100,70,${r() * 0.05})`; c.fillRect(r() * N, r() * N, 1 + r() * 3, 1); }
  }
  m.fillStyle = "#000"; m.fillRect(0, 0, N, N);
  const C = N / 2;
  const both = (fn: (k: CanvasRenderingContext2D) => void, color = ink, w = 2) => {
    c.strokeStyle = color; c.lineWidth = w; m.strokeStyle = color === ink ? "#fff" : "#000"; m.lineWidth = w;
    for (const k of [c, m]) { k.beginPath(); fn(k); k.stroke(); }
  };
  const circle = (k: CanvasRenderingContext2D, x: number, y: number, rad: number) => { k.moveTo(x + rad, y); k.arc(x, y, rad, 0, Math.PI * 2); };

  const rings = [0.08, 0.16, 0.26, 0.34, 0.42, 0.47].map((f) => f * N);
  for (const rad of rings) both((k) => circle(k, C, C, rad), ink, 2.2);
  // semente da vida no centro
  both((k) => { for (let i = 0; i < folds; i++) { const a = (i / folds) * Math.PI * 2; circle(k, C + Math.cos(a) * rings[0], C + Math.sin(a) * rings[0], rings[0]); } }, ink, 1.6);
  // pétalas (vesicas) entre o 2º e o 3º anel
  const petals = folds * (1 + (seed % 2));
  both((k) => {
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2, r0 = rings[1], r1 = rings[2] + 6;
      const x0 = C + Math.cos(a) * r0, y0 = C + Math.sin(a) * r0, x1 = C + Math.cos(a) * r1, y1 = C + Math.sin(a) * r1;
      const s = (r1 - r0) * 0.45;
      const nx = -Math.sin(a) * s, ny = Math.cos(a) * s;
      k.moveTo(x0, y0); k.quadraticCurveTo((x0 + x1) / 2 + nx, (y0 + y1) / 2 + ny, x1, y1);
      k.quadraticCurveTo((x0 + x1) / 2 - nx, (y0 + y1) / 2 - ny, x0, y0);
    }
  }, ink, 1.8);
  // polígono estrelado {n/k} no anel 3–4
  const n2 = folds * 2, step = folds % 2 ? 2 : 3;
  both((k) => {
    for (let i = 0; i <= n2; i++) {
      const a = ((i * step) / n2) * Math.PI * 2 - Math.PI / 2;
      const x = C + Math.cos(a) * rings[3], y = C + Math.sin(a) * rings[3];
      if (i === 0) k.moveTo(x, y); else k.lineTo(x, y);
    }
  }, ink, 2);
  // pequenos círculos no anel 4–5
  const dots = folds * 4;
  both((k) => { for (let i = 0; i < dots; i++) { const a = (i / dots) * Math.PI * 2; circle(k, C + Math.cos(a) * (rings[4] - 18), C + Math.sin(a) * (rings[4] - 18), 13); } }, ink, 1.5);
  // arcos de lótus por fora
  both((k) => {
    for (let i = 0; i < folds * 2; i++) {
      const a0 = (i / (folds * 2)) * Math.PI * 2, a1 = ((i + 1) / (folds * 2)) * Math.PI * 2;
      const am = (a0 + a1) / 2;
      k.moveTo(C + Math.cos(a0) * rings[4], C + Math.sin(a0) * rings[4]);
      k.quadraticCurveTo(C + Math.cos(am) * (rings[5] + 22), C + Math.sin(am) * (rings[5] + 22), C + Math.cos(a1) * rings[4], C + Math.sin(a1) * rings[4]);
    }
  }, ink, 2);
  // cor: um anel de pontos e as pétalas internas em uma das cores da assinatura
  const acc = accents[seed % 3];
  c.fillStyle = acc;
  for (let i = 0; i < folds * 2; i++) {
    const a = (i / (folds * 2)) * Math.PI * 2 + Math.PI / (folds * 2);
    c.beginPath(); c.arc(C + Math.cos(a) * (rings[2] + 30), C + Math.sin(a) * (rings[2] + 30), 7, 0, Math.PI * 2); c.fill();
  }
  c.beginPath(); c.arc(C, C, 10, 0, Math.PI * 2); c.fillStyle = acc; c.fill();
  // raios finos
  both((k) => { for (let i = 0; i < folds; i++) { const a = (i / folds) * Math.PI * 2; k.moveTo(C + Math.cos(a) * rings[2], C + Math.sin(a) * rings[2]); k.lineTo(C + Math.cos(a) * rings[5], C + Math.sin(a) * rings[5]); } }, ink, 1);
  return { color: cv, metal: gold ? mk : undefined, aspect: 1, gold };
}

const flatCache = new Map<string, Flat>();
export function flatFor(kind: { type: "painting"; style: string; seed: number; w: number; h: number } | { type: "mandala"; seed: number; folds: number }): Flat {
  const key = kind.type === "painting" ? `p${kind.style}${kind.seed}` : `m${kind.seed}`;
  let f = flatCache.get(key);
  if (!f) {
    f = kind.type === "painting" ? painting(kind.style, kind.seed, kind.w, kind.h) : mandala(kind.seed, kind.folds);
    flatCache.set(key, f);
  }
  return f;
}

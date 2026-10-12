/* ════════════════════════════════════════════════════════════════════
   OS MATERIAIS — texturas sólidas em TSL (three.js, WebGPU e WebGL2).

   Nada de imagem: cada material é uma fórmula calculada pela posição do
   ponto no espaço do objeto (positionLocal). Por isso o veio do mármore
   e o anel da madeira atravessam todas as faces e peças, como se a obra
   tivesse saído de um bloco só, e nenhuma emenda aparece.

   Seis famílias, cada uma com variantes. Um material (um shader) por
   família; as cores e os números de cada variante, e a semente que muda
   o desenho de obra para obra, vão no próprio objeto (mesh.userData.mp) e
   chegam ao shader por uniforms "de objeto" (onObjectUpdate). Assim o
   three monta e compila cada família uma vez só (na abertura) e trocar
   o material de uma obra não custa nada:
     mármore  · bardiglio, carrara, calacatta, nero, verde, rosa, travertino…
     madeira  · carvalho, nogueira, freijó, ipê, cerejeira, pinus, ebanizada…
                × acabamento fosco, acetinado ou verniz brilhante
     vidro    · cristal, fumê, âmbar, cobalto, esmeralda, rosé, jateado, dicroico
     gesso    · branco, marfim, areia, cinza, cimento, terracota, rosa, azul
     metal    · aço escovado, inox polido, latão, bronze, cobre, ouro,
                alumínio, pátina verde, titânio anodizado, corten, aço negro
     laca     · as cores da assinatura (amarelo, magenta, ciano) e mais

   O relevo fino (fibra da madeira, grão do gesso, poros do travertino,
   escovado do metal) é um "bump" por derivadas de tela (Mikkelsen 2010):
   o BumpMapNode do three só aceita textura com UV, por isso `bump()`
   abaixo faz a conta direto com a altura procedural.
════════════════════════════════════════════════════════════════════ */
import { Color, DoubleSide, MeshPhysicalNodeMaterial, MeshStandardNodeMaterial, Vector3, type Object3D } from "three/webgpu";
import {
  Fn, uniform, vec3, float, positionLocal, positionView, normalView, faceDirection,
  mix, smoothstep, sin, abs, pow, clamp,
  positionViewDirection, fract, length, dot,
} from "three/tsl";
import type { Family, Finish, MaterialChoice, T } from "../data/works";
import { fbm, nA, nB, nC, nD, turb } from "./noise";

// os tipos do TSL não acompanham bem as contas encadeadas: um tipo solto basta aqui
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type N = any;
type N3 = N;

/* ── relevo procedural ──
   n' = normalize(|det|·n − sign(det)·(dh/dx·R1 + dh/dy·R2)), com h em
   unidades do objeto: o relevo tem o mesmo tamanho de perto e de longe. */
const bump = Fn(([h]: [N]) => {
  const dpdx = positionView.dFdx(), dpdy = positionView.dFdy();
  const n = normalView;
  const r1 = dpdy.cross(n), r2 = n.cross(dpdx);
  const det = dpdx.dot(r1).mul(faceDirection);
  const grad = det.sign().mul(h.dFdx().mul(r1).add(h.dFdy().mul(r2)));
  return det.abs().mul(n).sub(grad).normalize();
});

const S = (pt: string, en: string): T => ({ pt, en });

export interface Variant { id: string; label: T; swatch: string; [k: string]: unknown }

/* ── parâmetros por objeto ──
   P("base", cor) cria um uniform que, antes de desenhar cada objeto, lê
   object.userData.mp.base. Sem valor no objeto, fica o padrão. */
export type MP = Record<string, number | Color | Vector3>;
function P(key: string, init: number | Color | Vector3): N {
  return (uniform(init as never) as N).onObjectUpdate(({ object }: { object: Object3D }) => (object.userData.mp as MP | undefined)?.[key] ?? init);
}
const C = () => new Color();

/* ════════════════ MÁRMORE ════════════════ */
interface Marble extends Variant { base: string; cloud: string; vein: string; vein2?: string; veins: number; sharp: number; turb: number; scale: number; rough: number; bands?: number; pits?: number }
export const MARBLES: Marble[] = [
  { id: "bardiglio", label: S("Bardiglio", "Bardiglio"), swatch: "#a6abb2", base: "#a3a9b1", cloud: "#7f8790", vein: "#454c55", vein2: "#c3c7cc", veins: 1, sharp: 9, turb: 3.2, scale: 1.25, rough: 0.34 },
  { id: "bardiglio-claro", label: S("Bardiglio claro", "Light Bardiglio"), swatch: "#bcc0c6", base: "#c3c7cc", cloud: "#a4aab2", vein: "#5d646d", vein2: "#dadcdf", veins: 0.85, sharp: 10, turb: 3, scale: 1.3, rough: 0.32 },
  { id: "carrara", label: S("Carrara", "Carrara"), swatch: "#e6e5e1", base: "#e9e8e4", cloud: "#d6d6d4", vein: "#9a9fa6", veins: 0.7, sharp: 7, turb: 2.6, scale: 1.1, rough: 0.22 },
  { id: "calacatta", label: S("Calacatta", "Calacatta"), swatch: "#efebe3", base: "#f1eee8", cloud: "#e6e0d5", vein: "#7d7364", vein2: "#b49a6c", veins: 1, sharp: 4, turb: 4.2, scale: 0.75, rough: 0.18 },
  { id: "nero", label: S("Nero Marquina", "Nero Marquina"), swatch: "#1b1b1e", base: "#161619", cloud: "#26262a", vein: "#e9e6e0", veins: 0.9, sharp: 12, turb: 3.4, scale: 1.2, rough: 0.16 },
  { id: "verde", label: S("Verde Guatemala", "Verde Guatemala"), swatch: "#264a3b", base: "#1f3d31", cloud: "#2f5a48", vein: "#d4e2d8", vein2: "#0f2219", veins: 0.95, sharp: 10, turb: 4, scale: 1.5, rough: 0.2 },
  { id: "rosa", label: S("Rosa Portogallo", "Rosa Portogallo"), swatch: "#e0bfb3", base: "#e4c6bb", cloud: "#d3a797", vein: "#f7eee9", vein2: "#b57f70", veins: 0.8, sharp: 6, turb: 3, scale: 1.1, rough: 0.24 },
  { id: "travertino", label: S("Travertino", "Travertine"), swatch: "#d8c6a5", base: "#dccbab", cloud: "#c4ad86", vein: "#a88f68", veins: 0.25, sharp: 3, turb: 1.2, scale: 1.4, rough: 0.6, bands: 1, pits: 1 },
  { id: "azul-bahia", label: S("Azul Bahia", "Azul Bahia"), swatch: "#355d8f", base: "#2f5688", cloud: "#4a77ad", vein: "#e7edf2", vein2: "#1b3256", veins: 0.8, sharp: 5, turb: 4.5, scale: 1.7, rough: 0.2 },
];

/** os dois programas de pedra: mármore e travertino (com camadas e poros) */
function stone(trav: boolean) {
  const m = new MeshPhysicalNodeMaterial({ metalness: 0 });
  const u = {
    base: P("base", C()), cloud: P("cloud", C()), vein: P("vein", C()), vein2: P("vein2", C()),
    veins: P("veins", 1), sharp: P("sharp", 9), turb: P("turb", 3), scale: P("scale", 1.2), seed: P("seed", new Vector3()), rough: P("rough", 0.3), cc: P("cc", 0),
  };
  const p = positionLocal.mul(u.scale).add(u.seed);
  const cloud = fbm(p.mul(0.9), 5).mul(0.5).add(0.5).toVar();
  // turbulência de Perlin (soma de |ruído|): os vincos agudos é que fazem o veio parecer pedra
  const tb = turb(p.mul(0.7), 6).toVar();
  const f1 = abs(sin(p.x.mul(0.9).add(p.y.mul(0.6)).add(p.z.mul(0.25)).add(tb.mul(u.turb.mul(0.85))).mul(3.14159))).toVar();
  const v1 = pow(float(1).sub(f1), u.sharp.mul(1.5));
  // halo de calcita: uma faixa mais clara e larga em volta do veio
  const halo = pow(float(1).sub(f1), u.sharp.mul(0.35)).mul(0.22);
  // veios capilares, noutra direção, que aparecem e somem
  const f2 = abs(sin(p.y.mul(2.3).sub(p.x.mul(1.1)).add(p.z.mul(0.7)).add(tb.mul(u.turb.mul(1.25))).add(3.7).mul(3.14159)));
  const v2 = pow(float(1).sub(f2), u.sharp.mul(6)).mul(smoothstep(-0.1, 0.45, nB(p.mul(0.9).add(4.4)))).mul(0.75);
  // trincas: aparecem e somem ao longo do caminho (nada de laço fechado)
  const q = p.mul(4.2).add(tb.mul(1.6));
  const c1 = pow(float(1).sub(abs(nC(q))), u.sharp.mul(7)).mul(smoothstep(0.05, 0.55, nA(p.mul(1.15).add(9.7)))).mul(0.6);
  // grão: a textura fina que aparece de perto
  const grain = fbm(p.mul(16), 3).mul(0.05).add(nD(p.mul(70)).mul(0.035));
  const veinMask = clamp(v1.add(v2).add(c1).mul(u.veins), 0, 1).toVar();
  let col: N3 = mix(u.base, u.cloud, smoothstep(0.25, 0.95, cloud)).mul(float(1).add(grain));
  col = mix(col, u.vein2, halo.mul(u.veins));
  col = mix(col, u.vein, veinMask);
  let rough: N = u.rough.add(veinMask.mul(0.08));
  if (trav) {
    const band = sin(p.y.mul(9).add(nA(p.mul(vec3(1.5, 0.3, 1.5))).mul(2))).mul(0.5).add(0.5);
    const pit = smoothstep(0.5, 0.72, nD(p.mul(vec3(5, 9, 5))));
    col = mix(col, u.cloud, band.mul(0.45));
    col = mix(col, col.mul(0.55), pit);
    rough = rough.add(pit.mul(0.3));
    m.normalNode = bump(pit.mul(-0.006).add(band.mul(0.0015)));
  }
  m.colorNode = col;
  m.roughnessNode = rough;
  m.clearcoatNode = u.cc;
  m.clearcoatRoughnessNode = float(0.12);
  return m;
}
const stoneParams = (v: Marble, seed: Vector3): MP => ({
  base: new Color(v.base), cloud: new Color(v.cloud), vein: new Color(v.vein), vein2: new Color(v.vein2 ?? v.vein),
  veins: v.veins, sharp: v.sharp, turb: v.turb, scale: v.scale, seed, rough: v.rough, cc: v.rough < 0.25 ? 0.4 : 0,
});

/* ════════════════ MADEIRA ════════════════ */
interface Wood extends Variant { early: string; late: string; rings: number; contrast: number; scale: number; pores: number }
export const WOODS: Wood[] = [
  { id: "carvalho", label: S("Carvalho", "Oak"), swatch: "#b8895a", early: "#c69c6d", late: "#8d6440", rings: 9, contrast: 0.75, scale: 1, pores: 1 },
  { id: "nogueira", label: S("Nogueira", "Walnut"), swatch: "#6b4a33", early: "#7c5a3f", late: "#3f2b1d", rings: 7, contrast: 0.85, scale: 1, pores: 0.7 },
  { id: "freijo", label: S("Freijó", "Freijó"), swatch: "#a8875f", early: "#b89770", late: "#80603f", rings: 8, contrast: 0.6, scale: 1, pores: 0.8 },
  { id: "ipe", label: S("Ipê", "Ipê"), swatch: "#6f4a2f", early: "#82593a", late: "#4d2f1c", rings: 12, contrast: 0.55, scale: 1, pores: 0.4 },
  { id: "cerejeira", label: S("Cerejeira", "Cherry"), swatch: "#b06d47", early: "#bf7a50", late: "#8a4d2e", rings: 8, contrast: 0.5, scale: 1, pores: 0.3 },
  { id: "pinus", label: S("Pinus", "Pine"), swatch: "#dcbf92", early: "#e6cda3", late: "#b98a57", rings: 5, contrast: 1, scale: 1, pores: 0.2 },
  { id: "freixo-claro", label: S("Freixo claro", "Pale ash"), swatch: "#e0d4bf", early: "#e8ddc9", late: "#c2b091", rings: 8, contrast: 0.8, scale: 1, pores: 0.9 },
  { id: "ebanizada", label: S("Ebanizada", "Ebonised"), swatch: "#241d19", early: "#2c241f", late: "#141110", rings: 9, contrast: 0.6, scale: 1, pores: 0.8 },
];
export const FINISHES: { id: Finish; label: T }[] = [
  { id: "fosco", label: S("fosco", "matte") },
  { id: "acetinado", label: S("acetinado", "satin") },
  { id: "brilhante", label: S("verniz brilhante", "gloss varnish") },
];
const FINISH: Record<Finish, { rough: number; cc: number; ccr: number }> = {
  fosco: { rough: 0.78, cc: 0, ccr: 0.5 },
  acetinado: { rough: 0.55, cc: 0.4, ccr: 0.32 },
  brilhante: { rough: 0.45, cc: 1, ccr: 0.05 },
};

function wood() {
  const m = new MeshPhysicalNodeMaterial({ metalness: 0 });
  const u = {
    early: P("early", C()), late: P("late", C()), rings: P("rings", 8), contrast: P("contrast", 0.7), seed: P("seed", new Vector3()),
    pores: P("pores", 0.5), rough: P("rough", 0.6), cc: P("cc", 0), ccr: P("ccr", 0.3), relief: P("relief", 0.0004),
  };
  // o tronco é vertical (eixo Y); o centro dele fica fora da peça, por isso os anéis são arcos largos
  const p = positionLocal.add(u.seed.mul(vec3(1, 3, 1))).toVar();
  const axis = p.xz.add(vec3(2.3, 0, -1.7).xz);
  const d = fbm(p.mul(vec3(0.7, 0.12, 0.7)), 3);
  const r = length(axis).add(d.mul(0.35)).mul(u.rings);
  const ring = fract(r).toVar();
  // lenho inicial claro, lenho tardio escuro, com a transição mais dura de um lado
  const prof = smoothstep(0.0, 0.62, ring).mul(smoothstep(1.0, 0.86, ring));
  const fiber = nD(p.mul(vec3(70, 2.2, 70))).toVar();
  const streak = nB(p.mul(vec3(9, 0.5, 9)));
  let col: N3 = mix(u.late, u.early, mix(float(1), prof, u.contrast));
  col = col.mul(float(1).add(fiber.mul(0.07)).add(streak.mul(0.08)));
  // poros abertos (carvalho, freixo): riscos finos e escuros ao longo do veio
  const pore = smoothstep(0.45, 0.8, nC(p.mul(vec3(260, 6, 260)))).mul(u.pores);
  col = mix(col, u.late.mul(0.55), pore.mul(0.35));
  m.colorNode = col;
  m.roughnessNode = u.rough;
  m.clearcoatNode = u.cc;
  m.clearcoatRoughnessNode = u.ccr;
  m.normalNode = bump(fiber.mul(0.0012).sub(pore.mul(0.0016)).add(prof.mul(u.relief)));
  return m;
}
const woodParams = (v: Wood, finish: Finish, seed: Vector3): MP => {
  const f = FINISH[finish];
  return { early: new Color(v.early), late: new Color(v.late), rings: v.rings, contrast: v.contrast, pores: v.pores, seed, rough: f.rough, cc: f.cc, ccr: f.ccr, relief: finish === "fosco" ? 0.0008 : 0.0003 };
};

/* ════════════════ VIDRO ════════════════ */
interface Glass extends Variant { tint: string; minA: number; maxA: number; rough: number; irid?: number }
export const GLASSES: Glass[] = [
  { id: "cristal", label: S("Cristal", "Crystal"), swatch: "#dfe9ee", tint: "#e4f0f3", minA: 0.16, maxA: 0.9, rough: 0.02 },
  { id: "fume", label: S("Fumê", "Smoked"), swatch: "#55595e", tint: "#3d4247", minA: 0.35, maxA: 0.92, rough: 0.03 },
  { id: "ambar", label: S("Âmbar", "Amber"), swatch: "#d58a2a", tint: "#e08a1c", minA: 0.3, maxA: 0.92, rough: 0.03 },
  { id: "cobalto", label: S("Cobalto", "Cobalt"), swatch: "#2848b8", tint: "#2a49c9", minA: 0.35, maxA: 0.94, rough: 0.03 },
  { id: "esmeralda", label: S("Esmeralda", "Emerald"), swatch: "#1d8a5c", tint: "#1a9a63", minA: 0.32, maxA: 0.93, rough: 0.03 },
  { id: "rose", label: S("Rosé", "Rosé"), swatch: "#e59bb6", tint: "#f08db5", minA: 0.22, maxA: 0.9, rough: 0.03 },
  { id: "jateado", label: S("Jateado", "Frosted"), swatch: "#e9ecee", tint: "#f3f5f6", minA: 0.5, maxA: 0.9, rough: 0.5 },
  { id: "dicroico", label: S("Dicroico", "Dichroic"), swatch: "#8fb7d9", tint: "#c9dcef", minA: 0.3, maxA: 0.96, rough: 0.02, irid: 1 },
];

function glass() {
  const m = new MeshPhysicalNodeMaterial({ metalness: 0, transparent: true, side: DoubleSide, ior: 1.5, specularIntensity: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [180, 900] });
  const u = { tint: P("tint", C()), minA: P("minA", 0.2), maxA: P("maxA", 0.9), rough: P("rough", 0.03), irid: P("irid", 0), frost: P("frost", 0), cc: P("cc", 1) };
  // a borda reflete mais e "fecha"; o miolo deixa ver o fundo (a página atrás do canvas)
  const fres = pow(float(1).sub(abs(dot(normalView, positionViewDirection))), 2.2);
  m.colorNode = u.tint;
  m.opacityNode = mix(u.minA, u.maxA, fres);
  m.roughnessNode = u.rough;
  m.iridescenceNode = u.irid;
  m.clearcoatNode = u.cc;
  m.clearcoatRoughnessNode = float(0.02);
  m.normalNode = bump(nD(positionLocal.mul(180)).mul(u.frost.mul(0.0005)));
  m.depthWrite = false;
  return m;
}
const glassParams = (v: Glass): MP => ({ tint: new Color(v.tint), minA: v.minA, maxA: v.maxA, rough: v.rough, irid: v.irid ?? 0, frost: v.rough > 0.3 ? 1 : 0, cc: v.rough > 0.3 ? 0 : 1 });

/* ════════════════ GESSO ════════════════ */
interface Plaster extends Variant { color: string }
export const PLASTERS: Plaster[] = [
  { id: "branco", label: S("Branco", "White"), swatch: "#eeece7", color: "#efede8" },
  { id: "marfim", label: S("Marfim", "Ivory"), swatch: "#e8dfcb", color: "#ebe2ce" },
  { id: "areia", label: S("Areia", "Sand"), swatch: "#e2d3b2", color: "#e4d5b4" },
  { id: "cinza", label: S("Cinza", "Grey"), swatch: "#bab9b4", color: "#bdbcb7" },
  { id: "cimento", label: S("Cimento queimado", "Burnished cement"), swatch: "#7c7d7e", color: "#808183" },
  { id: "terracota", label: S("Terracota", "Terracotta"), swatch: "#bf7a5a", color: "#c27c5b" },
  { id: "rosa", label: S("Rosa", "Pink"), swatch: "#e5c5bb", color: "#e7c8be" },
  { id: "azul", label: S("Azul-cinza", "Blue grey"), swatch: "#b8c5d1", color: "#bac7d3" },
];

function plaster() {
  const m = new MeshPhysicalNodeMaterial({ roughness: 0.92, metalness: 0, sheen: 0.35, sheenRoughness: 0.8, sheenColor: new Color("#ffffff") });
  const u = { color: P("color", C()), seed: P("seed", new Vector3()) };
  const p = positionLocal.add(u.seed);
  const blot = fbm(p.mul(1.6), 3);
  const grain = nD(p.mul(260)).toVar();
  const pore = smoothstep(0.55, 0.78, nC(p.mul(38)));
  m.colorNode = u.color.mul(float(1).add(blot.mul(0.035)).add(grain.mul(0.02)).sub(pore.mul(0.12)));
  m.normalNode = bump(grain.mul(0.00035).sub(pore.mul(0.0012)));
  return m;
}

/* ════════════════ METAL ════════════════ */
interface Metal extends Variant { color: string; rough: number; brushed?: number; patina?: number; irid?: number; rust?: number }
export const METALS: Metal[] = [
  { id: "aco-escovado", label: S("Aço escovado", "Brushed steel"), swatch: "#c3c6c9", color: "#c8cbce", rough: 0.32, brushed: 1 },
  { id: "inox-polido", label: S("Inox polido", "Polished steel"), swatch: "#d9dcdf", color: "#d4d7da", rough: 0.07 },
  { id: "latao", label: S("Latão", "Brass"), swatch: "#d3b26a", color: "#d9b867", rough: 0.24 },
  { id: "bronze", label: S("Bronze", "Bronze"), swatch: "#a87445", color: "#b07a48", rough: 0.36 },
  { id: "cobre", label: S("Cobre", "Copper"), swatch: "#c98159", color: "#d08860", rough: 0.26 },
  { id: "ouro", label: S("Ouro", "Gold"), swatch: "#e5c26b", color: "#f0c96c", rough: 0.16 },
  { id: "aluminio", label: S("Alumínio jateado", "Bead-blasted aluminium"), swatch: "#cfd1d3", color: "#d3d5d7", rough: 0.5 },
  { id: "patina", label: S("Pátina verde", "Verdigris"), swatch: "#5d9b86", color: "#9b6b3e", rough: 0.4, patina: 1 },
  { id: "titanio", label: S("Titânio anodizado", "Anodised titanium"), swatch: "#8f86b4", color: "#a9a49c", rough: 0.22, irid: 1 },
  { id: "corten", label: S("Aço corten", "Corten steel"), swatch: "#7c4126", color: "#7f4426", rough: 0.85, rust: 1 },
  { id: "aco-negro", label: S("Aço negro", "Blackened steel"), swatch: "#2d2d2f", color: "#2c2c2e", rough: 0.38, brushed: 0.6 },
];

/** metal liso ou escovado (com iridescência para o titânio) */
function metalBright() {
  const m = new MeshPhysicalNodeMaterial({ metalness: 1, iridescenceIOR: 1.9, iridescenceThicknessRange: [300, 420] });
  const u = { color: P("color", C()), rough: P("rough", 0.3), brushed: P("brushed", 0), irid: P("irid", 0), seed: P("seed", new Vector3()) };
  const p = positionLocal.add(u.seed).toVar();
  // escovado: riscos longos numa direção só; a rugosidade muda de risco a risco
  const s = nD(p.mul(vec3(1.5, 900, 900))).toVar();
  const n = fbm(p.mul(3), 2);
  m.roughnessNode = u.rough.add(s.mul(u.brushed.mul(0.08))).add(n.mul(0.04));
  m.colorNode = u.color.mul(float(1).add(s.mul(u.brushed.mul(0.04))));
  m.iridescenceNode = u.irid;
  m.normalNode = bump(s.mul(u.brushed.mul(0.00012)));
  return m;
}
/** metal envelhecido: pátina verde (bronze) ou ferrugem (corten) */
function metalAged() {
  const m = new MeshPhysicalNodeMaterial({ metalness: 1 });
  const u = { color: P("color", C()), rough: P("rough", 0.4), patina: P("patina", 0), rust: P("rust", 0), seed: P("seed", new Vector3()) };
  const p = positionLocal.add(u.seed).toVar();
  const n = fbm(p.mul(2.8), 4).toVar();
  const fine = nD(p.mul(170)).toVar();
  // pátina: o verde nasce nas manchas; onde há pátina deixa de ser metal
  const mask = smoothstep(0.0, 0.42, n).mul(0.92).mul(u.patina).toVar();
  const verd = mix(vec3(0.12, 0.3, 0.24), vec3(0.32, 0.55, 0.46), smoothstep(0.2, 0.7, n));
  const rustCol = mix(vec3(0.33, 0.12, 0.05), vec3(0.55, 0.24, 0.1), n.mul(0.5).add(0.5)).mul(float(1).add(fine.mul(0.1)));
  let col: N3 = mix(u.color, verd, mask);
  col = mix(col, rustCol, u.rust);
  m.colorNode = col;
  m.metalnessNode = float(1).sub(mask).mul(float(1).sub(u.rust.mul(0.85)));
  m.roughnessNode = mix(mix(u.rough, float(0.85), mask), float(0.88), u.rust);
  m.normalNode = bump(mask.mul(0.0015).add(fine.mul(mix(float(0.0003), float(0.0007), u.rust))).add(n.mul(u.rust.mul(0.0012))));
  return m;
}
const metalParams = (v: Metal, seed: Vector3): MP => ({ color: new Color(v.color), rough: v.rough, brushed: v.brushed ?? 0, irid: v.irid ?? 0, patina: v.patina ?? 0, rust: v.rust ?? 0, seed });

/* ════════════════ LACA ════════════════ */
interface Lacquer extends Variant { color: string }
export const LACQUERS: Lacquer[] = [
  { id: "amarelo", label: S("Amarelo", "Yellow"), swatch: "#fce818", color: "#fce818" },
  { id: "magenta", label: S("Magenta", "Magenta"), swatch: "#c42c8c", color: "#c42c8c" },
  { id: "ciano", label: S("Ciano", "Cyan"), swatch: "#6cc8d8", color: "#6cc8d8" },
  { id: "vermelho", label: S("Vermelho", "Red"), swatch: "#c3262e", color: "#c3262e" },
  { id: "laranja", label: S("Laranja", "Orange"), swatch: "#e8742a", color: "#e8742a" },
  { id: "ultramar", label: S("Ultramar", "Ultramarine"), swatch: "#24359a", color: "#26389e" },
  { id: "verde", label: S("Verde", "Green"), swatch: "#1d6a4c", color: "#1d6a4c" },
  { id: "preto", label: S("Preto piano", "Piano black"), swatch: "#0e0e10", color: "#0d0d0f" },
  { id: "branco", label: S("Branco", "White"), swatch: "#f3f2ee", color: "#f3f2ee" },
];

function lacquer() {
  const m = new MeshPhysicalNodeMaterial({ roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.035 });
  const u = { color: P("color", C()), seed: P("seed", new Vector3()) };
  // casca de laranja: ondulação mínima do verniz, só aparece no reflexo
  m.clearcoatNormalNode = bump(nA(positionLocal.add(u.seed).mul(55)).mul(0.00012));
  m.colorNode = u.color;
  return m;
}

/* ════════════════ registro ════════════════ */
export const FAMILIES: Record<Family, { label: T; variants: Variant[]; finishes?: boolean }> = {
  marmore: { label: S("Mármore", "Marble"), variants: MARBLES },
  madeira: { label: S("Madeira", "Wood"), variants: WOODS, finishes: true },
  vidro: { label: S("Vidro", "Glass"), variants: GLASSES },
  gesso: { label: S("Gesso", "Plaster"), variants: PLASTERS },
  metal: { label: S("Metal", "Metal"), variants: METALS },
  laca: { label: S("Laca", "Lacquer"), variants: LACQUERS },
};

export const variantOf = (c: MaterialChoice): Variant =>
  FAMILIES[c.family].variants.find((v) => v.id === c.variant) ?? FAMILIES[c.family].variants[0];

export const materialLabel = (c: MaterialChoice, lang: "pt" | "en"): string => {
  const v = variantOf(c);
  const fin = c.family === "madeira" ? FINISHES.find((f) => f.id === (c.finish ?? "acetinado"))?.label[lang] : "";
  const fam = FAMILIES[c.family].label[lang].toLowerCase();
  return [fam, v.label[lang].toLowerCase(), fin].filter(Boolean).join(" · ");
};

/* um material por programa, criado na primeira vez */
const programs = new Map<string, MeshPhysicalNodeMaterial>();
const program = (k: string, make: () => MeshPhysicalNodeMaterial) => {
  let m = programs.get(k);
  if (!m) { m = make(); m.name = k; programs.set(k, m); }
  return m;
};

/** o material (compartilhado) e os parâmetros (do objeto) de uma escolha */
export function makeMaterial(c: MaterialChoice, seedKey = ""): { material: MeshPhysicalNodeMaterial; params: MP } {
  let h = 2166136261;
  for (const ch of seedKey) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const r = (k: number) => (((h >>> (k * 5)) & 1023) / 1023) * 40 - 20;
  const seed = new Vector3(r(0), r(1), r(2));
  const v = variantOf(c) as never;
  switch (c.family) {
    case "marmore": {
      const trav = c.variant === "travertino";
      return { material: program(trav ? "travertino" : "marmore", () => stone(trav)), params: stoneParams(v, seed) };
    }
    case "madeira": return { material: program("madeira", wood), params: woodParams(v, c.finish ?? "acetinado", seed) };
    case "vidro": return { material: program("vidro", glass), params: glassParams(v) };
    case "gesso": return { material: program("gesso", plaster), params: { color: new Color((v as Plaster).color), seed } };
    case "metal": {
      const aged = !!((v as Metal).patina || (v as Metal).rust);
      return { material: program(aged ? "metal-velho" : "metal", aged ? metalAged : metalBright), params: metalParams(v, seed) };
    }
    default: return { material: program("laca", lacquer), params: { color: new Color((v as Lacquer).color), seed } };
  }
}

/* ── luz das luminárias: núcleo aceso (vidro leitoso) e o halo em volta ── */
export const lampPower = uniform(1);
export function glowMaterial() {
  const m = new MeshStandardNodeMaterial({ roughness: 0.6, metalness: 0 });
  const warm = vec3(1.0, 0.82, 0.58);
  const fres = pow(float(1).sub(abs(dot(normalView, positionViewDirection))), 1.5);
  m.colorNode = mix(vec3(0.92, 0.9, 0.86), warm, lampPower.mul(0.6));
  m.emissiveNode = warm.mul(lampPower.mul(float(2.6).sub(fres.mul(1.4))));
  return m;
}

/* ════════════════════════════════════════════════════════════════════
   A PEÇA: monta o objeto 3D de uma obra (escultura, luminária, pintura ou
   mandala) com o material escolhido. Os objetos são baratos (geometria e
   material são compartilhados); cada vista da página ganha o seu.
════════════════════════════════════════════════════════════════════ */
import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, Group, Mesh, MeshPhysicalNodeMaterial, SRGBColorSpace,
  Sprite, SpriteNodeMaterial, LinearSRGBColorSpace, Object3D, AdditiveBlending,
} from "three/webgpu";
import { bumpMap, texture, float, vec3, uv, length, pow, max, mix } from "three/tsl";
import type { MaterialChoice, Work } from "../data/works";
import { build } from "./sculptures";
import { glowMaterial, lampPower, makeMaterial } from "./materials";
import { flatFor } from "./flat";

export const defaultMaterial = (w: Work): MaterialChoice => w.material ?? { family: "marmore", variant: "bardiglio" };

let glowMat: ReturnType<typeof glowMaterial> | null = null;
let haloMat: SpriteNodeMaterial | null = null;

function halo() {
  if (!haloMat) {
    haloMat = new SpriteNodeMaterial({ transparent: true, depthWrite: false });
    const d = length(uv().sub(0.5)).mul(2);
    const a = pow(max(float(0), float(1).sub(d)), 2.2).mul(lampPower).mul(0.5);
    haloMat.colorNode = vec3(1.0, 0.78, 0.5);
    haloMat.opacityNode = a;
    haloMat.blending = AdditiveBlending;
  }
  return haloMat;
}

const flatMats = new Map<string, MeshPhysicalNodeMaterial>();
const sideMat = new MeshPhysicalNodeMaterial({ color: new Color("#d6ccb9"), roughness: 0.9 });

function flatFront(w: Work): MeshPhysicalNodeMaterial {
  const hit = flatMats.get(w.slug);
  if (hit) return hit;
  const f = flatFor(w.kind as never);
  const ct = new CanvasTexture(f.color);
  ct.colorSpace = SRGBColorSpace;
  ct.anisotropy = 8;
  const m = new MeshPhysicalNodeMaterial({ roughness: 0.62, metalness: 0, clearcoat: 0.18, clearcoatRoughness: 0.35 });
  m.colorNode = texture(ct);
  if (f.height) {
    const ht = new CanvasTexture(f.height);
    ht.colorSpace = LinearSRGBColorSpace;
    // a tinta grossa brilha mais (o óleo seca acetinado)
    m.normalNode = bumpMap(texture(ht).r, float(0.9));
    m.roughnessNode = float(0.7).sub(texture(ht).r.mul(0.35));
  }
  if (f.metal) {
    const mt = new CanvasTexture(f.metal);
    mt.colorSpace = LinearSRGBColorSpace;
    const k = texture(mt).r;
    m.metalnessNode = k;
    m.roughnessNode = mix(float(0.8), float(0.22), k);
    m.colorNode = mix(texture(ct).rgb, vec3(0.86, 0.68, 0.32), k);
    m.normalNode = bumpMap(k, float(0.6));
  }
  flatMats.set(w.slug, m);
  return m;
}

export function makePiece(w: Work, choice?: MaterialChoice): Object3D {
  const g = new Group();
  g.name = w.slug;
  if (w.kind.type === "sculpture") {
    const b = build(w.kind.gen);
    const { material, params } = makeMaterial(choice ?? defaultMaterial(w), w.slug);
    const mesh = new Mesh(b.main, material);
    mesh.userData.mp = params;
    mesh.castShadow = mesh.receiveShadow = !material.transparent;
    g.add(mesh);
    if (b.glow) {
      glowMat ??= glowMaterial();
      const core = new Mesh(b.glow, glowMat);
      g.add(core);
      const s = new Sprite(halo());
      s.scale.setScalar(1.9);
      s.position.copy(b.glowAt!);
      g.add(s);
      g.userData.lamp = true;
    }
  } else {
    const f = flatFor(w.kind as never);
    const front = flatFront(w);
    const k = 2 / Math.hypot(f.aspect, 1); // a diagonal vale 2: raio 1, como as esculturas
    const W = f.aspect * k, H = k;
    if (w.kind.type === "painting" && w.kind.round) {
      const geo = new CylinderGeometry(W / 2, W / 2, 0.06, 96, 1);
      geo.rotateX(Math.PI / 2);
      const mesh = new Mesh(geo, [sideMat, front, sideMat]);
      mesh.castShadow = mesh.receiveShadow = true;
      g.add(mesh);
    } else {
      const d = w.kind.type === "painting" ? 0.07 : 0.035;
      const mesh = new Mesh(new BoxGeometry(W, H, d), [sideMat, sideMat, sideMat, sideMat, front, sideMat]);
      mesh.castShadow = mesh.receiveShadow = true;
      g.add(mesh);
    }
    g.userData.flat = true;
  }
  return g;
}

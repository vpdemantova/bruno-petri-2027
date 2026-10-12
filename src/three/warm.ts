/* As peças que a abertura compila de antemão: uma caixinha por programa
   de material (cada família tem um ou dois), uma luminária acesa, uma
   pintura e as duas mandalas (ouro e nanquim). */
import { BoxGeometry, Mesh, type Object3D } from "three/webgpu";
import { WORKS, WORK_BY_SLUG, type Family } from "../data/works";
import { FAMILIES, makeMaterial } from "./materials";
import { makePiece } from "./piece";

export function warmPieces(): Object3D[] {
  const geo = new BoxGeometry(0.1, 0.1, 0.1);
  const out: Object3D[] = [];
  const seen = new Set<string>();
  for (const f of Object.keys(FAMILIES) as Family[]) {
    for (const v of FAMILIES[f].variants) {
      const { material, params } = makeMaterial({ family: f, variant: v.id }, "aquecer");
      if (seen.has(material.name)) continue;
      seen.add(material.name);
      const m = new Mesh(geo, material);
      m.userData.mp = params;
      m.castShadow = m.receiveShadow = !material.transparent;
      out.push(m);
    }
  }
  out.push(makePiece(WORK_BY_SLUG["halo"]));
  const painting = WORKS.find((w) => w.kind.type === "painting");
  if (painting) out.push(makePiece(painting));
  for (const w of WORKS.filter((w) => w.kind.type === "mandala").slice(0, 2)) out.push(makePiece(w));
  return out;
}

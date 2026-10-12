/* Uma obra 3D dentro da página: um <canvas> comum que o motor preenche.
   O canvas segue o CSS (cantos redondos, bordas, animações) e os botões
   por cima dele funcionam como em qualquer HTML. */
import { useEffect, useRef, useState } from "react";
import type { MaterialChoice, Work } from "../data/works";
import { engine, Slot, type Angle, type SlotConfig } from "../three/engine";
import { useStore } from "../app/store";
import { defaultMaterial } from "../three/piece";
import { materialLabel } from "../three/materials";

export interface Piece3DProps {
  work: Work;
  material?: MaterialChoice;
  angle?: Angle;
  mode?: "live" | "still";
  spin?: number;
  interactive?: boolean | "x";
  flightKey?: string | string[];
  dpr?: number;
  lamp?: number;
  className?: string;
  /** recebe a vista (para o Spyglass mexer na câmera) */
  onSlot?: (s: Slot | null) => void;
  label?: string;
}

export function Piece3D(p: Piece3DProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const slot = useRef<Slot | null>(null);
  const chosen = useStore((s) => s.mats[p.work.slug]);
  const lang = useStore((s) => s.lang);
  const material = p.material ?? chosen ?? (p.work.kind.type === "sculpture" ? defaultMaterial(p.work) : undefined);
  const [ready, setReady] = useState(false);
  const cfg: SlotConfig = {
    work: p.work, material, angle: p.angle, mode: p.mode ?? "still", spin: p.spin,
    interactive: p.interactive, flightKey: p.flightKey, dpr: p.dpr, lamp: p.lamp,
  };

  useEffect(() => {
    const el = ref.current!;
    const s = new Slot(el, cfg);
    s.onReady = () => setReady(true);
    slot.current = s;
    engine.register(s);
    // com o motor já aquecido, a vista nasce pronta (antes de o aviso existir)
    if (s.ready) setReady(true);
    p.onSlot?.(s);
    return () => { p.onSlot?.(null); engine.unregister(s); slot.current = null; };
    // a vista nasce uma vez; as mudanças passam pelo update abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    slot.current?.update(cfg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.work, material?.family, material?.variant, material?.finish, JSON.stringify(p.angle), p.mode, p.spin, p.lamp]);

  const alt = p.label ?? `${p.work.title[lang]}${material ? ` — ${materialLabel(material, lang)}` : ""}`;
  return (
    <canvas
      ref={ref}
      className={`piece3d ${ready ? "is-ready" : ""} ${p.interactive ? "is-interactive" : ""} ${p.className ?? ""}`}
      role="img"
      aria-label={alt}
      data-interactive={p.interactive === "x" ? "x" : p.interactive ? "xy" : undefined}
    />
  );
}

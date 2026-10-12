/* O logotipo "bruno petri": Lexend 600 em amarelo; o "n" é desenhado à
   mão (duas metades do n, magenta embaixo à esquerda e ciano em cima à
   direita, medidas na tela) e o pingo do "i" é magenta. */
import { motion, useReducedMotion } from "motion/react";

const MAG = "#C42C8C", CYA = "#6CC8D8";
// medidas em alturas-x (Lexend 600: altura-x = 0,531 em), tiradas da tela:
// magenta = haste esquerda que desce e vira um quarto de círculo até a base;
// ciano = um quarto de círculo que sobe acima da altura-x e desce na haste direita.
const t = 0.388; // espessura do traço
const mag = "M0 0 L0 0.311 A0.69 0.69 0 0 0 0.69 1 L0.69 0.612 A0.302 0.302 0 0 1 " + t + " 0.311 L" + t + " 0 Z";
const cya = "M0.757 -0.437 A0.66 0.66 0 0 1 1.417 0.223 L1.417 0.612 L1.029 0.612 L1.029 0.223 A0.272 0.272 0 0 0 0.757 -0.049 Z";

export function NGlyph({ animate = true }: { animate?: boolean }) {
  const rm = useReducedMotion();
  const anim = animate && !rm;
  return (
    <svg className="logo-n" viewBox="-0.02 -0.46 1.46 1.48" aria-hidden="true">
      <motion.path d={mag} fill={MAG}
        initial={anim ? { opacity: 0, x: -0.25, rotate: -30 } : false}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
 />
      <motion.path d={cya} fill={CYA}
        initial={anim ? { opacity: 0, x: 0.25, rotate: 30 } : false}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
 />
    </svg>
  );
}

export function Logo({ className = "", animate = true, as = "h1" }: { className?: string; animate?: boolean; as?: "h1" | "div" }) {
  const Tag = as;
  return (
    <Tag className={`logo ${className}`} aria-label="Bruno Petri">
      <span aria-hidden="true" className="logo-row">
        <span>br</span>
        <span className="logo-n-wrap"><NGlyph animate={animate} /></span>
        <span>o&nbsp;petr</span>
        <span className="logo-i">ı<i /></span>
      </span>
    </Tag>
  );
}

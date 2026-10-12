/* As peças repetidas da interface: link, painel preto que muda de lugar
   entre as páginas (layoutId "ink"), o menu de pílulas, a troca de idioma,
   os contatos, o filtro e as transições de texto. */
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { navigate } from "../app/router";
import { TXT, useLang } from "../app/i18n";
import { useStore } from "../app/store";
import { ARTIST } from "../data/artist";
import { Caret, Check } from "./Icons";

export const SPRING: Transition = { type: "spring", stiffness: 120, damping: 22, mass: 1 };
export const EASE = [0.7, 0, 0.2, 1] as const;
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/* ── mídia e medidas ── */
export function useMedia(q: string) {
  const [m, set] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const f = () => set(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}
export const MOBILE_Q = "(max-width: 899px), (max-aspect-ratio: 1/1)";
export const useMobile = () => useMedia(MOBILE_Q);

/** o raio dos painéis, no mesmo ritmo do CSS (--r-panel) */
export function useRadius() {
  const get = () => Math.round(Math.min(28, Math.max(16, innerWidth * 0.018)));
  const [r, set] = useState(get);
  useEffect(() => { const f = () => set(get()); addEventListener("resize", f); return () => removeEventListener("resize", f); }, []);
  return r;
}

/* ── link interno (History API) ── */
export function A({ href, children, onClick, ...rest }: { href: string; children: ReactNode; onClick?: (e: MouseEvent<HTMLAnchorElement>) => void } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "onClick">) {
  return (
    <a href={href} {...rest} onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || /^(mailto|https?):/.test(href)) return;
      e.preventDefault();
      navigate(href);
    }}>{children}</a>
  );
}

/* ── o painel preto ──
   Um só elemento com layoutId "ink": quando a página troca, ele desliza e
   muda de forma do lugar antigo para o novo (Home → Galeria: da esquerda
   para a direita; Galeria → Obra: vira o cartão do texto). */
export function Ink({ className = "", radius, style }: { className?: string; radius: [number, number, number, number]; style?: CSSProperties }) {
  const [tl, tr, br, bl] = radius;
  return (
    <motion.div
      layoutId="ink"
      className={`ink ${className}`}
      style={{ borderTopLeftRadius: tl, borderTopRightRadius: tr, borderBottomRightRadius: br, borderBottomLeftRadius: bl, ...style }}
      transition={{ layout: { type: "spring", stiffness: 70, damping: 17, mass: 1 } }}
      aria-hidden="true"
    />
  );
}

/* ── o menu de pílulas ── */
export type NavId = "home" | "galeria" | "loja" | "sobre";
const NAV: { id: NavId; href: string }[] = [
  { id: "home", href: "/" }, { id: "galeria", href: "/galeria" }, { id: "loja", href: "/loja" }, { id: "sobre", href: "/sobre" },
];
export function Nav({ active, theme, variant, className = "" }: { active?: NavId; theme: "dark" | "light"; variant: "row" | "stack" | "stack-left" | "corners" | "grid"; className?: string }) {
  const [lang, t] = useLang();
  const wish = useStore((s) => s.wish.length);
  return (
    <nav className={`nav nav-${variant} nav-${theme} ${className}`} aria-label={TXT.nav[lang]}>
      {NAV.map((n, i) => (
        <motion.div key={n.id} layoutId={`nav-${n.id}`} className={`nav-slot nav-slot-${i}`} transition={{ layout: { type: "spring", stiffness: 90, damping: 18 } }}>
          <A href={n.href} className={`pill ${active === n.id ? "is-on" : ""}`} aria-current={active === n.id ? "page" : undefined}>
            <span className="pill-txt">{t(TXT[n.id])}</span>
            {n.id === "loja" && wish > 0 && <span className="pill-badge" aria-label={`${wish} ${TXT.wish[lang].toLowerCase()}`}>{wish}</span>}
          </A>
        </motion.div>
      ))}
    </nav>
  );
}

/* ── pt-br / en ── */
export function LangSwitch({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const id = useId();
  return (
    <div className={`lang lang-${theme}`} role="group" aria-label="Idioma / Language">
      {(["pt", "en"] as const).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l === "pt" ? "pt-BR" : "en"}>
          {lang === l && <motion.span layoutId={`knob-${id}`} className="lang-knob" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
          <span className="lang-txt">{l === "pt" ? "pt-br" : "en"}</span>
        </button>
      ))}
    </div>
  );
}

/* ── EMAIL · INSTAGRAM ── (sem endereço ainda: levam ao contato da página Sobre) */
export function Contacts({ className = "", order = ["email", "instagram"] }: { className?: string; order?: ("email" | "instagram")[] }) {
  const items = {
    email: { label: "EMAIL", href: ARTIST.email ? `mailto:${ARTIST.email}` : "/sobre#contato" },
    instagram: { label: "INSTAGRAM", href: ARTIST.instagram || "/sobre#contato" },
  };
  return (
    <ul className={`contacts ${className}`}>
      {order.map((k) => (
        <li key={k}><A href={items[k].href} target={/^https?:/.test(items[k].href) ? "_blank" : undefined} rel="noreferrer"><i aria-hidden="true" />{items[k].label}</A></li>
      ))}
    </ul>
  );
}

/* ── troca de idioma animada: o texto sai e o outro entra ── */
export function Swap({ k, children, className = "", as = "span" }: { k: string; children: ReactNode; className?: string; as?: "span" | "div" | "p" }) {
  const rm = useReducedMotion();
  const M = motion[as];
  return (
    <AnimatePresence mode="wait" initial={false}>
      <M key={k} className={className}
        initial={rm ? { opacity: 0 } : { opacity: 0, y: "0.45em", filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={rm ? { opacity: 0 } : { opacity: 0, y: "-0.45em", filter: "blur(6px)" }}
        transition={{ duration: 0.32, ease: EASE_OUT }}>
        {children}
      </M>
    </AnimatePresence>
  );
}

/* ── entrada em cascata dos elementos de uma página ── */
export const rise = (i = 0, base = 0.35) => ({
  initial: { opacity: 0, y: 26 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT, delay: base + i * 0.07 } },
  exit: { opacity: 0, y: -14, transition: { duration: 0.28, ease: EASE } },
});
export const fade = (delay = 0.3) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.7, delay } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
});

/* ── o filtro "All ▼" / "Pieces ▼" ── */
export function Dropdown<V extends string>({ value, options, label, onChange, theme = "dark", up = true, className = "" }: {
  value: V; options: { id: V; label: string }[]; label: string; onChange: (v: V) => void; theme?: "dark" | "light"; up?: boolean; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const f = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("pointerdown", f); addEventListener("keydown", k);
    return () => { removeEventListener("pointerdown", f); removeEventListener("keydown", k); };
  }, [open]);
  return (
    <div ref={ref} className={`dd dd-${theme} ${up ? "dd-up" : ""} ${className}`}>
      <button type="button" className="pill pill-sm dd-btn" aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span>{label}</span><Caret className={`dd-caret ${open ? "is-open" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul id={id} role="listbox" className="dd-list"
            initial={{ opacity: 0, y: up ? 10 : -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: up ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}>
            {options.map((o, i) => (
              <motion.li key={o.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.03 * i } }}>
                <button type="button" role="option" aria-selected={o.id === value} onClick={() => { onChange(o.id); setOpen(false); }}>
                  <span>{o.label}</span>{o.id === value && <Check className="dd-check" />}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

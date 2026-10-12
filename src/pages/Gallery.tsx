/* GALERIA — à esquerda a obra do momento, enorme e cortada pela borda, e o
   menu; à direita o painel preto com a lista (carrossel vertical: roda,
   arrastar, setas ↑ ↓) ou a grade (cartões redondos com a seta). Embaixo,
   o filtro por tipo e a troca lista/grade. */
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, WORKS, lightCard, type Work } from "../data/works";
import { TXT, useLang } from "../app/i18n";
import { navigate } from "../app/router";
import { useStore } from "../app/store";
import { Piece3D } from "../ui/Piece3D";
import { FlatThumb } from "../ui/FlatThumb";
import { ArrowDisc, GridIcon, ListIcon } from "../ui/Icons";
import { A, Dropdown, EASE_OUT, Ink, Nav, Swap, fade, rise, useMobile, useRadius } from "../ui/kit";

export default function Gallery({ view }: { view: "lista" | "grade" }) {
  const [lang, t] = useLang();
  const present = useIsPresent();
  const mobile = useMobile();
  const R = useRadius();
  const cat = useStore((s) => s.cat);
  const setCat = useStore((s) => s.setCat);
  const idx = useStore((s) => s.galleryIndex);
  const setIdx = useStore((s) => s.setGalleryIndex);
  const works = useMemo(() => WORKS.filter((w) => cat === "all" || w.category === cat), [cat]);
  const i = Math.min(idx, works.length - 1);
  const [hover, setHover] = useState<Work | null>(null);
  const current = works[i] ?? WORKS[0];
  const decor = hover ?? current;
  const setView = (v: "lista" | "grade") => navigate(v === "grade" ? "/galeria?vista=grade" : "/galeria", { replace: true });
  const catLabel = CATEGORIES.find((c) => c.id === cat)!;

  return (
    <motion.main className={`pg pg-gal is-${view}`} id="conteudo" inert={!present} initial="initial" animate="animate" exit="exit">
      <div className="gal-decor" aria-hidden="true">
        <Piece3D work={decor} mode="live" spin={0.04} dpr={1.5}
          angle={mobile ? { theta: 0.2, phi: 1.5, zoom: 2.2, oy: -0.9 } : { theta: 0.35, phi: 1.45, zoom: 2.25, ox: -1.05 }}
          flightKey={`hero:${decor.slug}`} />
      </div>
      {!mobile && <motion.div {...fade(0.1)}><Nav theme="light" variant="stack" active="galeria" className="gal-nav" /></motion.div>}
      <section className="gal-panel" aria-label={t(TXT.galeria)}>
        <Ink className="gal-ink" radius={mobile ? [R, R, R, R] : [R, 0, 0, R]} />
        <AnimatePresence mode="wait" initial={false}>
          {view === "lista"
            ? <Carousel key={"l" + cat} works={works} index={i} setIndex={setIdx} />
            : <Grid key={"g" + cat} works={works} onHover={setHover} />}
        </AnimatePresence>
        <motion.div className="gal-tools" {...rise(3, 0.5)}>
          <Dropdown theme="dark" value={cat} label={cat === "all" ? (view === "lista" ? t(TXT.pieces) : t(TXT.all)) : catLabel.label[lang]}
            options={CATEGORIES.map((c) => ({ id: c.id, label: c.id === "all" ? `${t(TXT.all)} · ${c.label[lang]}` : c.label[lang] }))}
            onChange={(c) => { setCat(c); setIdx(0); }} />
          <button type="button" className="pill pill-sm pill-paper gal-toggle" onClick={() => setView(view === "lista" ? "grade" : "lista")}
            aria-label={view === "lista" ? t(TXT.grid) : t(TXT.list)}>
            <motion.span key={view} className="gal-toggle-in" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
              {view === "lista" ? <><GridIcon className="ico" /> {t(TXT.grid)}</> : <><ListIcon className="ico" /> {mobile ? t(TXT.listView) : t(TXT.list)}</>}
            </motion.span>
          </button>
        </motion.div>
      </section>
      {mobile && <motion.div className="gal-mnav" {...fade(0.2)}><Nav theme="light" variant="grid" active="galeria" /></motion.div>}
    </motion.main>
  );
}

/* ── a lista: carrossel vertical ── */
function Carousel({ works, index, setIndex }: { works: Work[]; index: number; setIndex: (i: number) => void }) {
  const [lang, t] = useLang();
  const rm = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const lock = useRef(0);
  const acc = useRef(0);
  const n = works.length;
  const step = (d: number) => setIndex((index + d + n) % n);

  useEffect(() => {
    const el = box.current!;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      acc.current += e.deltaY;
      if (now < lock.current) return;
      if (Math.abs(acc.current) > 40) { step(acc.current > 0 ? 1 : -1); acc.current = 0; lock.current = now + 420; }
    };
    let y0 = 0, x0 = 0, on = false;
    const down = (e: PointerEvent) => { if ((e.target as HTMLElement).closest("a,button")) return; on = true; y0 = e.clientY; x0 = e.clientX; };
    const up = (e: PointerEvent) => {
      if (!on) return;
      on = false;
      const dy = e.clientY - y0, dx = e.clientX - x0;
      if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) step(dy < 0 ? 1 : -1);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("pointerdown", down);
    addEventListener("pointerup", up);
    return () => { el.removeEventListener("wheel", wheel); el.removeEventListener("pointerdown", down); removeEventListener("pointerup", up); };
  });

  const items = [-2, -1, 0, 1, 2].map((o) => ({ o, w: works[(index + o + n * 4) % n], k: index + o }));
  const cur = works[index];
  return (
    <motion.div ref={box} className="car" tabIndex={0} role="listbox" aria-label={t(TXT.galeria)} aria-activedescendant={`car-${cur.slug}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); step(1); }
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
        if (e.key === "Enter") navigate(`/${cur.slug}`);
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.25 } }} exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <AnimatePresence initial={false}>
        {n > 0 && items.filter((it) => n > 2 || Math.abs(it.o) < 2).map((it) => (
          <motion.div key={it.k} className={`car-item ${it.o === 0 ? "is-on" : ""}`} id={it.o === 0 ? `car-${it.w.slug}` : undefined}
            role="option" aria-selected={it.o === 0}
            initial={{ y: `${it.o * 150 + (it.o > 0 ? 40 : -40)}%`, opacity: 0, scale: 0.9 }}
            animate={{ y: `${it.o * 150}%`, opacity: Math.abs(it.o) > 1 ? 0 : 1, scale: it.o === 0 ? 1 : 0.86 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={rm ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 20 }}
            onClick={() => { if (it.o !== 0) step(it.o); }}>
            <div className="car-frame">
              {it.w.kind.type === "sculpture"
                ? <Piece3D work={it.w} mode={it.o === 0 ? "live" : "still"} spin={it.o === 0 ? 0.3 : 0} dpr={1.5}
                    flightKey={it.o === 0 ? `view:${it.w.slug}` : undefined} />
                : <FlatThumb work={it.w} />}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="car-title">
        <A href={`/${cur.slug}`} className="car-link">
          <Swap k={cur.slug + lang}>{t(cur.title)}</Swap>
          <ArrowDisc className="disc" />
        </A>
        {cur.origin === "estudo" && <span className="tag-study">{t(TXT.study)}</span>}
      </div>
    </motion.div>
  );
}

/* ── a grade ── */
function Grid({ works, onHover }: { works: Work[]; onHover: (w: Work | null) => void }) {
  const [, t] = useLang();
  const [live, setLive] = useState<string | null>(null);
  return (
    <motion.ul className="grid" initial="initial" animate="animate" exit="exit">
      {works.map((w, k) => {
        const light = lightCard(w);
        return (
          <motion.li key={w.slug} className={`card ${light ? "is-light" : ""} ${w.kind.type !== "sculpture" ? "is-flat" : ""}`}
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.2 + Math.min(k, 12) * 0.045, duration: 0.7, ease: EASE_OUT } }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
            onPointerEnter={() => { setLive(w.slug); onHover(w); }} onPointerLeave={() => { setLive(null); onHover(null); }}>
            <A href={`/${w.slug}`} className="card-a" aria-label={`${t(w.title)} — ${t(w.series)}`} onFocus={() => setLive(w.slug)} onBlur={() => setLive(null)}>
              {w.kind.type === "sculpture"
                ? <Piece3D work={w} mode={live === w.slug ? "live" : "still"} spin={live === w.slug ? 0.6 : 0} dpr={1.5} flightKey={`view:${w.slug}`} />
                : <FlatThumb work={w} />}
              <ArrowDisc className="disc card-disc" />
              <span className="card-name"><span>{t(w.title)}</span>{w.origin === "estudo" && <em>{t(TXT.study)}</em>}</span>
            </A>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/* O site: abertura, as páginas (com transição entre elas) e a lista de
   interesse. Tudo vive num LayoutGroup: o painel preto ("ink") e as
   pílulas do menu têm layoutId e viajam de uma página para a outra. */
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "motion/react";
import { useEffect, useState } from "react";
import { useRoute, type Route } from "./router";
import { useStore } from "./store";
import { TXT, useLang } from "./i18n";
import { engine } from "../three/engine";
import { warmPieces } from "../three/warm";

/** o motor e os shaders, prontos antes da primeira página */
const boot = () => engine.init().then(() => engine.warmup(warmPieces()));
import { WORK_BY_SLUG } from "../data/works";
import { Logo } from "../ui/Logo";
import { A, EASE_OUT, Ink } from "../ui/kit";
import Home from "../pages/Home";
import Spyglass from "../pages/Spyglass";
import Gallery from "../pages/Gallery";
import Work from "../pages/Work";
import Shop, { WishDrawer } from "../pages/Shop";
import About from "../pages/About";

function title(r: Route, lang: "pt" | "en") {
  const base = "Bruno Petri";
  switch (r.name) {
    case "home": return `${base} — Transcendental Geometrical Art`;
    case "spyglass": return `${WORK_BY_SLUG[r.slug].title[lang]} · Spyglass — ${base}`;
    case "galeria": return `${TXT.galeria[lang]} — ${base}`;
    case "obra": return `${WORK_BY_SLUG[r.slug].title[lang]} — ${base}`;
    case "loja": return `${TXT.loja[lang]} — ${base}`;
    case "sobre": return `${TXT.sobre[lang]} — ${base}`;
    default: return base;
  }
}

function Page({ r }: { r: Route }) {
  switch (r.name) {
    case "home": return <Home />;
    case "spyglass": return <Spyglass slug={r.slug} />;
    case "galeria": return <Gallery view={r.view} />;
    case "obra": return <Work slug={r.slug} />;
    case "loja": return <Shop />;
    case "sobre": return <About />;
    default: return <NotFound />;
  }
}

function NotFound() {
  const [, t] = useLang();
  return (
    <motion.main className="pg pg-404" id="conteudo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <p className="h-big">404</p>
      <p>{t(TXT.notFound)}</p>
      <A href="/" className="pill">{t(TXT.backHome)}</A>
    </motion.main>
  );
}

function Intro({ onDone }: { onDone: () => void }) {
  const [, t] = useLang();
  useEffect(() => {
    let alive = true;
    const t0 = performance.now();
    Promise.all([boot(), document.fonts?.ready]).finally(() => {
      const wait = Math.max(0, 1500 - (performance.now() - t0));
      setTimeout(() => alive && onDone(), wait);
    });
    return () => { alive = false; };
  }, [onDone]);
  return (
    <motion.div className="intro" exit={{ opacity: 1 }} role="status" aria-live="polite">
      <Ink className="intro-ink" radius={[0, 0, 0, 0]} />
      <motion.div className="intro-in" exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.35 } }}>
        <motion.p className="tagline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.9, ease: EASE_OUT } }}>Transcendental Geometrical Art</motion.p>
        <Logo as="div" />
        <div className="intro-bar"><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: [0.6, 0, 0.2, 1] }} /></div>
        <p className="intro-msg">{t(TXT.loading)}</p>
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  const { route, search } = useRoute();
  const [lang, t] = useLang();
  const introDone = useStore((s) => s.introDone);
  const setIntroDone = useStore((s) => s.setIntroDone);
  const [skipIntro] = useState(() => new URLSearchParams(location.search).has("semabertura"));

  useEffect(() => { document.title = title(route, lang); }, [route, lang]);
  useEffect(() => { if (skipIntro) boot().then(setIntroDone); }, [skipIntro, setIntroDone]);
  // a galeria lista ↔ grade é a mesma página (só a vista muda)
  const key = route.name === "obra" ? "obra" : route.name === "spyglass" ? "spyglass" : route.name;
  void search;

  return (
    <MotionConfig reducedMotion="user">
      <a href="#conteudo" className="skip">{t(TXT.skip)}</a>
      <LayoutGroup>
        <AnimatePresence>
          {!introDone && !skipIntro && <Intro key="intro" onDone={setIntroDone} />}
        </AnimatePresence>
        <AnimatePresence>
          {introDone && <Page key={key} r={route} />}
        </AnimatePresence>
      </LayoutGroup>
      <WishDrawer />
      <noscript>{t(TXT.no3d)}</noscript>
    </MotionConfig>
  );
}

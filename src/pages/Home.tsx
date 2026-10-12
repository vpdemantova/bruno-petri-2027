/* HOME — a primeira tela. Desktop: painel preto à esquerda (frase, logo,
   as duas colunas do texto, menu, idioma e contatos) e a Cruz Fractal
   girando à direita; o botão redondo na emenda leva ao Spyglass.
   Celular: o painel vira um cabeçalho, a obra no meio e o menu 2×2. */
import { motion, useIsPresent } from "motion/react";
import { WORK_BY_SLUG } from "../data/works";
import { ARTIST } from "../data/artist";
import { TXT, useLang } from "../app/i18n";
import { Piece3D } from "../ui/Piece3D";
import { Logo } from "../ui/Logo";
import { ArrowCircle } from "../ui/Icons";
import { A, Contacts, Ink, LangSwitch, Nav, Swap, fade, rise, useMobile, useRadius } from "../ui/kit";

export default function Home() {
  const [lang, t] = useLang();
  const mobile = useMobile();
  const R = useRadius();
  const present = useIsPresent();
  const work = WORK_BY_SLUG["cruz-fractal"];
  return (
    <motion.main className="pg pg-home" id="conteudo" inert={!present} initial="initial" animate="animate" exit="exit">
      <section className="home-panel">
        <Ink className="home-ink" radius={mobile ? [0, 0, R, R] : [0, R, R, 0]} />
        <motion.p className="tagline" {...rise(0)}>{ARTIST.tagline}</motion.p>
        <motion.div {...rise(1)}><Logo /></motion.div>
        {mobile ? (
          <motion.div className="home-mrow" {...rise(2)}>
            <Contacts order={["instagram", "email"]} />
            <LangSwitch />
          </motion.div>
        ) : (
          <>
            <div className="home-bio">
              {ARTIST.bio[lang].map((p, i) => (
                <motion.div key={i} {...rise(2 + i)}><Swap k={lang + i} as="p">{p}</Swap></motion.div>
              ))}
            </div>
            <motion.div className="home-nav" {...fade(0.2)}><Nav theme="dark" variant="row" active="home" /></motion.div>
            <motion.div className="home-foot" {...rise(5)}>
              <LangSwitch />
              <Contacts />
            </motion.div>
          </>
        )}
      </section>
      <div className="home-stage">
        <Piece3D work={work} mode="live" spin={0.22} interactive flightKey={["hero:cruz-fractal", "view:cruz-fractal"]} angle={{ theta: 0.34, phi: 1.43, zoom: mobile ? 1.04 : 1.1 }} />
      </div>
      {mobile && (
        <>
          <motion.div className="home-short" {...rise(3)}><Swap k={lang} as="p">{t(ARTIST.short)}</Swap></motion.div>
          <motion.div className="home-mnav" {...fade(0.2)}><Nav theme="light" variant="grid" active="home" /></motion.div>
        </>
      )}
      <motion.div className="home-go-wrap" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0, transition: { delay: 0.9, type: "spring", stiffness: 200, damping: 16 } }} exit={{ scale: 0, transition: { duration: 0.2 } }}>
        <A href="/spyglass/cruz-fractal" className="home-go" aria-label={`${t(TXT.enterSpy)}: ${t(work.title)}`}>
          <ArrowCircle />
        </A>
      </motion.div>
    </motion.main>
  );
}

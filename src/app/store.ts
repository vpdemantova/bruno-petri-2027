/* O estado do site (zustand): idioma, material escolhido por obra, a
   lista de interesse da loja e as preferências da galeria. O que vale a
   pena lembrar entre visitas vai para o localStorage (com try/catch:
   janela anônima ou bloqueio não podem quebrar nada). */
import { create } from "zustand";
import type { Category, Lang, MaterialChoice } from "../data/works";

export interface WishItem { slug: string; material?: MaterialChoice; qty: number; note?: string }

interface State {
  lang: Lang;
  mats: Record<string, MaterialChoice>;
  wish: WishItem[];
  cart: boolean;
  galleryIndex: number;
  cat: Category | "all";
  introDone: boolean;
  setLang: (l: Lang) => void;
  setMat: (slug: string, m: MaterialChoice) => void;
  addWish: (slug: string, material?: MaterialChoice) => void;
  setWish: (slug: string, patch: Partial<WishItem>) => void;
  removeWish: (slug: string) => void;
  clearWish: () => void;
  setCart: (v: boolean) => void;
  setGalleryIndex: (i: number) => void;
  setCat: (c: Category | "all") => void;
  setIntroDone: () => void;
}

const KEY = "bp:v1";
function load(): Partial<State> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
const saved = load();
// o site nasce em português (como nas telas); o inglês fica a um toque, e a escolha é lembrada
const navLang: Lang = "pt";
const urlLang = typeof location !== "undefined" ? new URLSearchParams(location.search).get("lang") : null;

export const useStore = create<State>((set) => ({
  lang: (urlLang === "en" || urlLang === "pt" ? urlLang : saved.lang) ?? navLang,
  mats: saved.mats ?? {},
  wish: saved.wish ?? [],
  cart: false,
  galleryIndex: 0,
  cat: "all",
  introDone: false,
  setLang: (lang) => set({ lang }),
  setMat: (slug, m) => set((s) => ({ mats: { ...s.mats, [slug]: m } })),
  addWish: (slug, material) => set((s) => {
    const i = s.wish.findIndex((w) => w.slug === slug);
    if (i >= 0) { const wish = s.wish.slice(); wish[i] = { ...wish[i], material: material ?? wish[i].material }; return { wish }; }
    return { wish: [...s.wish, { slug, material, qty: 1 }] };
  }),
  setWish: (slug, patch) => set((s) => ({ wish: s.wish.map((w) => (w.slug === slug ? { ...w, ...patch } : w)) })),
  removeWish: (slug) => set((s) => ({ wish: s.wish.filter((w) => w.slug !== slug) })),
  clearWish: () => set({ wish: [] }),
  setCart: (cart) => set({ cart }),
  setGalleryIndex: (galleryIndex) => set({ galleryIndex }),
  setCat: (cat) => set({ cat }),
  setIntroDone: () => set({ introDone: true }),
}));

useStore.subscribe((s) => {
  try { localStorage.setItem(KEY, JSON.stringify({ lang: s.lang, mats: s.mats, wish: s.wish })); } catch { /* sem armazenamento: tudo bem */ }
  document.documentElement.lang = s.lang === "pt" ? "pt-BR" : "en";
});

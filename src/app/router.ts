/* Um roteador pequeno sobre a History API. Endereços como nas telas:
     /                    Home
     /spyglass/:obra      a obra sozinha, de todos os ângulos
     /galeria             lista (carrossel); ?vista=grade e ?tipo=pintura…
     /loja  /sobre
     /:obra               a página da obra (ex.: /cruz-fractal)
   O vercel.json manda todo endereço para o index.html. */
import { useSyncExternalStore } from "react";
import { WORK_BY_SLUG } from "../data/works";

export type Route =
  | { name: "home" }
  | { name: "spyglass"; slug: string }
  | { name: "galeria"; view: "lista" | "grade" }
  | { name: "obra"; slug: string }
  | { name: "loja" }
  | { name: "sobre" }
  | { name: "404" };

export function parse(path: string, search = ""): Route {
  const p = path.replace(/\/+$/, "") || "/";
  const q = new URLSearchParams(search);
  if (p === "/") return { name: "home" };
  if (p === "/galeria" || p === "/gallery") return { name: "galeria", view: q.get("vista") === "grade" || q.get("view") === "grid" ? "grade" : "lista" };
  if (p === "/loja" || p === "/shop") return { name: "loja" };
  if (p === "/sobre" || p === "/about") return { name: "sobre" };
  const sp = p.match(/^\/spyglass(?:\/([\w-]+))?$/);
  if (sp) return { name: "spyglass", slug: sp[1] && WORK_BY_SLUG[sp[1]] ? sp[1] : "molecula" };
  const ob = p.match(/^\/([\w-]+)$/);
  if (ob && WORK_BY_SLUG[ob[1]]) return { name: "obra", slug: ob[1] };
  return { name: "404" };
}

let current = { path: location.pathname, search: location.search, route: parse(location.pathname, location.search) };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function sync() {
  current = { path: location.pathname, search: location.search, route: parse(location.pathname, location.search) };
  emit();
}
window.addEventListener("popstate", sync);

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const u = new URL(to, location.origin);
  if (u.pathname + u.search === location.pathname + location.search) return;
  history[opts.replace ? "replaceState" : "pushState"](null, "", u.pathname + u.search + u.hash);
  sync();
}

export function useRoute() {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => current);
}

export const routeKey = (r: Route) => r.name;

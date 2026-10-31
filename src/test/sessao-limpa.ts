import { beforeEach } from "vitest";

/* Cada teste comeca sem filtro guardado: o kit guarda filtro e busca da lista em `sessionStorage` (`filtroDaSessao`). */
beforeEach(() => {
  try { if (typeof window !== "undefined") window.sessionStorage.clear(); } catch { /* ambiente sem armazenamento */ }
});

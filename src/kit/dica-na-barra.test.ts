import { describe, expect, it } from "vitest";
// @ts-expect-error O Vitest roda esta auditoria de fonte no Node; o bundle do navegador nunca a importa.
import { readFileSync } from "node:fs";

/*
  O (i) NA BARRA DA LISTA (12/10, Reservas): a barra fica encostada a direita, e o balao centrado no icone (`left: 50%`
  + `translateX(-50%)`) passava da janela em 1366 e em 390 — a frase da regra de leitura do vendedor saia cortada. Na
  barra, o balao ancora pela direita do icone.
*/
const kit: string = readFileSync(new URL("./kit.css", import.meta.url), "utf8");

describe("o balao do (i) na barra da lista", () => {
  it("ancora a direita e nao centraliza", () => {
    const regra = kit.match(/\.v2-lista-ferramentas \.v2-dica:hover::after,\s*\.v2-lista-ferramentas \.v2-dica:focus-visible::after\s*\{([^}]*)\}/);
    expect(regra, "regra do balao na barra da lista").not.toBeNull();
    expect(regra![1]).toMatch(/right:\s*0/);
    expect(regra![1]).toMatch(/left:\s*auto/);
    expect(regra![1]).toMatch(/transform:\s*none/);
  });
});

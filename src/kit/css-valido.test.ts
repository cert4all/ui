import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/*
  O CSS DO KIT ABRE E FECHA (31/10): o `base.css` nasceu sem o `.v2 {` da primeira linha e o Tailwind do Cert4All
  recusou a folha inteira ("Missing opening {"). Os testes de componente nao leem CSS; este le.
*/
const FOLHAS = ["base.css", "kit.css", "familias.css", "moldura.css"];

describe("as folhas do kit", () => {
  for (const folha of FOLHAS) {
    it(`${folha}: toda chave aberta fecha, e nenhuma fecha antes de abrir`, () => {
      const css = readFileSync(new URL(`./${folha}`, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      let nivel = 0;
      for (const c of css) {
        if (c === "{") nivel++;
        if (c === "}") nivel--;
        expect(nivel).toBeGreaterThanOrEqual(0);
      }
      expect(nivel).toBe(0);
    });
  }
});

describe("o cabeçalho da tabela no vidro (C40)", () => {
  const moldura = readFileSync(new URL("./moldura.css", import.meta.url), "utf8");
  it("o token quase opaco vale só no th, não no bloco do vidro (o kanban e os painéis mantêm o vidro)", () => {
    // o bloco dos tokens do vidro é o que define o filtro
    const inicio = moldura.lastIndexOf('.v2[data-aparencia="vidro"] {', moldura.indexOf("--v2-vidro-filtro:"));
    const bloco = moldura.slice(inicio, moldura.indexOf("}", inicio));
    expect(bloco).toMatch(/--v2-cabeca-tabela:\s*rgb\(255 255 255 \/ 0\.32\)/);
    const th = moldura.slice(moldura.indexOf('.v2[data-aparencia="vidro"] .v2-tabela thead th {'));
    expect(th.slice(0, th.indexOf("}"))).toMatch(/--v2-cabeca-tabela:\s*rgb\(246 248 248 \/ 0\.94\)/);
  });
});

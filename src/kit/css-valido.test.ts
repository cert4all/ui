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

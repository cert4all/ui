import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as kit from "./index";

/*
  O QUE O PRODUTO IMPORTA EXISTE (31/10, passo 2 da C40). O Stonen tem a moldura dele, com as mesmas classes da
  `moldura.css`: ele importa as folhas uma a uma (`@cert4all/ui/kit/base.css` etc.) em vez do `kit.css` inteiro. E
  as telas dele usavam `useEstreito` por caminho fundo, que o mapa de `exports` nao deixa: o hook entra no indice.
*/
const pacote = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { exports: Record<string, string> };

describe("os exports do kit", () => {
  for (const folha of ["base", "kit", "familias", "moldura"]) {
    it(`@cert4all/ui/kit/${folha}.css aponta para uma folha que existe`, () => {
      const alvo = pacote.exports[`./kit/${folha}.css`];
      expect(alvo).toBe(`./src/kit/${folha}.css`);
      expect(existsSync(new URL(`../../${alvo}`, import.meta.url))).toBe(true);
    });
  }

  it("o kit.css junta as quatro folhas, na ordem base, kit, familias, moldura", () => {
    const css = readFileSync(new URL("../kit.css", import.meta.url), "utf8");
    expect([...css.matchAll(/@import "\.\/kit\/([a-z]+)\.css"/g)].map((m) => m[1])).toEqual(["base", "kit", "familias", "moldura"]);
  });

  it("useEstreito sai pelo indice", () => {
    expect(typeof kit.useEstreito).toBe("function");
  });
});

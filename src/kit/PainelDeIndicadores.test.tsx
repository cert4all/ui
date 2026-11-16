// @vitest-environment jsdom
import "../test/setup";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PainelDeIndicadores } from "./PainelDeIndicadores";

/*
  O INDICADOR COM `href` (15/11, Portfolio da Daphnis): "Custo acumulado" e "Custo do mes" apareciam so com o rotulo
  centralizado, sem o numero; os do mesmo painel com `aoAbrir` estavam certos. O DOM sempre esteve certo (o primeiro
  teste passava antes da correcao): era CSS. O produto embrulhava o painel em `.daphnis-faixa`, cuja regra
  `.daphnis-faixa a { display: inline-flex; height: 38px; align-items: center }` (das abas de secao) empatava com
  `.v2-indicador > a` (0,1,1) e vencia por vir depois. O jsdom nao calcula cascata; o segundo teste le a folha e prende
  a especificidade do cartao acima da de uma regra de contexto do produto (`.x a`, 0,1,1). A prova no navegador esta no
  PR (a faixa do Portfolio antes e depois).
*/
describe("o painel de indicadores", () => {
  it("o indicador com href mostra o valor como o que tem aoAbrir, e continua indo pelo href", () => {
    const abrir = vi.fn();
    const ir = vi.fn();
    render(<PainelDeIndicadores rotulo="Números" faixa indicadores={[
      { id: "propostas", rotulo: "Propostas aceitas", valor: "R$ 7.350,00", detalhe: "valor das missões pagas", aoAbrir: abrir, testId: "com-aoabrir" },
      { id: "custo", rotulo: "Custo acumulado", valor: "R$ 477 mil", detalhe: "pessoas + assinaturas", href: "/custos", testId: "com-href" },
      { id: "mes", rotulo: "Custo do mês", valor: "R$ 65,6 mil", href: "/custos", aoAbrir: ir, testId: "com-os-dois" }
    ]} />);

    const comAoAbrir = screen.getByTestId("com-aoabrir");
    const comHref = screen.getByTestId("com-href");
    expect(within(comAoAbrir).getByText("R$ 7.350,00").tagName).toBe("STRONG");
    expect(within(comHref).getByText("R$ 477 mil").tagName).toBe("STRONG");
    expect(within(comHref).getByText("pessoas + assinaturas")).toHaveClass("v2-indicador-detalhe");

    // a mesma estrutura nos dois: rotulo, valor e detalhe, nesta ordem, filhos diretos da porta
    const filhos = (li: HTMLElement) => [...(li.firstElementChild as HTMLElement).children].map((c) => c.className || c.tagName);
    expect(filhos(comHref)).toEqual(filhos(comAoAbrir));

    // a porta com href e um link de verdade (abre em outra aba, copia o endereco)
    expect(within(comHref).getByRole("link", { name: /Custo acumulado/ })).toHaveAttribute("href", "/custos");
    // com href e aoAbrir, o clique simples vai pelo aoAbrir (navegacao do produto); com Ctrl, fica com o navegador
    const link = within(screen.getByTestId("com-os-dois")).getByRole("link");
    fireEvent.click(link);
    expect(ir).toHaveBeenCalledTimes(1);
    fireEvent.click(link, { ctrlKey: true });
    expect(ir).toHaveBeenCalledTimes(1);
    fireEvent.click(within(comAoAbrir).getByRole("button"));
    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it("o cartão do indicador vence a regra de link de um contexto do produto (especificidade acima de 0,1,1)", () => {
    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "kit.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    // o bloco que da a forma do cartao: o que declara `flex-direction: column` para a porta `<a>`
    const blocos = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, seletor, corpo]) => ({ seletores: seletor.split(",").map((s) => s.trim()), corpo }));
    const forma = blocos.find((b) => /flex-direction:\s*column/.test(b.corpo) && b.seletores.some((s) => /v2-indicador\s*>\s*a$/.test(s)));
    expect(forma, "o bloco da forma do cartão com `> a`").toBeDefined();
    const classes = (s: string) => (s.match(/\.[\w-]+/g) ?? []).length;
    for (const s of forma!.seletores) expect(classes(s), s).toBeGreaterThanOrEqual(2);
    // o que a regra do produto mudava, o cartao declara (o <button> tem parte disso de casa; o <a>, nao)
    for (const p of ["display: flex", "flex-direction: column", "align-items: stretch", "height: 100%", "white-space: normal", "text-decoration: none"]) {
      expect(forma!.corpo).toContain(p);
    }
  });
});

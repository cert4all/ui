// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buscaDeFiltro, buscaLembradaDaLista, lembrarBuscaDaLista, useNaSessao } from "./filtroDaSessao";

/* O filtro fica enquanto a rotina dura (Lucas, 29/10): sai da tela e volta, o filtro esta la. */
describe("o filtro guardado na sessao", () => {
  it("useNaSessao: a tela que desmonta e monta de novo volta com o filtro; setter funcional tambem guarda", () => {
    const primeira = renderHook(() => useNaSessao<number | null>("teste:espessura", null));
    act(() => primeira.result.current[1](30));
    act(() => primeira.result.current[1]((atual) => (atual ?? 0) + 10));
    primeira.unmount();
    const segunda = renderHook(() => useNaSessao<number | null>("teste:espessura", null));
    expect(segunda.result.current[0]).toBe(40);
  });

  it("sem chave nao guarda; o inicial preguicoso so roda quando nao ha nada guardado", () => {
    const sem = renderHook(() => useNaSessao("", "x"));
    act(() => sem.result.current[1]("y"));
    sem.unmount();
    expect(renderHook(() => useNaSessao(null, "inicial")).result.current[0]).toBe("inicial");
    let chamadas = 0;
    window.sessionStorage.setItem("stonen-v2-filtro:teste:vista", JSON.stringify("table"));
    const lida = renderHook(() => useNaSessao("teste:vista", () => { chamadas++; return "cards"; }));
    expect([lida.result.current[0], chamadas]).toEqual(["table", 0]);
  });

  it("o endereco da lista guarda o filtro, nunca a porta (o cartao, a conversa, o alvo)", () => {
    expect(buscaDeFiltro("?q=bali&vendedor=leo")).toBe("?q=bali&vendedor=leo");
    expect(buscaDeFiltro("?recommendationId=r1&modo=lista&customerId=c1")).toBe("?modo=lista");
    expect(buscaDeFiltro("?recommendationId=r1")).toBe("");
    lembrarBuscaDaLista("/v2/quadro", "?modo=lista&recommendationId=r1");
    expect(buscaLembradaDaLista("/v2/quadro")).toBe("?modo=lista");
    expect(buscaLembradaDaLista("/v2/clientes")).toBe("");
  });
});

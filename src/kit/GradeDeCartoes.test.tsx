// @vitest-environment jsdom
import "../test/setup";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GradeDeCartoes, PaginaInteira } from "./GradeDeCartoes";

/*
  A GRADE DE CARTOES (a tela nao rola, 10/10). O que prende:
  - cartao comum: cabecalho com o titulo, corpo que rola (regiao com nome) e rodape fora do corpo;
  - abas internas trocam o corpo do cartao;
  - cartao `proprio` (uma ListView, que ja e cartao com cabecalho): a grade so o posiciona — sem cabecalho nem corpo
    em volta, mas conta no seletor "um por vez" do celular como qualquer cartao.
*/
describe("a grade de cartões", () => {
  it("cartão comum, abas e cartão próprio", () => {
    render(<PaginaInteira rotulo="Tela"><GradeDeCartoes rotulo="Grade" cartoes={[
      { id: "lista", titulo: "Ofertas em aberto", rotuloCurto: "Ofertas", proprio: true, conteudo: <section aria-label="a lista de verdade"><h2>Ofertas em aberto</h2></section> },
      { id: "graficos", titulo: "Gráficos", rodape: <button type="button">Ação</button>, abas: [
        { id: "a", rotulo: "Etapa", conteudo: () => <p>barras por etapa</p> },
        { id: "b", rotulo: "Mês", conteudo: () => <p>barras por mês</p> }
      ] }
    ]} /></PaginaInteira>);

    // o cartao proprio nao ganha casca: um titulo so (o da lista), e nenhum corpo de grade em volta
    const lista = screen.getByRole("region", { name: "a lista de verdade" });
    expect(lista.parentElement).toHaveClass("v2-grade-cartao", "is-proprio", "is-ativo");
    expect(screen.getAllByRole("heading", { name: "Ofertas em aberto" })).toHaveLength(1);
    expect(lista.closest(".v2-grade-corpo")).toBeNull();

    // o seletor do celular conta os dois cartoes, pelo nome curto
    const seletor = screen.getByRole("tablist", { name: "Grade: cartão em tela" });
    expect(within(seletor).getAllByRole("tab").map((t) => t.textContent)).toEqual(["Ofertas", "Gráficos"]);

    // abas internas trocam o corpo; o rodape fica fora do painel que rola
    const graficos = screen.getByRole("region", { name: "Gráficos" });
    expect(within(graficos).getByRole("tabpanel")).toHaveTextContent("barras por etapa");
    fireEvent.click(within(graficos).getByRole("tab", { name: "Mês" }));
    expect(within(graficos).getByRole("tabpanel")).toHaveTextContent("barras por mês");
    expect(within(graficos).getByRole("tabpanel")).not.toContainElement(within(graficos).getByRole("button", { name: "Ação" }));
  });
});

describe("o título do cartão com abas", () => {
  it("por padrão as abas tomam o lugar; com `tituloComAbas` o título fica à vista antes delas", () => {
    render(<GradeDeCartoes rotulo="Grade" cartoes={[
      { id: "f", titulo: "Funil", tituloComAbas: true, abas: [{ id: "a", rotulo: "Etapas", conteudo: () => <p>etapas</p> }] },
      { id: "g", titulo: "Gráficos", abas: [{ id: "a", rotulo: "Mês", conteudo: () => <p>mês</p> }] }
    ]} />);
    expect(within(screen.getByRole("region", { name: "Funil" })).getByRole("heading", { name: "Funil" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Gráficos" })).queryByRole("heading")).toBeNull();
  });
});

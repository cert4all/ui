// @vitest-environment jsdom
import "../test/setup";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Abas } from "./Abas";
import { PaginaDeCadastro } from "./Cadastro";
import { BarraDeAcoes } from "./Destaque";
import { Kanban } from "./Kanban";
import { ListView } from "./ListView";
import { Segmentado } from "./Segmentado";
import { Dialogo, Gaveta } from "./Sobreposicao";

/* OS PEDIDOS DAS TELAS DO CERT4ALL (C40, 31/10), um por um. */
describe("pedidos da C40 ao kit", () => {
  it("o Esc com um menu aberto dentro da gaveta não fecha a gaveta; sem menu, fecha", () => {
    const aoFechar = vi.fn();
    render(<Gaveta aberta aoFechar={aoFechar} titulo="Ficha"><div role="menu" data-state="open">menu</div></Gaveta>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(aoFechar).not.toHaveBeenCalled();
    screen.getByRole("menu").setAttribute("data-state", "closed");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("diálogo extra com classe própria", () => {
    render(<Dialogo aberto aoFechar={() => undefined} titulo="Cobrança" largura="extra" classe="c4a-cobranca">x</Dialogo>);
    const caixa = screen.getByRole("dialog");
    expect(caixa).toHaveClass("v2-dialogo", "is-extra", "c4a-cobranca");
  });

  it("o menu do cartão do kanban fica fora do botão que abre", () => {
    render(<Kanban rotulo="Funil" colunas={[{ id: "a", rotulo: "Lead" }]} itens={[{ id: "1" }]} colunaDe={() => "a"} chave={(i) => i.id}
      tituloDe={() => "Premier"} cartao={() => "Premier"} aoAbrir={() => undefined}
      menu={() => <button type="button">Mais</button>} testIdDe={(i) => `cartao-${i.id}`} />);
    const cartao = screen.getByTestId("cartao-1");
    const mais = within(cartao).getByRole("button", { name: "Mais" });
    expect(mais.closest(".v2-kanban-abrir")).toBeNull();
  });

  it("o Cancelar pode ficar desabilitado", () => {
    render(<PaginaDeCadastro icone={null} titulo="Passo 1" trilha={[]} rotuloDaPrimaria="Próximo" aoSalvar={() => undefined} aoCancelar={() => undefined}
      rotuloDoCancelar="Voltar" cancelarDesabilitado><p>campos</p></PaginaDeCadastro>);
    for (const b of screen.getAllByRole("button", { name: "Voltar" })) expect(b).toBeDisabled();
  });

  it("coluna que quebra, coluna de ações e os marcadores de teste", () => {
    render(<>
      <ListView titulo="Notas" linhas={[{ id: "a" }]} chave={(l) => l.id} busca={{ campos: (l) => [l.id], testId: "busca" }}
        colunas={[{ id: "d", rotulo: "Descrição", quebra: true, celula: () => "longa" }, { id: "x", rotulo: "Ações", acoes: true, celula: () => "…" }]} />
      <BarraDeAcoes acoes={[{ id: "e", rotulo: "Editar", aoClicar: () => undefined, testId: "editar" }]} />
      <Abas rotulo="Seções" abas={[{ id: "a", rotulo: "A", testId: "aba-a" }]}>{() => null}</Abas>
      <Segmentado rotulo="Vista" ativa="x" aoTrocar={() => undefined} opcoes={[{ id: "x", rotulo: "X", testId: "seg-x" }]} />
    </>);
    expect(screen.getByText("longa").closest("td")).toHaveClass("is-quebra");
    expect(screen.getByText("…").closest("td")).toHaveClass("is-acoes");
    for (const id of ["busca", "editar", "aba-a", "seg-x"]) expect(screen.getByTestId(id)).toBeInTheDocument();
  });
});

describe("pedidos da Economia (C40)", () => {
  it("o indicador leva o testId no cartão, mesmo sem valor", async () => {
    const { PainelDeIndicadores } = await import("./PainelDeIndicadores");
    render(<PainelDeIndicadores rotulo="Números" indicadores={[{ id: "mrr", rotulo: "MRR", valor: null, testId: "card-mrr" }]} />);
    expect(screen.getByTestId("card-mrr")).toHaveTextContent("MRR");
  });
});

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

describe("marcadores do Comercial (C40)", () => {
  it("cadastro, título da lista, título do registro e botão do menu", async () => {
    const { Menu } = await import("./Menu");
    const { Destaque } = await import("./Destaque");
    render(<>
      <PaginaDeCadastro icone={null} titulo="Config" trilha={[]} rotuloDaPrimaria="Salvar" aoSalvar={() => undefined} aoCancelar={() => undefined}
        testIdDaPrimaria="btn-salvar" testIdDoCancelar="btn-voltar"><p>x</p></PaginaDeCadastro>
      <ListView titulo="Leads" testIdDoTitulo="text-page-title" linhas={[]} chave={(l: { id: string }) => l.id} colunas={[]} />
      <Destaque icone={null} tipo="Perfil" titulo="Ana" idDoTitulo="t" campos={[]} testIdDoTitulo="text-profile-name" />
      <Menu rotulo="Mais ações" itens={[]} testId="btn-actions-1" />
    </>);
    for (const id of ["btn-salvar", "btn-salvar-topo", "btn-voltar", "btn-voltar-topo", "text-page-title", "text-profile-name", "btn-actions-1"]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });
});

describe("o menu flutuante (C40)", () => {
  it("sai do contêiner que rola: a lista vai para a raiz .v2 e escolher chama a ação", async () => {
    const { Menu } = await import("./Menu");
    const escolher = vi.fn();
    render(<div className="v2"><div style={{ overflow: "auto", height: 40 }} data-testid="rola">
      <Menu rotulo="Ações" flutuante itens={[{ id: "a", rotulo: "Arquivar", aoEscolher: escolher }]} />
    </div></div>);
    fireEvent.click(screen.getByRole("button", { name: /Ações/ }));
    const menu = screen.getByRole("menu");
    expect(screen.getByTestId("rola").contains(menu)).toBe(false);
    expect(menu).toHaveClass("is-flutuante");
    expect(menu.style.position).toBe("fixed");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Arquivar" }));
    expect(escolher).toHaveBeenCalled();
  });
});

describe("interruptor e marcadores de aba e vista (C40)", () => {
  it("o interruptor liga e desliga, com role switch", async () => {
    const { Interruptor } = await import("./Interruptor");
    const aoMudar = vi.fn();
    render(<Interruptor ligado={false} aoMudar={aoMudar} rotulo="SSO ativo" testId="sso" />);
    const chave = screen.getByRole("switch", { name: "SSO ativo" });
    expect(chave).toHaveClass("v2-interruptor");
    fireEvent.click(chave);
    expect(aoMudar).toHaveBeenCalledWith(true);
  });

  it("aba de cartão e vista da lista levam testId", async () => {
    const { GradeDeCartoes } = await import("./GradeDeCartoes");
    render(<>
      <GradeDeCartoes rotulo="g" cartoes={[{ id: "m", titulo: "Matriz", abas: [{ id: "l", rotulo: "Licenças", testId: "tab-licencas", conteudo: () => "x" }] }]} />
      <ListView titulo="Cadastros" linhas={[]} chave={(l: { id: string }) => l.id} colunas={[]} vistas={[{ id: "all", rotulo: "Todos", passa: () => true, testId: "tab-all" }]} />
    </>);
    expect(screen.getByTestId("tab-licencas")).toBeInTheDocument();
    expect(screen.getByTestId("tab-all")).toBeInTheDocument();
  });
});

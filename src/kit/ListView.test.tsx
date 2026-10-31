// @vitest-environment jsdom
import "../test/setup";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListView, type ColunaDaLista } from "./ListView";

/*
  O LIST VIEW DO KIT. O que prende: colunas declarativas; ordenar troca o sentido e manda o nulo para o FIM nos dois
  sentidos; a vista salva filtra e e LEMBRADA; a busca local filtra; a densidade e lembrada; a coluna `link` abre o
  registro (ou seleciona a linha); o rodape soma e conta o que nao tem valor a parte (nunca zero); e os estados
  carregando, erro (com tentar de novo), sem permissao e os dois vazios.
*/
type Linha = { id: string; nome: string; valor: number | null; ativo: boolean };
const LINHAS: Linha[] = [
  { id: "a", nome: "Bali", valor: 300, ativo: true },
  { id: "b", nome: "Calacatta", valor: null, ativo: false },
  { id: "c", nome: "Aurora", valor: 100, ativo: true }
];
const COLUNAS: ColunaDaLista<Linha>[] = [
  { id: "nome", rotulo: "Nome", link: true, principal: true, ordenar: (l) => l.nome, celula: (l) => l.nome },
  { id: "valor", rotulo: "Valor", numerica: true, ordenar: (l) => l.valor, celula: (l) => (l.valor === null ? "sem preço" : `US$ ${l.valor}`) }
];
const nomes = () => screen.getAllByRole("row").slice(1).map((r) => within(r).getAllByRole("cell")[0]!.textContent);

beforeEach(() => window.localStorage.clear());

describe("o ListView do kit", () => {
  it("ordena pela coluna, troca o sentido, e o nulo vai para o fim nos dois", () => {
    render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} />);
    const valor = screen.getByRole("button", { name: "Valor" });
    fireEvent.click(valor);
    expect(screen.getByRole("columnheader", { name: /Valor/ })).toHaveAttribute("aria-sort", "descending");
    expect(nomes()).toEqual(["Bali", "Aurora", "Calacatta"]);
    fireEvent.click(valor);
    expect(nomes()).toEqual(["Aurora", "Bali", "Calacatta"]);
    expect(screen.getByRole("columnheader", { name: /Nome/ })).toHaveAttribute("aria-sort", "none");
  });

  it("a vista salva filtra e fica lembrada por chave", () => {
    const vistas = [{ id: "todas", rotulo: "Todos", passa: () => true }, { id: "ativos", rotulo: "Ativos", passa: (l: Linha) => l.ativo }];
    const { unmount } = render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} vistas={vistas} memoria="teste:ana" />);
    fireEvent.change(screen.getByRole("combobox", { name: "Vista salva" }), { target: { value: "ativos" } });
    expect(screen.getByRole("status")).toHaveTextContent("2 registros");
    unmount();
    render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} vistas={vistas} memoria="teste:ana" />);
    expect(screen.getByRole("combobox", { name: "Vista salva" })).toHaveValue("ativos");
    expect(window.localStorage.getItem("teste:ana")).toBe("ativos");
  });

  it("a vista pedida pelo endereço abre recortada sem virar a lembrada", () => {
    window.localStorage.setItem("teste:ana", "todas");
    const vistas = [{ id: "todas", rotulo: "Todos", passa: () => true }, { id: "ativos", rotulo: "Ativos", passa: (l: Linha) => l.ativo }];
    render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} vistas={vistas} memoria="teste:ana" vistaPedida="ativos" />);
    expect(screen.getByRole("combobox", { name: "Vista salva" })).toHaveValue("ativos");
    expect(window.localStorage.getItem("teste:ana")).toBe("todas");
  });

  it("a busca local filtra pelos campos declarados e a vazia da vista diz isso", () => {
    render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} busca={{ campos: (l) => [l.nome] }}
      vazio={{ semResultado: "Nada com esta busca." }} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar em Materiais" }), { target: { value: "cala" } });
    expect(nomes()).toEqual(["Calacatta"]);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar em Materiais" }), { target: { value: "xyz" } });
    expect(screen.getByText("Nada com esta busca.")).toBeInTheDocument();
  });

  it("a busca ignora caixa e acento nos dois lados (bateria de 12/10)", () => {
    render(<ListView titulo="Clientes" colunas={COLUNAS} linhas={[{ id: "1", nome: "PEDRA BONITA MÁRMORES", valor: 1, ativo: true }, { id: "2", nome: "Granitos SA", valor: 2, ativo: true }]}
      chave={(l) => l.id} busca={{ campos: (l) => [l.nome] }} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar em Clientes" }), { target: { value: "bonita marmores" } });
    expect(nomes()).toEqual(["PEDRA BONITA MÁRMORES"]);
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar em Clientes" }), { target: { value: "MÁRMORES" } });
    expect(nomes()).toEqual(["PEDRA BONITA MÁRMORES"]);
  });

  it("a densidade compacta e lembrada", () => {
    render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} memoria="teste:ana" />);
    const botao = screen.getByRole("button", { name: "Linhas compactas" });
    fireEvent.click(botao);
    expect(botao).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("table")).toHaveClass("is-compacta");
    expect(window.localStorage.getItem("teste:ana:densidade")).toBe("compacta");
  });

  it("a coluna link abre o registro pelo endereço; com seleção, marca a linha", () => {
    const aoAbrir = vi.fn();
    const aoSelecionar = vi.fn();
    const { rerender } = render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id}
      abrir={{ href: (l) => `/v2/materiais/${l.id}`, aoAbrir }} />);
    const bali = screen.getByRole("link", { name: "Bali" });
    expect(bali).toHaveAttribute("href", "/v2/materiais/a");
    fireEvent.click(bali);
    expect(aoAbrir).toHaveBeenCalledWith(LINHAS[0]);
    rerender(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} selecao={{ selecionada: "c", aoSelecionar }} />);
    expect(screen.getByRole("button", { name: "Aurora" })).toHaveAttribute("aria-current", "true");
    fireEvent.click(screen.getByRole("button", { name: "Bali" }));
    expect(aoSelecionar).toHaveBeenCalledWith(LINHAS[0]);
  });

  /* Owner, 22/10 (Reservas): "so consigo abrir a reserva se eu clico no nome do bundle, o usuario esta ficando perdido". */
  it("clicar em qualquer ponto da linha abre o registro, uma vez; botão da própria linha e Ctrl/Cmd não", () => {
    const aoAbrir = vi.fn();
    const comBotao: ColunaDaLista<Linha>[] = [...COLUNAS, { id: "acao", rotulo: "Ação", celula: () => <button type="button">Ação</button> }];
    render(<ListView titulo="Materiais" colunas={comBotao} linhas={LINHAS} chave={(l) => l.id} abrir={{ href: (l) => `/v2/materiais/${l.id}`, aoAbrir }} />);
    const linhaDaBali = screen.getByRole("link", { name: "Bali" }).closest("tr")!;
    fireEvent.click(within(linhaDaBali).getByText("US$ 300"));
    expect(aoAbrir).toHaveBeenCalledTimes(1);
    expect(aoAbrir).toHaveBeenCalledWith(LINHAS[0]);
    fireEvent.click(screen.getByRole("link", { name: "Bali" }));
    expect(aoAbrir).toHaveBeenCalledTimes(2);
    fireEvent.click(within(linhaDaBali).getByRole("button", { name: "Ação" }));
    fireEvent.click(within(linhaDaBali).getByText("US$ 300"), { metaKey: true });
    expect(aoAbrir).toHaveBeenCalledTimes(2);
  });

  it("o rodapé soma e conta à parte o que não tem valor — nunca zero", () => {
    render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id}
      rodape={{ soma: { rotulo: "Total", valor: (l) => l.valor, formatar: (n) => `US$ ${n}` } }} />);
    expect(screen.getByText("US$ 400")).toBeInTheDocument();
    expect(screen.getByText(/1 sem valor/)).toBeInTheDocument();
  });

  it("a contagem diz 'de M na carga' só quando o visível difere da carga total — nunca 'N de N' (ADR-0025)", () => {
    const { rerender } = render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} cargaTotal={3} />);
    expect(screen.getByRole("status")).toHaveTextContent("3 registros");
    rerender(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} cargaTotal={50} />);
    expect(screen.getByRole("status")).toHaveTextContent("3 resultados de 50 na carga");
    rerender(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} cargaTotal={50} contagem={(n) => `${n} pedras`} />);
    // Com a carga diferente, a contagem generica da carga prevalece sobre o texto proprio da tela.
    expect(screen.getByRole("status")).toHaveTextContent("3 resultados de 50 na carga");
  });

  /* RETRABALHO da A12 (revisao independente): o mecanismo mora no kit — busca e vista sao dele, o resto (`limpar.ativo`)
     vem da tela. Sem a prop `limpar`, nenhum botao aparece (Ofertas e Reservas ja tem o deles, por fora do kit). */
  describe("\"Limpar filtros\" (ADR-0025, retrabalho da A12)", () => {
    const vistas = [{ id: "todas", rotulo: "Todas", passa: () => true }, { id: "ativos", rotulo: "Ativos", passa: (l: Linha) => l.ativo }];

    it("não aparece sem a prop `limpar`, mesmo com busca e vista mudadas", () => {
      render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} vistas={vistas} busca={{ campos: (l) => [l.nome] }} />);
      fireEvent.change(screen.getByRole("searchbox", { name: "Buscar em Materiais" }), { target: { value: "a" } });
      fireEvent.change(screen.getByRole("combobox", { name: "Vista salva" }), { target: { value: "ativos" } });
      expect(screen.queryByRole("button", { name: "Limpar filtros" })).toBeNull();
    });

    it("aparece com a busca ativa e limpa só ela", () => {
      const aoLimpar = vi.fn();
      render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id}
        busca={{ campos: (l) => [l.nome] }} limpar={{ ativo: false, aoLimpar }} />);
      expect(screen.queryByRole("button", { name: "Limpar filtros" })).toBeNull();
      fireEvent.change(screen.getByRole("searchbox", { name: "Buscar em Materiais" }), { target: { value: "cala" } });
      fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
      expect(screen.getByRole("searchbox", { name: "Buscar em Materiais" })).toHaveValue("");
      expect(aoLimpar).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("button", { name: "Limpar filtros" })).toBeNull();
    });

    it("aparece com a vista fora da padrão e volta a ela", () => {
      const aoLimpar = vi.fn();
      render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} vistas={vistas}
        memoria="teste:vista-limpar" limpar={{ ativo: false, aoLimpar }} />);
      fireEvent.change(screen.getByRole("combobox", { name: "Vista salva" }), { target: { value: "ativos" } });
      fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
      expect(screen.getByRole("combobox", { name: "Vista salva" })).toHaveValue("todas");
      expect(aoLimpar).toHaveBeenCalledTimes(1);
    });

    it("aparece com `limpar.ativo` só (filtro de fora do kit) e chama `aoLimpar` ao clicar", () => {
      const aoLimpar = vi.fn();
      const { rerender } = render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} limpar={{ ativo: true, aoLimpar }} />);
      fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
      expect(aoLimpar).toHaveBeenCalledTimes(1);
      // O kit não sabe por si só que o filtro de fora foi limpo: quem chama decide o `ativo` do próximo render.
      rerender(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} limpar={{ ativo: false, aoLimpar }} />);
      expect(screen.queryByRole("button", { name: "Limpar filtros" })).toBeNull();
    });

    it("limpa busca, vista e o filtro de fora de uma vez só", () => {
      const aoLimpar = vi.fn();
      render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} vistas={vistas}
        busca={{ campos: (l) => [l.nome] }} limpar={{ ativo: true, aoLimpar }} />);
      fireEvent.change(screen.getByRole("searchbox", { name: "Buscar em Materiais" }), { target: { value: "a" } });
      fireEvent.change(screen.getByRole("combobox", { name: "Vista salva" }), { target: { value: "ativos" } });
      fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
      expect(screen.getByRole("searchbox", { name: "Buscar em Materiais" })).toHaveValue("");
      expect(screen.getByRole("combobox", { name: "Vista salva" })).toHaveValue("todas");
      expect(aoLimpar).toHaveBeenCalledTimes(1);
    });
  });

  it("sem nenhuma linha com valor, a soma é '—' e não 'US$ 0' (bateria de 12/10)", () => {
    render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id}
      rodape={{ soma: { rotulo: "Total", valor: () => null, formatar: (n) => `US$ ${n}` } }} />);
    expect(screen.queryByText("US$ 0")).not.toBeInTheDocument();
    expect(screen.getByText("—", { selector: ".v2-lista-rodape strong" })).toBeInTheDocument();
  });

  it("no celular a tabela rola dentro da própria caixa (região nomeada, focável)", () => {
    render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={LINHAS} chave={(l) => l.id} />);
    expect(screen.getByRole("region", { name: "Materiais — tabela" })).toHaveAttribute("tabindex", "0");
  });

  it("os estados: carregando, erro com tentar de novo, sem permissão, e vazio sem nada", () => {
    const tentar = vi.fn();
    const { rerender } = render(<ListView titulo="Materiais" colunas={COLUNAS} linhas={undefined} chave={(l) => l.id} />);
    expect(screen.getAllByRole("status").map((s) => s.textContent)).toContain("Carregando…");
    rerender(<ListView titulo="Materiais" colunas={COLUNAS} linhas={undefined} chave={(l) => l.id} estado={{ erro: true, aoTentarDeNovo: tentar }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar: materiais.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(tentar).toHaveBeenCalled();
    rerender(<ListView titulo="Materiais" colunas={COLUNAS} linhas={[]} chave={(l) => l.id} estado={{ semPermissao: true }} />);
    expect(screen.getByText("Seu perfil não alcança esta informação.")).toBeInTheDocument();
    rerender(<ListView titulo="Materiais" colunas={COLUNAS} linhas={[]} chave={(l) => l.id} vazio={{ semNada: "Nenhum material ainda." }} />);
    expect(screen.getByText("Nenhum material ainda.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });
});

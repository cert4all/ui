// @vitest-environment jsdom
import "../test/setup";
import { useRef, useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Kanban } from "./Kanban";
import { PainelDeIndicadores } from "./PainelDeIndicadores";
import { Dialogo, Gaveta } from "./Sobreposicao";
import { Carregando, Erro, SemPermissao, Vazio } from "./Estados";
import { Selo } from "./Selo";

/*
  KANBAN, INDICADORES, DIALOGO/GAVETA, ESTADOS E SELO. O que prende: a coluna conta os cartoes; mover vai pelo
  TECLADO (o seletor "Mover para"), nao so pelo arrasto; o numero desconhecido e "—" e o indicador com porta e link;
  o dialogo prende o Tab, fecha com Esc e devolve o foco; a gaveta e um dialogo com nome.
*/
type Cartao = { id: string; nome: string; etapa: string };

describe("o kanban do kit", () => {
  it("conta por coluna, abre o cartão e move pelo teclado", () => {
    const aoAbrir = vi.fn();
    const aoMover = vi.fn();
    const itens: Cartao[] = [{ id: "1", nome: "Bali", etapa: "a" }, { id: "2", nome: "Aurora", etapa: "a" }, { id: "3", nome: "Mist", etapa: "b" }];
    render(<Kanban<Cartao> rotulo="Quadro" colunas={[{ id: "a", rotulo: "Enviada" }, { id: "b", rotulo: "Em conversa", tom: "atencao" }, { id: "c", rotulo: "Ganha" }]}
      itens={itens} colunaDe={(i) => i.etapa} chave={(i) => i.id} tituloDe={(i) => i.nome} cartao={(i) => <strong>{i.nome}</strong>}
      aoAbrir={aoAbrir} aoMover={aoMover} />);
    expect(screen.getByRole("region", { name: "Enviada, 2" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Ganha, 0" })).getByText("Nada nesta etapa.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Abrir Mist" }));
    expect(aoAbrir).toHaveBeenCalledWith(itens[2]);
    fireEvent.change(screen.getByRole("combobox", { name: "Mover Bali para" }), { target: { value: "c" } });
    expect(aoMover).toHaveBeenCalledWith(itens[0], "c");
  });

  it("sem aoMover, não há seletor nem arrasto", () => {
    render(<Kanban<Cartao> rotulo="Quadro" colunas={[{ id: "a", rotulo: "Enviada" }]} itens={[{ id: "1", nome: "Bali", etapa: "a" }]}
      colunaDe={(i) => i.etapa} chave={(i) => i.id} tituloDe={(i) => i.nome} cartao={(i) => i.nome} />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Bali").closest("li")).toHaveAttribute("draggable", "false");
  });
});

describe("indicadores, estados e selo", () => {
  it("o número desconhecido é “—”, e o indicador com porta é link", () => {
    const abrir = vi.fn();
    render(<PainelDeIndicadores rotulo="Hoje" indicadores={[
      { id: "a", rotulo: "Ofertas sem resposta", valor: "7", href: "/v2/ofertas?vista=nao-abriram", aoAbrir: abrir, dica: "Enviadas há mais de 3 dias." },
      { id: "b", rotulo: "Valor provável", valor: null }
    ]} />);
    const porta = screen.getByRole("link", { name: /Ofertas sem resposta/ });
    expect(porta).toHaveAttribute("href", "/v2/ofertas?vista=nao-abriram");
    fireEvent.click(porta);
    expect(abrir).toHaveBeenCalled();
    expect(screen.getByText("—")).toHaveClass("is-ausente");
    expect(screen.getByRole("note", { name: "Enviadas há mais de 3 dias." })).toBeInTheDocument();
  });

  it("os estados anunciam e o selo leva texto", () => {
    render(<>
      <Carregando />
      <Vazio acao={<button type="button">Incluir</button>}>Nenhum cliente.</Vazio>
      <Erro>Falhou.</Erro>
      <SemPermissao />
      <Selo tom="sucesso">Ganha</Selo>
    </>);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando…");
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou.");
    expect(screen.getByRole("button", { name: "Incluir" })).toBeInTheDocument();
    expect(screen.getByText("Ganha")).toHaveClass("v2-selo", "is-sucesso");
  });
});

function ComDialogo({ Comp }: { Comp: "dialogo" | "gaveta" }) {
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const props = { aoFechar: () => setAberto(false), titulo: "Nova reserva", retorno: botao, rodape: <button type="button">Confirmar</button> };
  return <div className="v2">
    <button ref={botao} type="button" onClick={() => setAberto(true)}>Abrir</button>
    {Comp === "dialogo" ? <Dialogo aberto={aberto} {...props}><input aria-label="Prazo" /></Dialogo>
      : <Gaveta aberta={aberto} {...props}><input aria-label="Prazo" /></Gaveta>}
  </div>;
}

describe("diálogo e gaveta", () => {
  it.each(["dialogo", "gaveta"] as const)("%s: foco dentro, Tab preso, Esc fecha e devolve o foco", (tipo) => {
    render(<ComDialogo Comp={tipo} />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir" }));
    const dialogo = screen.getByRole("dialog", { name: "Nova reserva" });
    expect(dialogo).toHaveAttribute("aria-modal", "true");
    expect(document.activeElement).toBe(within(dialogo).getByRole("textbox", { name: "Prazo" }));
    within(dialogo).getByRole("button", { name: "Confirmar" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(within(dialogo).getByRole("button", { name: "Fechar" }));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(within(dialogo).getByRole("button", { name: "Confirmar" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Abrir" }));
  });
});

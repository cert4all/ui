// @vitest-environment jsdom
import "../test/setup";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Send } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Abas } from "./Abas";
import { Atividade } from "./Atividade";
import { BarraDeAcoes, Destaque, PaginaDeRegistro } from "./Destaque";
import { ListaRelacionada } from "./ListaRelacionada";
import { Path } from "./Path";

/*
  AS PECAS DA PAGINA DE REGISTRO. O que prende: o destaque diz a ausencia como ausencia; as acoes alem das visiveis
  vao para o "Mais", que anda pelas setas; o path diz em texto o que e concluido, atual e encerrado; as abas fazem
  roving tabindex com setas, Home e End; a atividade agrupa por dia (Hoje, Ontem, data) do mais novo ao mais velho;
  a lista relacionada mostra "—" quando nao sabe a contagem, nunca 0.
*/
describe("a página de registro do kit", () => {
  it("monta trilha, destaque e corpo; o campo ausente sai como ausente", () => {
    const voltar = vi.fn();
    render(<PaginaDeRegistro idDoTitulo="t" trilha={[{ rotulo: "Clientes", href: "/v2/clientes", aoClicar: voltar }, { rotulo: "Bedrosians" }]}
      destaque={<Destaque icone={<Send />} tipo="Cliente" titulo="Bedrosians" idDoTitulo="t"
        campos={[{ rotulo: "País", valor: "US" }, { rotulo: "Valor", valor: "sem preço", ausente: true }]} />}
      principal={<p>corpo</p>} />);
    expect(screen.getByRole("region", { name: "Bedrosians" })).toBeInTheDocument();
    expect(screen.getByText("sem preço")).toHaveClass("is-ausente");
    expect(screen.getByText("Bedrosians", { selector: "[aria-current=page]" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Clientes" }));
    expect(voltar).toHaveBeenCalled();
  });

  it("o valor em texto leva o texto inteiro no title — no celular o campo fica em uma linha (recomendação de 12/10)", () => {
    render(<Destaque icone={<Send />} tipo="Oferta" titulo="X" idDoTitulo="t"
      campos={[{ rotulo: "Cliente", valor: "Atlantic Artisan Stone Imports, LLC" }, { rotulo: "Dica", valor: "curto", dica: "o texto longo" }]} />);
    expect(screen.getByText("Atlantic Artisan Stone Imports, LLC")).toHaveAttribute("title", "Atlantic Artisan Stone Imports, LLC");
    expect(screen.getByText("curto")).toHaveAttribute("title", "o texto longo");
  });

  it("as ações além das visíveis vão para o “Mais”, que anda pelas setas", () => {
    const arquivar = vi.fn();
    render(<BarraDeAcoes visiveis={1} acoes={[
      { id: "a", rotulo: "Enviar", tom: "primaria", aoClicar: vi.fn() },
      { id: "b", rotulo: "Duplicar", aoClicar: vi.fn() },
      { id: "c", rotulo: "Arquivar", tom: "perigo", aoClicar: arquivar }
    ]} />);
    expect(screen.getByRole("button", { name: "Enviar" })).toHaveClass("is-primario");
    expect(screen.queryByRole("button", { name: "Duplicar" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mais ações" }));
    const menu = screen.getByRole("menu", { name: "Mais ações" });
    expect(document.activeElement).toHaveTextContent("Duplicar");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toHaveTextContent("Arquivar");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toHaveTextContent("Duplicar");
    fireEvent.keyDown(menu, { key: "End" });
    fireEvent.click(document.activeElement as HTMLElement);
    expect(arquivar).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("o path diz em texto o que é concluído, atual e encerrado", () => {
    const { rerender } = render(<Path rotulo="Etapas" etapas={["Rascunho", "Enviada", "Ganha"]} atual={1} />);
    const lista = screen.getByRole("list", { name: "Etapas" });
    expect(within(lista).getByText("Rascunho").closest("li")).toHaveTextContent("concluída");
    expect(within(lista).getByText("Enviada").closest("li")).toHaveAttribute("aria-current", "step");
    rerender(<Path rotulo="Etapas" etapas={["Rascunho", "Enviada", "Ganha"]} atual={-1} encerrada="Perdida" nota="Fechou sem venda." />);
    expect(within(screen.getByRole("list", { name: "Etapas" })).getByText("Perdida").closest("li")).toHaveTextContent("encerrada");
    expect(screen.queryByText("Ganha")).toBeNull();
    expect(screen.getByText("Fechou sem venda.")).toBeInTheDocument();
  });

  it("as abas fazem roving tabindex com setas, Home e End", () => {
    render(<Abas rotulo="Seções" abas={[{ id: "a", rotulo: "Itens", contador: 3 }, { id: "b", rotulo: "Detalhes" }, { id: "c", rotulo: "Relacionado" }]}>
      {(ativa) => <p>painel {ativa}</p>}
    </Abas>);
    const itens = screen.getByRole("tab", { name: /Itens/ });
    expect(itens).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Detalhes" })).toHaveAttribute("tabindex", "-1");
    fireEvent.keyDown(itens, { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Relacionado" })).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Relacionado" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("painel c");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });
    expect(screen.getByRole("tabpanel")).toHaveTextContent("painel a");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Relacionado");
  });

  it("a atividade agrupa por dia, do mais novo ao mais velho", () => {
    const agora = new Date(2026, 9, 10, 15, 0);
    render(<Atividade agora={agora} eventos={[
      { id: "1", quando: new Date(2026, 9, 3, 9, 0).toISOString(), titulo: "Criada", tom: "neutro" },
      { id: "2", quando: new Date(2026, 9, 10, 9, 0).toISOString(), titulo: "Respondeu", tom: "sucesso" },
      { id: "3", quando: new Date(2026, 9, 9, 18, 0).toISOString(), titulo: "Abriu", tom: "atencao" },
      { id: "4", quando: new Date(2026, 9, 10, 11, 0).toISOString(), titulo: "Ganha", tom: "sucesso" }
    ]} />);
    const atividade = screen.getByRole("complementary", { name: "Atividade" });
    expect(within(atividade).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["Hoje", "Ontem", "03/10/2026"]);
    expect(within(within(atividade).getByRole("region", { name: "Hoje" })).getAllByRole("listitem").map((li) => li.querySelector("strong")?.textContent))
      .toEqual(["Ganha", "Respondeu"]);
  });

  it("data só-dia é do calendário: não volta um dia nem ganha hora inventada (bateria de 12/10)", () => {
    // "2026-01-30" lido como meia-noite UTC caía em 29/01 21:00 no Brasil — o cabeçalho dizia 30/01.
    render(<Atividade agora={new Date(2026, 9, 10, 15, 0)} eventos={[
      { id: "compra", quando: "2026-01-30", titulo: "Última compra registrada", tom: "sucesso" },
      { id: "envio", quando: new Date(2026, 0, 30, 9, 30).toISOString(), titulo: "Oferta enviada", tom: "info" }
    ]} />);
    const atividade = screen.getByRole("complementary", { name: "Atividade" });
    expect(within(atividade).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["30/01/2026"]);
    const compra = within(atividade).getByText("Última compra registrada").closest("li")!;
    expect(compra.querySelector("time")).toBeNull();
    expect(within(atividade).getByText("Oferta enviada").closest("li")!.querySelector("time")).not.toBeNull();
  });

  it("a lista relacionada mostra “—” sem contagem, o vazio com zero, e o ver todos", () => {
    const { rerender } = render(<ListaRelacionada titulo="Reservas" contagem={null} estado={{ carregando: true }} />);
    expect(screen.getByLabelText("contagem indisponível")).toHaveTextContent("—");
    rerender(<ListaRelacionada titulo="Reservas" contagem={0} vazio="Nenhuma reserva." verTodos={{ href: "/v2/reservas" }} />);
    expect(screen.getByText("Nenhuma reserva.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ver todos" })).toBeNull();
    rerender(<ListaRelacionada titulo="Reservas" contagem={4} verTodos={{ href: "/v2/reservas?oferta=1" }}><p>lista</p></ListaRelacionada>);
    expect(screen.getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/v2/reservas?oferta=1");
  });
});

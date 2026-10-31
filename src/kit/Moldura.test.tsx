// @vitest-environment jsdom
import "../test/setup";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Building2, Home, LogOut, Receipt } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Moldura, type AreaDaMoldura } from "./Moldura";

/*
  A MOLDURA. O que prende: o modulo sem area nao aparece; a lateral leva os modulos como secoes, na ordem dada; a
  faixa do topo mostra a subnavegacao so do modulo aberto e com mais de uma tela; clicar navega por dentro (sem
  recarregar); o seletor troca o menu; o menu da conta leva so os itens do produto.
*/
const AREAS: AreaDaMoldura[] = [
  { id: "hoje", rotulo: "Hoje", modulo: "hoje", icone: Home, href: "/hoje", ativa: false },
  { id: "empresas", rotulo: "Empresas", modulo: "clientes", icone: Building2, href: "/empresas", ativa: true },
  { id: "chamados", rotulo: "Chamados", modulo: "clientes", icone: Building2, href: "/chamados", ativa: false },
  { id: "cobrancas", rotulo: "Cobranças", modulo: "financeiro", icone: Receipt, href: "/cobrancas", ativa: false }
];
const MODULOS = [{ id: "hoje", nome: "Hoje" }, { id: "vazio", nome: "Sem telas" }, { id: "clientes", nome: "Clientes" }, { id: "financeiro", nome: "Financeiro" }];

function montar(menu: "lateral" | "topo", extra: Partial<Parameters<typeof Moldura>[0]> = {}) {
  const onNavegar = vi.fn();
  const aoMudarMenu = vi.fn();
  const sair = vi.fn();
  render(<Moldura marca={<strong>Cert4All</strong>} nomeDaNavegacao="Áreas do Cert4All" modulos={MODULOS} areas={AREAS}
    pessoa={{ nome: "Alex Novaes" }} itensDaConta={[{ id: "sair", rotulo: "Sair", icone: LogOut, acao: sair }]}
    menu={menu} aoMudarMenu={aoMudarMenu} recolhido={false} aoRecolher={() => undefined} onNavegar={onNavegar} {...extra}>
    <p>miolo</p>
  </Moldura>);
  return { onNavegar, aoMudarMenu, sair };
}

describe("a moldura", () => {
  it("na lateral, os modulos com tela viram secoes, na ordem dada", () => {
    montar("lateral");
    const navs = screen.getAllByRole("navigation", { name: "Áreas do Cert4All" });
    const lateral = navs.find((n) => n.classList.contains("v2-lateral"))!;
    expect(within(lateral).getAllByRole("heading").map((h) => h.textContent)).toEqual(["Hoje", "Clientes", "Financeiro"]);
    expect(within(lateral).getByRole("link", { name: /Empresas/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("main")).toHaveTextContent("miolo");
  });

  it("no topo, a subnavegacao e so do modulo aberto", () => {
    montar("topo");
    expect(document.querySelector(".v2-lateral")).toBeNull();
    const sub = screen.getByRole("list", { name: "Telas de Clientes" });
    expect(within(sub).getAllByRole("link").map((l) => l.textContent)).toEqual(["Empresas", "Chamados"]);
  });

  it("navega por dentro e troca o menu pelo seletor", () => {
    const { onNavegar, aoMudarMenu } = montar("lateral");
    const lateral = document.querySelector(".v2-lateral") as HTMLElement;
    fireEvent.click(within(lateral).getByRole("link", { name: /Cobranças/ }));
    expect(onNavegar).toHaveBeenCalledWith("/cobrancas");
    fireEvent.click(screen.getByRole("button", { name: /Topo/ }));
    expect(aoMudarMenu).toHaveBeenCalledWith("topo");
  });

  it("o menu da conta leva so os itens do produto", () => {
    const { sair } = montar("lateral", { contexto: { titulo: "Cert4All", detalhe: "Admin Global" } });
    fireEvent.click(screen.getByRole("button", { name: "Conta de Alex Novaes" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getAllByRole("menuitem").map((b) => b.textContent)).toEqual(["Sair"]);
    expect(menu).toHaveTextContent("Cert4All · Admin Global");
    fireEvent.click(within(menu).getByRole("menuitem", { name: "Sair" }));
    expect(sair).toHaveBeenCalled();
  });
});

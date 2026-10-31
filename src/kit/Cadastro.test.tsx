// @vitest-environment jsdom
import "../test/setup";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Package } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { BlocoDeArquivo, BlocoDoCadastro, CabecalhoDaTela, CampoDoCadastro, PaginaDeCadastro } from "./index";

/*
  A PAGINA DE CADASTRO E O CABECALHO DE TELA (ADR-0069). O que prende: Cancelar a esquerda e a primaria a direita no
  rodape, repetidos no cabecalho; Enter envia; o `motivo` desabilita a primaria E e dito, ligado a ela; o erro geral
  vem no rodape como alerta; o campo marca obrigatorio e liga ajuda e erro; o bloco de arquivo passa pelos estados.
*/
function montarCadastro(extra: Partial<Parameters<typeof PaginaDeCadastro>[0]> = {}) {
  const aoSalvar = vi.fn();
  const aoCancelar = vi.fn();
  const voltar = vi.fn();
  render(<PaginaDeCadastro icone={<Package size={18} />} titulo="Incluir bundle" rotuloDaPrimaria="Salvar bundle"
    trilha={[{ rotulo: "Estoque", href: "/v2/estoque", aoClicar: voltar }]} aoSalvar={aoSalvar} aoCancelar={aoCancelar} {...extra}>
    <BlocoDoCadastro titulo="Identificação">
      <CampoDoCadastro rotulo="Código do bundle" obrigatorio ajuda="Como está na etiqueta." erro={extra.erro === "campo" ? "Obrigatório." : null}>
        {(p) => <input {...p} name="codigo" />}
      </CampoDoCadastro>
    </BlocoDoCadastro>
  </PaginaDeCadastro>);
  return { aoSalvar, aoCancelar, voltar };
}

describe("a página de cadastro", () => {
  it("trilha, título e as duas ações nos dois lugares — Cancelar à esquerda e a primária à direita no rodapé", () => {
    const { aoCancelar, voltar } = montarCadastro();
    expect(screen.getByRole("heading", { level: 1, name: "Incluir bundle" })).toBeInTheDocument();
    const trilha = within(screen.getByRole("navigation", { name: "Você está em" }));
    fireEvent.click(trilha.getByRole("link", { name: "Estoque" }));
    expect(voltar).toHaveBeenCalled();
    const rodape = screen.getByRole("contentinfo");
    const botoes = within(rodape).getAllByRole("button").map((b) => b.textContent);
    expect(botoes[0]).toBe("Cancelar");
    expect(botoes[botoes.length - 1]).toBe("Salvar bundle");
    expect(screen.getAllByRole("button", { name: "Salvar bundle" })).toHaveLength(2);
    fireEvent.click(within(rodape).getByRole("button", { name: "Cancelar" }));
    expect(aoCancelar).toHaveBeenCalled();
  });

  it("Enter num campo envia", () => {
    const { aoSalvar } = montarCadastro();
    fireEvent.submit(screen.getByRole("textbox", { name: /Código do bundle/ }).closest("form")!);
    expect(aoSalvar).toHaveBeenCalledTimes(1);
  });

  it("com motivo, a primária fica desabilitada e o motivo é dito e ligado a ela", () => {
    const { aoSalvar } = montarCadastro({ motivo: "Escolha o material." });
    const [topo, rodape] = screen.getAllByRole("button", { name: "Salvar bundle" });
    expect(topo).toBeDisabled();
    expect(rodape).toBeDisabled();
    expect(rodape).toHaveAccessibleDescription("Escolha o material.");
    fireEvent.submit(screen.getByRole("textbox", { name: /Código do bundle/ }).closest("form")!);
    expect(aoSalvar).not.toHaveBeenCalled();
  });

  it("o erro geral vem no rodapé como alerta", () => {
    montarCadastro({ erro: "Este bundle já existe." });
    expect(within(screen.getByRole("contentinfo")).getByRole("alert")).toHaveTextContent("Este bundle já existe.");
  });

  it("o campo marca obrigatório e liga ajuda e erro", () => {
    montarCadastro({ erro: "campo" });
    const campo = screen.getByRole("textbox", { name: /Código do bundle/ });
    expect(campo).toBeRequired();
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Como está na etiqueta. Obrigatório.");
  });
});

describe("o bloco de arquivo", () => {
  const arquivo = new File(["x".repeat(2048)], "romaneio.xls");

  it("vazio oferece escolher; escolhido mostra nome e tamanho e deixa tirar", () => {
    const aoTirar = vi.fn();
    const { rerender } = render(<BlocoDeArquivo rotulo="Planilha .xls" aceita=".xls" arquivos={[]} aoEscolher={vi.fn()} aoTirar={aoTirar} />);
    expect(screen.getByRole("button", { name: "Escolher arquivo" })).toBeInTheDocument();
    rerender(<BlocoDeArquivo rotulo="Planilha .xls" aceita=".xls" arquivos={[arquivo]} aoEscolher={vi.fn()} aoTirar={aoTirar} />);
    expect(screen.getByText("romaneio.xls")).toBeInTheDocument();
    expect(screen.getByText("2 kB")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tirar romaneio.xls" }));
    expect(aoTirar).toHaveBeenCalledWith(0);
    expect(screen.getByRole("button", { name: "Trocar arquivo" })).toBeInTheDocument();
  });

  it("o erro é dito; enviando mostra o progresso e não deixa tirar", () => {
    const { rerender } = render(<BlocoDeArquivo rotulo="Fotos" aceita="image/*" multiplo arquivos={[arquivo]} aoEscolher={vi.fn()} aoTirar={vi.fn()} erro="Linha 12: bundle sem código." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Linha 12: bundle sem código.");
    rerender(<BlocoDeArquivo rotulo="Fotos" aceita="image/*" multiplo arquivos={[arquivo]} aoEscolher={vi.fn()} aoTirar={vi.fn()} progresso={40} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
    expect(screen.getByRole("button", { name: "Tirar romaneio.xls" })).toBeDisabled();
  });
});

describe("o cabeçalho de tela", () => {
  it("título, recorte e a primária por último", () => {
    render(<CabecalhoDaTela icone={<Package size={16} />} titulo="Acompanhamentos" recorte="Equipe toda"
      secundarias={<button type="button">Atualizar</button>} primaria={<button type="button">Abrir Quadro</button>} />);
    expect(screen.getByRole("heading", { level: 1, name: "Acompanhamentos" })).toBeInTheDocument();
    expect(screen.getByText("Equipe toda")).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Atualizar", "Abrir Quadro"]);
  });
});

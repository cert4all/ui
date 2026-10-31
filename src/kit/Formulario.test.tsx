// @vitest-environment jsdom
import "../test/setup";
import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Campo, Campos, Formulario, Secao, type Valores } from "./Formulario";

/*
  SECAO, CAMPO E FORMULARIO. O que prende: em leitura o vazio e "—" (nunca um campo em branco); o lapis poe o
  formulario em edicao; salvar valida TODOS os campos, mostra o erro embaixo de cada um (aria-invalid + descricao) e
  foca o primeiro; o erro do servidor aparece no rodape; cancelar volta ao que era; a secao recolhe.
*/
function Cliente({ aoSalvar }: { aoSalvar: (v: Valores) => Promise<void> | void }) {
  const [fonte, setFonte] = useState<Valores>({ nome: "Bedrosians", email: "", pais: "US" });
  return <Formulario rotulo="Detalhes do cliente" valores={fonte} aoSalvar={async (v) => { await aoSalvar(v); setFonte(v); }}>
    <Secao titulo="Cadastro" dica="Vem da importação e do que a equipe corrigiu." recolhivel>
      <Campos>
        <Campo nome="nome" rotulo="Nome" obrigatorio />
        <Campo nome="email" rotulo="E-mail" tipo="email" />
        <Campo nome="pais" rotulo="País" tipo="selecao" opcoes={[{ valor: "US", rotulo: "Estados Unidos" }, { valor: "BR", rotulo: "Brasil" }]} />
        <Campo rotulo="Origem" valor="Importação" />
      </Campos>
    </Secao>
  </Formulario>;
}

describe("o formulário de registro do kit", () => {
  it("lê com ausência honesta e a opção pelo rótulo", () => {
    render(<Cliente aoSalvar={vi.fn()} />);
    expect(screen.getByText("Bedrosians")).toBeInTheDocument();
    expect(screen.getByText("Estados Unidos")).toBeInTheDocument();
    expect(screen.getByText("—").closest("dd")).toHaveClass("is-ausente");
    expect(screen.queryByRole("button", { name: "Editar Origem" })).toBeNull();
  });

  it("valida todos os campos, mostra o erro em cada um e foca o primeiro", async () => {
    const salvar = vi.fn();
    render(<Cliente aoSalvar={salvar} />);
    fireEvent.click(screen.getByRole("button", { name: "Editar E-mail" }));
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: " " } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "sem-arroba" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    const nome = screen.getByLabelText(/^Nome/);
    expect(nome).toHaveAttribute("aria-invalid", "true");
    expect(nome).toHaveAccessibleDescription("Obrigatório.");
    expect(screen.getByLabelText("E-mail")).toHaveAccessibleDescription("E-mail inválido.");
    expect(document.activeElement).toBe(nome);
    expect(salvar).not.toHaveBeenCalled();
    fireEvent.change(nome, { target: { value: "Bedrosians Tile" } });
    expect(nome).not.toHaveAttribute("aria-invalid");
  });

  it("salva e volta à leitura; o erro do servidor fica no rodapé", async () => {
    const salvar = vi.fn().mockRejectedValueOnce(new Error("O país precisa ser o código de duas letras, como BR ou US.")).mockResolvedValueOnce(undefined);
    render(<Cliente aoSalvar={salvar} />);
    fireEvent.click(screen.getByRole("button", { name: "Editar País" }));
    fireEvent.change(screen.getByLabelText("País"), { target: { value: "BR" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("duas letras");
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull());
    expect(salvar).toHaveBeenLastCalledWith({ nome: "Bedrosians", email: "", pais: "BR" });
    expect(screen.getByText("Brasil")).toBeInTheDocument();
  });

  it("cancelar volta ao que era, e a seção recolhe", () => {
    render(<Cliente aoSalvar={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Editar Nome" }));
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: "Outro" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("Bedrosians")).toBeInTheDocument();
    const alternar = screen.getByRole("button", { name: "Cadastro" });
    fireEvent.click(alternar);
    expect(alternar).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Bedrosians")).not.toBeVisible();
  });
});

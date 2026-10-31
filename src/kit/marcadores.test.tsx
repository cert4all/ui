// @vitest-environment jsdom
import "../test/setup";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CabecalhoDaTela } from "./Cabecalho";
import { PaginaInteira } from "./GradeDeCartoes";
import { ListView } from "./ListView";

/* OS MARCADORES DE TESTE (C40, 31/10): as telas do Cert4All perderam `data-testid` porque o kit não os repassava. */
describe("o kit repassa os marcadores de teste", () => {
  it("página, título e lista", () => {
    render(<PaginaInteira testId="pagina">
      <CabecalhoDaTela icone={null} titulo="Leads" testIdDoTitulo="text-page-title" />
      <ListView titulo="Leads" colunas={[{ id: "n", rotulo: "Nome", celula: (l: { id: string }) => l.id }]} linhas={[{ id: "a" }]} chave={(l) => l.id} testId="lista" />
    </PaginaInteira>);
    expect(screen.getByTestId("pagina")).toBeInTheDocument();
    expect(screen.getByTestId("text-page-title")).toHaveTextContent("Leads");
    expect(screen.getByTestId("lista")).toHaveClass("v2-lista");
  });
});

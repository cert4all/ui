// @vitest-environment jsdom
import "../test/setup";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Erro } from "./Estados";
import { configurarKit, localeAtual, numeroLocal, t, tn } from "./textos";

/*
  O TEXTO INJETAVEL. Sem configurar, o kit fala portugues com `{x}` interpolado e numero em pt-BR (o Cert4All). Com
  `configurarKit`, o texto dos componentes passa pelo `t()` do produto (o Stonen, com os idiomas dele).
*/
const PADRAO = { t: (pt: string, v?: Record<string, string | number>) => pt.replace(/\{(\w+)\}/g, (_, n: string) => String(v?.[n] ?? `{${n}}`)), locale: () => "pt-BR" };
afterEach(() => configurarKit(PADRAO));

describe("o texto do kit", () => {
  it("fala portugues sem configurar", () => {
    expect(t("Ver {n} itens", { n: 3 })).toBe("Ver 3 itens");
    expect(tn(1, "1 reserva", "{n} reservas")).toBe("1 reserva");
    expect(tn(2, "1 reserva", "{n} reservas")).toBe("2 reservas");
    expect(localeAtual()).toBe("pt-BR");
    expect(numeroLocal(1234.5)).toBe("1.234,5");
  });

  it("passa pelo t() do produto, inclusive dentro dos componentes", () => {
    configurarKit({ t: (pt) => `[en] ${pt}`, locale: () => "en-US" });
    render(<Erro />);
    expect(screen.getByText(/^\[en\] /)).toBeInTheDocument();
    expect(numeroLocal(1234.5)).toBe("1,234.5");
  });
});

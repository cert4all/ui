import type { MouseEvent, ReactNode } from "react";
import { Carregando, Erro, SemPermissao, Vazio } from "./Estados";
import { localeAtual, t } from "./textos";

/*
  A LISTA RELACIONADA — o cartao da aba "Relacionado" de um registro (destinatarios da oferta, reservas, contatos do
  cliente, ofertas do bundle). Cabecalho com icone, titulo e CONTAGEM; o corpo e a lista curta (normalmente as
  primeiras linhas) e, quando ha mais, o "Ver todos" leva a list view ja recortada (ADR-0036: a porta abre recortada).

  A contagem desconhecida (carregando, sem permissao) e "—", nunca 0.
*/
export function ListaRelacionada({ titulo, icone, contagem, verTodos, estado = {}, vazio = t("Nenhum registro."), children }: {
  titulo: string;
  icone?: ReactNode;
  contagem: number | null;
  verTodos?: { rotulo?: string; href: string; aoClicar?: () => void };
  estado?: { carregando?: boolean; erro?: boolean; semPermissao?: boolean; mensagem?: string };
  vazio?: ReactNode;
  children?: ReactNode;
}) {
  const seguir = (e: MouseEvent) => { if (verTodos?.aoClicar) { e.preventDefault(); verTodos.aoClicar(); } };
  let corpo: ReactNode = children;
  if (estado.semPermissao) corpo = <SemPermissao>{estado.mensagem}</SemPermissao>;
  else if (estado.erro) corpo = <Erro>{estado.mensagem ?? t("Não foi possível carregar: {oque}.", { oque: titulo.toLocaleLowerCase(localeAtual()) })}</Erro>;
  else if (estado.carregando) corpo = <Carregando />;
  else if (contagem === 0) corpo = <Vazio>{vazio}</Vazio>;
  return <section className="v2-relacionada" aria-label={titulo}>
    <header>
      {icone && <span className="v2-icone-objeto is-pequeno" aria-hidden="true">{icone}</span>}
      <h2>{titulo}</h2>
      <span className="v2-contador" aria-label={contagem === null ? t("contagem indisponível") : `${contagem}`}>{contagem ?? "—"}</span>
      {verTodos && contagem !== 0 && <a className="v2-relacionada-todos" href={verTodos.href} onClick={seguir}>{verTodos.rotulo ?? t("Ver todos")}</a>}
    </header>
    {corpo}
  </section>;
}

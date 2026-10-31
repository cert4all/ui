import type { ReactNode } from "react";
import { Dica } from "./Dica";

/*
  O CABECALHO DE TELA DA V2 (ADR-0069) — a mesma regua para Cockpit, Consulta sem list view e Mesa de trabalho:

      [icone] Titulo (i)  [recorte atual]                     [ferramentas]  [secundaria] [PRIMARIA]

  - Uma linha, compacto. O RECORTE diz o que se esta vendo agora ("Equipe toda", "Ana · Vence em breve") — e texto,
    nao filtro: os filtros moram nas ferramentas ou na barra da tela.
  - A ACAO PRIMARIA e uma so e fica sempre a direita, fora do que rola. Secundarias sao subordinadas (botao comum).
  - Explicacao vai no `dica` (o (i)), nunca em paragrafo.
*/
export function CabecalhoDaTela({ icone, titulo, idDoTitulo, dica, recorte, ferramentas, secundarias, primaria, classe, semTitulo }: {
  icone: ReactNode;
  titulo: string;
  idDoTitulo?: string;
  dica?: string;
  recorte?: ReactNode;
  ferramentas?: ReactNode;
  secundarias?: ReactNode;
  primaria?: ReactNode;
  classe?: string;
  /** A tela dentro da moldura da v1 (o Cavalete, 20/10): o titulo e o do cabecalho da v1 — um h1 so (ADR-0023). */
  semTitulo?: boolean;
}) {
  return <header className={`v2-cartao v2-cabecalho-tela${classe ? ` ${classe}` : ""}`}>
    {!semTitulo && <><span className="v2-icone-objeto" aria-hidden="true">{icone}</span>
      <h1 {...(idDoTitulo ? { id: idDoTitulo } : {})}>{titulo}</h1></>}
    {dica && <Dica texto={dica} />}
    {recorte && <span className="v2-cabecalho-tela-recorte">{recorte}</span>}
    {(ferramentas || secundarias || primaria) && <span className="v2-cabecalho-tela-acoes">
      {ferramentas}
      {secundarias}
      {primaria}
    </span>}
  </header>;
}

import type { MouseEvent, ReactNode } from "react";
import type { Tom } from "./Selo";
import { Dica } from "./Dica";

/*
  O PAINEL DE INDICADORES — os numeros de uma tela de SINTESE (Visao de Hoje, Funil). Dashboard nao e superficie de
  trabalho (UI_PRINCIPLES §6): este painel nao vai acima de lista, mesa ou formulario.

  TODO NUMERO E UMA PORTA (ADR-0036): com `href`, o cartao leva ao registro JA RECORTADO. Numero desconhecido e "—",
  nunca 0; a explicacao do numero vai no (i), nunca em paragrafo.
*/
export type Indicador = {
  id: string;
  rotulo: string;
  /** O numero ja formatado; `null` e desconhecido ("—"). */
  valor: ReactNode | null;
  /** Uma linha curta abaixo do numero (comparacao, periodo). */
  detalhe?: ReactNode;
  tom?: Tom;
  dica?: string;
  /** A porta: para onde o numero leva, ja filtrado. */
  href?: string;
  aoAbrir?: () => void;
  /** `data-testid` do cartão do indicador (presente também enquanto o número carrega). */
  testId?: string;
};

/*
  `faixa`: os indicadores numa LINHA SO (a tela nao rola — diretiva do owner, 10/10/2026). Se nao couberem na largura,
  a faixa rola de lado DENTRO dela mesma; a pagina nao cresce.
*/
export function PainelDeIndicadores({ rotulo, indicadores, faixa = false }: { rotulo: string; indicadores: Indicador[]; faixa?: boolean }) {
  return <ul className={`v2-indicadores${faixa ? " is-faixa" : ""}`} aria-label={rotulo} {...(faixa ? { tabIndex: 0 } : {})}>
    {indicadores.map((ind) => {
      const conteudo = <>
        <span className="v2-indicador-rotulo">{ind.rotulo}</span>
        <strong className={ind.valor === null ? "is-ausente" : undefined}>{ind.valor ?? "—"}</strong>
        {ind.detalhe && <span className="v2-indicador-detalhe">{ind.detalhe}</span>}
      </>;
      const seguir = (e: MouseEvent) => {
        if (!ind.aoAbrir || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        ind.aoAbrir();
      };
      return <li key={ind.id} className={`v2-cartao v2-indicador${ind.tom ? ` is-${ind.tom}` : ""}`} {...(ind.testId ? { "data-testid": ind.testId } : {})}>
        {ind.href ? <a href={ind.href} onClick={seguir}>{conteudo}</a>
          : ind.aoAbrir ? <button type="button" onClick={ind.aoAbrir}>{conteudo}</button>
            : <div>{conteudo}</div>}
        {ind.dica && <span className="v2-indicador-dica"><Dica texto={ind.dica} /></span>}
      </li>;
    })}
  </ul>;
}

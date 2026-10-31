import { useState, type DragEvent, type ReactNode } from "react";
import type { Tom } from "./Selo";
import { Dica } from "./Dica";
import { t } from "./textos";

/*
  O KANBAN DA V2 — colunas por etapa, cartoes, contagem por coluna. As colunas rolam de lado DENTRO da propria caixa
  (a pagina nunca); cada coluna rola na vertical por dentro.

  MOVER E OPCIONAL, E TECLADO E OBRIGATORIO QUANDO HA. Com `aoMover`, cada cartao ganha o seletor "Mover para"
  (teclado e toque) e pode ser arrastado (mouse). Arrastar e atalho, nunca o unico caminho. Quem decide se o movimento
  vale e a tela/API — o kanban so pede.
*/
export type ColunaDoKanban = { id: string; rotulo: string; tom?: Tom; dica?: string };

export function Kanban<T>({ rotulo, colunas, itens, colunaDe, chave, tituloDe, cartao, aoAbrir, aoMover, vazioDaColuna = t("Nada nesta etapa.") }: {
  /** Nome do quadro para o leitor de tela. */
  rotulo: string;
  colunas: ColunaDoKanban[];
  itens: T[];
  colunaDe: (item: T) => string;
  chave: (item: T) => string;
  /** Nome curto do cartao, usado no nome acessivel ("Abrir X", "Mover X para"). */
  tituloDe: (item: T) => string;
  cartao: (item: T) => ReactNode;
  aoAbrir?: (item: T) => void;
  aoMover?: (item: T, paraColuna: string) => void;
  vazioDaColuna?: ReactNode;
}) {
  const [sobre, setSobre] = useState<string | null>(null);
  const porId = new Map(itens.map((i) => [chave(i), i]));
  const soltar = (e: DragEvent, coluna: string) => {
    e.preventDefault();
    setSobre(null);
    const item = porId.get(e.dataTransfer.getData("text/plain"));
    if (item && aoMover && colunaDe(item) !== coluna) aoMover(item, coluna);
  };
  return <div className="v2-kanban" role="group" aria-label={rotulo}>
    {colunas.map((coluna) => {
      const daColuna = itens.filter((i) => colunaDe(i) === coluna.id);
      return <section key={coluna.id} className={`v2-kanban-coluna${sobre === coluna.id ? " is-alvo" : ""}`} aria-label={`${coluna.rotulo}, ${daColuna.length}`}
        onDragOver={aoMover ? (e) => { e.preventDefault(); setSobre(coluna.id); } : undefined}
        onDragLeave={aoMover ? () => setSobre(null) : undefined}
        onDrop={aoMover ? (e) => soltar(e, coluna.id) : undefined}>
        <header className={coluna.tom ? `is-${coluna.tom}` : undefined}>
          <h2>{coluna.rotulo}</h2>
          {coluna.dica && <Dica texto={coluna.dica} />}
          <span className="v2-contador">{daColuna.length}</span>
        </header>
        {daColuna.length === 0 ? <p className="v2-kanban-vazio">{vazioDaColuna}</p> : <ul>
          {daColuna.map((item) => {
            const id = chave(item);
            const titulo = tituloDe(item);
            return <li key={id} className="v2-kanban-cartao" draggable={Boolean(aoMover)}
              onDragStart={aoMover ? (e) => { e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; } : undefined}>
              {aoAbrir ? <button type="button" className="v2-kanban-abrir" aria-label={t("Abrir {titulo}", { titulo })} onClick={() => aoAbrir(item)}>{cartao(item)}</button>
                : <div className="v2-kanban-conteudo">{cartao(item)}</div>}
              {aoMover && <label className="v2-kanban-mover">
                <span className="v2-sr">{t("Mover {titulo} para", { titulo })}</span>
                <select value={coluna.id} onChange={(e) => aoMover(item, e.target.value)}>
                  {colunas.map((c) => <option key={c.id} value={c.id}>{c.id === coluna.id ? t("Em {etapa}", { etapa: c.rotulo }) : t("Mover para {etapa}", { etapa: c.rotulo })}</option>)}
                </select>
              </label>}
            </li>;
          })}
        </ul>}
      </section>;
    })}
  </div>;
}

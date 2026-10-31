import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
  AS ABAS DE UM REGISTRO (Itens / Detalhes / Relacionado...). Padrao WAI-ARIA de abas com ROVING TABINDEX: so a aba
  ativa entra no Tab; setas esquerda/direita trocam (dando a volta), Home e End vao as pontas, e a troca acompanha o
  foco (ativacao automatica). O painel e um so — trocar de aba troca o CONTEUDO, nunca a casca (ADR-0042).

  Controlada (`ativa` + `aoTrocar`) ou nao (`inicial`).
*/
export type AbaDoRegistro = { id: string; rotulo: string; contador?: ReactNode; testId?: string };

export function Abas({ rotulo, abas, ativa, inicial, aoTrocar, children, classe }: {
  /** Nome do grupo de abas ("Seções da oferta"). */
  rotulo: string;
  abas: AbaDoRegistro[];
  ativa?: string;
  inicial?: string;
  aoTrocar?: (id: string) => void;
  /** O conteudo do painel da aba ativa. */
  children: (ativa: string) => ReactNode;
  classe?: string;
}) {
  const [interna, setInterna] = useState(inicial ?? abas[0]?.id ?? "");
  const atual = ativa ?? interna;
  const base = useId();
  const botoes = useRef<Record<string, HTMLButtonElement | null>>({});
  const trocar = (id: string) => { if (ativa === undefined) setInterna(id); aoTrocar?.(id); };

  const tecla = (e: KeyboardEvent<HTMLButtonElement>, indice: number) => {
    const destino = e.key === "ArrowRight" ? indice + 1 : e.key === "ArrowLeft" ? indice - 1
      : e.key === "Home" ? 0 : e.key === "End" ? abas.length - 1 : null;
    if (destino === null) return;
    e.preventDefault();
    const proxima = abas[(destino + abas.length) % abas.length]!;
    trocar(proxima.id);
    botoes.current[proxima.id]?.focus();
  };

  return <div className={`v2-cartao v2-registro-abas${classe ? ` ${classe}` : ""}`}>
    <div className="v2-abas-registro" role="tablist" aria-label={rotulo}>
      {abas.map((a, i) => <button key={a.id} ref={(no) => { botoes.current[a.id] = no; }} id={`${base}-aba-${a.id}`} type="button" role="tab" {...(a.testId ? { "data-testid": a.testId } : {})}
        aria-selected={atual === a.id} aria-controls={`${base}-painel`} tabIndex={atual === a.id ? 0 : -1}
        onClick={() => trocar(a.id)} onKeyDown={(e) => tecla(e, i)}>
        {a.rotulo}{a.contador !== undefined && <span className="v2-contador">{a.contador}</span>}
      </button>)}
    </div>
    <div id={`${base}-painel`} role="tabpanel" aria-labelledby={`${base}-aba-${atual}`} className="v2-painel" tabIndex={0}>
      {children(atual)}
    </div>
  </div>;
}

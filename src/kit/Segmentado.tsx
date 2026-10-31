import { useRef, type KeyboardEvent, type ReactNode } from "react";

/*
  O SELETOR SEGMENTADO — uma fileira de botoes que troca QUAL painel aparece. E o padrao WAI-ARIA de abas (o painel
  trocado e um so por vez), com ROVING TABINDEX: so a opcao ativa entra no Tab; setas esquerda/direita trocam (dando a
  volta), Home e End vao as pontas, e a troca acompanha o foco.

  Usado em dois lugares do kit: as abas DENTRO de um cartao da grade (`GradeDeCartoes`) e o seletor "um cartao por vez"
  do celular (a grade e a pagina de registro). Cada opcao diz qual painel controla (`controla`, o id do painel).
*/
export type OpcaoSegmentada = {
  id: string;
  rotulo: string;
  contador?: ReactNode;
  /** O `id` do painel que esta opcao mostra (`aria-controls`). */
  controla?: string;
  /** O `id` do proprio botao, para o painel se rotular por ele (`aria-labelledby`). */
  idDoBotao?: string;
  testId?: string;
};

export function Segmentado({ rotulo, opcoes, ativa, aoTrocar, classe }: {
  /** Nome do grupo para o leitor de tela ("Cartão em tela", "Seções do cartão"). */
  rotulo: string;
  opcoes: OpcaoSegmentada[];
  ativa: string;
  aoTrocar: (id: string) => void;
  classe?: string;
}) {
  const botoes = useRef<Record<string, HTMLButtonElement | null>>({});
  const tecla = (e: KeyboardEvent<HTMLButtonElement>, indice: number) => {
    const destino = e.key === "ArrowRight" ? indice + 1 : e.key === "ArrowLeft" ? indice - 1
      : e.key === "Home" ? 0 : e.key === "End" ? opcoes.length - 1 : null;
    if (destino === null) return;
    e.preventDefault();
    const proxima = opcoes[(destino + opcoes.length) % opcoes.length]!;
    aoTrocar(proxima.id);
    botoes.current[proxima.id]?.focus();
  };
  return <div className={`v2-segmentado${classe ? ` ${classe}` : ""}`} role="tablist" aria-label={rotulo}>
    {opcoes.map((o, i) => <button key={o.id} ref={(no) => { botoes.current[o.id] = no; }} type="button" role="tab" {...(o.testId ? { "data-testid": o.testId } : {})}
      id={o.idDoBotao} aria-selected={ativa === o.id} aria-controls={o.controla} tabIndex={ativa === o.id ? 0 : -1}
      onClick={() => aoTrocar(o.id)} onKeyDown={(e) => tecla(e, i)}>
      {o.rotulo}{o.contador !== undefined && <span className="v2-contador">{o.contador}</span>}
    </button>)}
  </div>;
}

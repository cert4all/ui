import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/*
  O MENU SUSPENSO DA V2 — o "Mais" das acoes do registro, o "Mais" das abas do app e qualquer lista curta de acoes.

  Teclado como num menu de verdade: abrir leva o foco ao primeiro item; setas para cima e para baixo andam (dando a
  volta), Home e End vao as pontas, Esc fecha e devolve o foco ao botao, Tab fecha. Clique fora fecha.
*/
export type ItemDeMenu = {
  id: string;
  rotulo: string;
  icone?: ReactNode | undefined;
  aoEscolher: () => void;
  desabilitado?: boolean | undefined;
  /** O item e a pagina/opcao atual. */
  atual?: boolean | undefined;
  perigo?: boolean | undefined;
  /** Depois do rotulo (ex.: o icone de "abre na v1" e o texto dele para o leitor de tela). */
  extra?: ReactNode | undefined;
};

export function Menu({ rotulo, itens, conteudoDoBotao, classeDoBotao = "v2-botao", alinhar = "fim", abrir = "abaixo", desabilitado = false, dica, testId }: {
  /** Nome acessivel do botao (ex.: "Mais ações"). */
  rotulo: string;
  itens: ItemDeMenu[];
  /** O que o botao mostra; sem isto, o proprio `rotulo` com a seta. */
  conteudoDoBotao?: ReactNode;
  classeDoBotao?: string;
  alinhar?: "inicio" | "fim";
  /** Para cima quando o botao mora num rodape (a lista abaixo sairia da gaveta). */
  abrir?: "abaixo" | "acima";
  desabilitado?: boolean;
  /** O `title` do botao. */
  dica?: string;
  /** `data-testid` do botao. */
  testId?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const id = useId();

  const itensFocaveis = () => [...(caixa.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)") ?? [])];
  const fechar = (devolverFoco: boolean) => { setAberto(false); if (devolverFoco) botao.current?.focus(); };

  useEffect(() => {
    if (!aberto) return;
    itensFocaveis()[0]?.focus();
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node) && !botao.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    const lista = itensFocaveis();
    const atual = lista.indexOf(document.activeElement as HTMLButtonElement);
    const ir = (i: number) => { e.preventDefault(); lista[(i + lista.length) % lista.length]?.focus(); };
    if (e.key === "ArrowDown") ir(atual + 1);
    else if (e.key === "ArrowUp") ir(atual - 1);
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(lista.length - 1);
    else if (e.key === "Escape") { e.preventDefault(); fechar(true); }
    else if (e.key === "Tab") fechar(false);
  };

  return <div className="v2-menu-ancora">
    <button ref={botao} type="button" className={classeDoBotao} {...(testId ? { "data-testid": testId } : {})} aria-haspopup="menu" aria-expanded={aberto} aria-controls={aberto ? id : undefined}
      aria-label={conteudoDoBotao ? rotulo : undefined} disabled={desabilitado} title={dica} onClick={() => setAberto((v) => !v)}>
      {conteudoDoBotao ?? <>{rotulo}<ChevronDown size={14} aria-hidden="true" /></>}
    </button>
    {aberto && <div ref={caixa} id={id} className={`v2-menu is-${alinhar}${abrir === "acima" ? " is-acima" : ""}`} role="menu" aria-label={rotulo} onKeyDown={tecla}>
      {itens.map((item) => <button key={item.id} type="button" role="menuitem" disabled={item.desabilitado}
        className={item.perigo ? "is-perigo" : undefined} aria-current={item.atual ? "page" : undefined}
        onClick={() => { fechar(true); item.aoEscolher(); }}>
        {item.icone}{item.rotulo}{item.extra}
      </button>)}
    </div>}
  </div>;
}

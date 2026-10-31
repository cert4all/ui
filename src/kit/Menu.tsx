import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

/*
  O MENU SUSPENSO DA V2 — o "Mais" das acoes do registro, o "Mais" das abas do app e qualquer lista curta de acoes.

  Teclado como num menu de verdade: abrir leva o foco ao primeiro item; setas para cima e para baixo andam (dando a
  volta), Home e End vao as pontas, Esc fecha e devolve o foco ao botao, Tab fecha. Clique fora fecha.
*/
export type ItemDeMenu = {
  id: string;
  /** `data-testid` do item. */
  testId?: string | undefined;
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

export function Menu({ rotulo, itens, conteudoDoBotao, classeDoBotao = "v2-botao", alinhar = "fim", abrir = "abaixo", desabilitado = false, dica, testId, flutuante = false }: {
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
  /**
   * A lista sai do fluxo: portal na raiz `.v2`, posição fixa junto do botão (abre para cima se não couber embaixo).
   * Para o menu de uma LINHA de tabela ou de um cartão que rola por dentro, onde a lista seria cortada (C40, 31/10).
   * Rolar ou redimensionar fecha o menu.
   */
  flutuante?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const id = useId();
  const [posicao, setPosicao] = useState<CSSProperties | null>(null);

  const itensFocaveis = () => [...(caixa.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]:not(:disabled)") ?? [])];
  const fechar = (devolverFoco: boolean) => { setAberto(false); if (devolverFoco) botao.current?.focus(); };

  useEffect(() => {
    if (!aberto) return;
    itensFocaveis()[0]?.focus();
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node) && !botao.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    if (!flutuante) return () => document.removeEventListener("mousedown", fora);
    const sair = (e: Event) => { if (!caixa.current?.contains(e.target as Node)) setAberto(false); };
    window.addEventListener("scroll", sair, true);
    window.addEventListener("resize", sair);
    return () => {
      document.removeEventListener("mousedown", fora);
      window.removeEventListener("scroll", sair, true);
      window.removeEventListener("resize", sair);
    };
  }, [aberto, flutuante]);

  const alternar = () => {
    if (!aberto && flutuante && botao.current) {
      const r = botao.current.getBoundingClientRect();
      const embaixo = window.innerHeight - r.bottom;
      const acima = abrir === "acima" || (embaixo < 240 && r.top > embaixo);
      setPosicao({
        position: "fixed",
        // O lado que não ancora vai a "auto": a regra de `.v2-menu` (`top: calc(100% + 6px)`) colapsava a lista
        // fora da tela quando ela abria para cima (C40, 31/10).
        ...(acima ? { top: "auto", bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6, bottom: "auto" }),
        // Alinhado ao início, a lista não passa da borda direita (240 px de largura mínima + 8 de margem).
        ...(alinhar === "fim"
          ? { right: Math.max(8, window.innerWidth - r.right), left: "auto" }
          : { left: Math.max(8, Math.min(r.left, window.innerWidth - 248)), right: "auto" }),
        maxWidth: "calc(100vw - 16px)",
        maxHeight: Math.max(160, (acima ? r.top : embaixo) - 16),
        overflowY: "auto",
      });
    }
    setAberto((v) => !v);
  };

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

  const lista = <div ref={caixa} id={id} className={`v2-menu is-${alinhar}${abrir === "acima" ? " is-acima" : ""}${flutuante ? " is-flutuante" : ""}`} style={flutuante && posicao ? posicao : undefined} role="menu" aria-label={rotulo} onKeyDown={tecla}>
      {itens.map((item) => <button key={item.id} type="button" role="menuitem" disabled={item.desabilitado} {...(item.testId ? { "data-testid": item.testId } : {})}
        className={item.perigo ? "is-perigo" : undefined} aria-current={item.atual ? "page" : undefined}
        onClick={() => { fechar(true); item.aoEscolher(); }}>
        {item.icone}{item.rotulo}{item.extra}
      </button>)}
  </div>;

  return <div className="v2-menu-ancora">
    <button ref={botao} type="button" className={classeDoBotao} {...(testId ? { "data-testid": testId } : {})} aria-haspopup="menu" aria-expanded={aberto} aria-controls={aberto ? id : undefined}
      aria-label={conteudoDoBotao ? rotulo : undefined} disabled={desabilitado} title={dica} onClick={alternar}>
      {conteudoDoBotao ?? <>{rotulo}<ChevronDown size={14} aria-hidden="true" /></>}
    </button>
    {aberto && (flutuante ? createPortal(lista, document.querySelector(".v2") ?? document.body) : lista)}
  </div>;
}

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { t } from "./textos";

/*
  DIALOGO E GAVETA — as duas sobreposicoes da v2. O dialogo e central e curto (confirmar, um formulario pequeno);
  a gaveta e o painel lateral (detalhe ao lado da lista, filtros, o seletor de areas no celular).

  As duas: portal na raiz `.v2` (herdam tokens e fonte), `aria-modal`, titulo como nome, foco no primeiro controle
  ao abrir, Tab preso dentro, Esc e o fundo fecham, e o foco VOLTA para quem abriu. Movimento so sem
  `prefers-reduced-motion`.
*/
function useSobreposicao(aberta: boolean, aoFechar: () => void, retorno: RefObject<HTMLElement | null> | undefined) {
  const caixa = useRef<HTMLDivElement>(null);
  const fechar = useRef(aoFechar);
  fechar.current = aoFechar;
  useEffect(() => {
    if (!aberta) return;
    // Quem abriu recebe o foco de volta. No Safari o clique nao foca o botao: por isso `retorno`, quando ha.
    const anterior = retorno?.current ?? document.activeElement as HTMLElement | null;
    const focaveis = () => [...(caixa.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    ) ?? [])];
    // O foco abre no primeiro controle do CORPO (o filtro, o primeiro campo); o "Fechar" do cabecalho so se nao houver.
    const doCorpo = caixa.current?.querySelector<HTMLElement>("[data-corpo] :is(a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled))");
    (doCorpo ?? focaveis()[0] ?? caixa.current)?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); fechar.current(); return; }
      if (e.key !== "Tab") return;
      const lista = focaveis();
      if (lista.length === 0) { e.preventDefault(); return; }
      const primeiro = lista[0]!, ultimo = lista[lista.length - 1]!;
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("keydown", tecla); anterior?.focus?.(); };
  // So `aberta`: o `aoFechar` mais novo vem pela ref; reabrir o efeito a cada render roubaria o foco.
  }, [aberta]);
  return caixa;
}

type PropsComuns = {
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: "estreita" | "larga";
  /** O controle que abriu: recebe o foco de volta ao fechar. */
  retorno?: RefObject<HTMLElement | null>;
};

function Sobreposicao({ tipo, aberta, aoFechar, titulo, children, rodape, largura, retorno }: PropsComuns & { tipo: "dialogo" | "gaveta"; aberta: boolean }) {
  const caixa = useSobreposicao(aberta, aoFechar, retorno);
  const id = useId();
  if (!aberta) return null;
  const raiz = document.querySelector(".v2") ?? document.body;
  return createPortal(<div className={`v2-sobreposicao is-${tipo}`} onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
    <div ref={caixa} className={`v2-${tipo}${largura ? ` is-${largura}` : ""}`} role="dialog" aria-modal="true" aria-labelledby={`${id}-titulo`} tabIndex={-1}>
      <header>
        <h2 id={`${id}-titulo`}>{titulo}</h2>
        <button type="button" className="v2-botao-icone" aria-label={t("Fechar")} onClick={aoFechar}><X size={16} aria-hidden="true" /></button>
      </header>
      <div className={`v2-${tipo}-corpo`} data-corpo>{children}</div>
      {rodape && <footer>{rodape}</footer>}
    </div>
  </div>, raiz);
}

export function Dialogo(props: PropsComuns & { aberto: boolean }) {
  const { aberto, ...resto } = props;
  return <Sobreposicao tipo="dialogo" aberta={aberto} {...resto} />;
}

export function Gaveta(props: PropsComuns & { aberta: boolean }) {
  return <Sobreposicao tipo="gaveta" {...props} />;
}

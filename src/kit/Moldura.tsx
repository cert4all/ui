import { useCallback, useEffect, useId, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from "react";
import { ChevronsLeft, ChevronsRight, LayoutGrid, PanelLeft, PanelTop, type LucideIcon } from "lucide-react";
import { Avatar } from "./Avatar";
import { Gaveta } from "./Sobreposicao";
import { t } from "./textos";

/*
  A MOLDURA DA V2 (ADR-0069 do Stonen e emenda de 23/10; generalizada para o `@cert4all/ui` na C40 do Cert4All, 31/10).

  Cabecalho fixo: a marca, a busca global no centro (vem pronta de quem monta), o contexto (organizacao e papel), os
  extras do produto, o seletor de menu, os avisos e o avatar. O menu do avatar leva so os itens que o produto passa.

  Navegacao: DUAS, escolhidas por quem usa no seletor sempre visivel do cabecalho (`useMenuDaMoldura`). `lateral`
  (padrao): barra a esquerda com os modulos como secoes, 176 px ou 48 px recolhida. `topo`: a faixa de modulos com a
  subnavegacao do modulo aberto. No celular so a faixa.

  A moldura nao decide acesso: as areas chegam filtradas pelo produto, e o modulo sem area nao aparece.
*/
export type MenuDaMoldura = "lateral" | "topo";

export type ModuloDaMoldura = { id: string; nome: string };

export type AreaDaMoldura = {
  id: string;
  rotulo: string;
  /** Uma linha do que a tela faz: vira o `title` do link e a linha de baixo em "Todas as telas". */
  proposito?: string | undefined;
  modulo: string;
  icone: LucideIcon;
  href: string;
  ativa: boolean;
};

export type ItemDaConta = { id: string; rotulo: string; icone: LucideIcon; acao: () => void };

export type PessoaDaMoldura = { nome: string; fotoUrl?: string | null | undefined };

export function Moldura({
  marca, nomeDaNavegacao, modulos, areas, busca, contexto, extras, avisos, pessoa, itensDaConta, aparencia = "vidro",
  menu, aoMudarMenu, recolhido, aoRecolher, onNavegar, children
}: {
  marca: ReactNode;
  /** O nome acessivel da navegacao ("Áreas do Cert4All"). */
  nomeDaNavegacao: string;
  /** A ordem dos modulos. */
  modulos: ModuloDaMoldura[];
  areas: AreaDaMoldura[];
  busca?: ReactNode;
  contexto?: { titulo: string; detalhe?: string | undefined } | undefined;
  /** O que o produto poe no cabecalho antes do seletor de menu (idioma, ambiente…). */
  extras?: ReactNode;
  avisos?: ReactNode;
  pessoa: PessoaDaMoldura;
  itensDaConta: ItemDaConta[];
  /** `vidro` (padrao): o fundo do produto aparece atras de superficies translucidas. `branco`: superficies opacas. */
  aparencia?: "vidro" | "branco";
  menu: MenuDaMoldura;
  aoMudarMenu: (menu: MenuDaMoldura) => void;
  recolhido: boolean;
  aoRecolher: (recolhido: boolean) => void;
  /** Navegacao interna (sem recarregar). */
  onNavegar: (href: string) => void;
  children: ReactNode;
}) {
  const movel = useToque();
  const botaoDaConta = useRef<HTMLButtonElement>(null);
  const ir = (area: AreaDaMoldura) => onNavegar(area.href);
  const lateral = menu === "lateral" && !movel;
  const agrupados = modulos
    .map((modulo) => ({ modulo, areas: areas.filter((a) => a.modulo === modulo.id) }))
    .filter((m) => m.areas.length > 0);
  const textoDoContexto = contexto ? [contexto.titulo, contexto.detalhe].filter(Boolean).join(" · ") : "";

  return <div className="v2" data-aparencia={aparencia} data-menu={lateral ? "lateral" : "topo"}>
    <a className="v2-pular" href="#v2-conteudo">{t("Pular para o conteúdo")}</a>
    <header className="v2-cabecalho">
      <span className="v2-marca">{marca}</span>
      {busca ?? <span className="v2-busca" aria-hidden="true" />}
      {contexto ? <span className="v2-org" title={textoDoContexto}>
        <strong>{contexto.titulo}</strong>
        {contexto.detalhe && <small>{contexto.detalhe}</small>}
      </span> : <span className="v2-vazio" />}
      {extras ? <span className="v2-extras">{extras}</span> : <span className="v2-vazio" />}
      {!movel ? <SeletorDeMenu menu={menu} aoMudar={aoMudarMenu} /> : <span className="v2-vazio" />}
      {avisos ? <span className="v2-avisos">{avisos}</span> : <span className="v2-vazio" />}
      <MenuDaConta pessoa={pessoa} contexto={textoDoContexto} botao={botaoDaConta} itens={itensDaConta} />
    </header>
    {/* A faixa existe nos dois modos: no lateral o CSS a esconde acima de 900 px (abaixo disso a lateral e que some). */}
    <BarraDeModulos agrupados={agrupados} areas={areas} ir={ir} nome={nomeDaNavegacao} />
    <div className="v2-corpo">
      {lateral && <BarraLateral agrupados={agrupados} ir={ir} recolhido={recolhido} aoRecolher={aoRecolher} nome={nomeDaNavegacao} />}
      <main className="v2-conteudo" id="v2-conteudo" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}

type Agrupados = { modulo: ModuloDaMoldura; areas: AreaDaMoldura[] }[];

function LinkDeArea({ area, ir, className, ariaCurrent, rotulo, children }: {
  area: AreaDaMoldura; ir: (a: AreaDaMoldura) => void; className?: string | undefined; ariaCurrent?: "page" | "true" | undefined;
  /** O nome acessivel quando o link so tem icone (a barra lateral recolhida). */
  rotulo?: string | undefined; children: ReactNode;
}) {
  const seguir = (e: MouseEvent) => {
    // Navega por dentro; com Cmd/Ctrl/Shift o navegador abre o endereco como ele faria.
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    ir(area);
  };
  return <a href={area.href} className={className} aria-current={ariaCurrent}
    aria-label={rotulo} title={rotulo ? area.rotulo : area.proposito} onClick={seguir}>{children}</a>;
}

/* A FAIXA DOS MODULOS: os modulos a esquerda; depois de um divisor, as telas do modulo aberto. No celular rola de lado
   POR DENTRO, e "Todas as telas" abre a lista inteira numa gaveta. */
function BarraDeModulos({ agrupados, areas, ir, nome }: { agrupados: Agrupados; areas: AreaDaMoldura[]; ir: (a: AreaDaMoldura) => void; nome: string }) {
  const ativa = areas.find((a) => a.ativa) ?? null;
  const aberto = agrupados.find((m) => m.modulo.id === ativa?.modulo) ?? null;
  const sub = aberto && aberto.areas.length > 1 ? aberto : null;
  const faixa = useFaixaQueContinua(ativa?.id ?? null);
  const [todas, setTodas] = useState(false);
  const botaoTodas = useRef<HTMLButtonElement>(null);

  return <nav className="v2-modulos" aria-label={nome}>
    <button ref={botaoTodas} type="button" className="v2-modulos-todas" aria-expanded={todas} onClick={() => setTodas(true)}>
      <LayoutGrid size={15} aria-hidden="true" />{t("Todas as telas")}
    </button>
    <Gaveta aberta={todas} aoFechar={() => setTodas(false)} retorno={botaoTodas} titulo={t("Todas as telas")}>
      <div className="v2-todas-as-telas">
        {agrupados.map((m) => <section key={m.modulo.id} aria-labelledby={`v2-todas-${m.modulo.id}`}>
          <h3 id={`v2-todas-${m.modulo.id}`}>{m.modulo.nome}</h3>
          <ul>
            {m.areas.map((a) => <li key={a.id}>
              <LinkDeArea area={a} ir={(area) => { setTodas(false); ir(area); }} className={`v2-todas-link${a.ativa ? " is-ativa" : ""}`} ariaCurrent={a.ativa ? "page" : undefined}>
                <span>{a.rotulo}</span>
                {a.proposito && <small>{a.proposito}</small>}
              </LinkDeArea>
            </li>)}
          </ul>
        </section>)}
      </div>
    </Gaveta>
    <ul className="v2-modulos-lista">
      {agrupados.map((m) => {
        const primeira = m.areas[0]!;
        const atual = m === aberto;
        return <li key={m.modulo.id}>
          <LinkDeArea area={{ ...primeira, rotulo: m.modulo.nome }} ir={() => ir(primeira)}
            className={`v2-modulo${atual ? " is-ativo" : ""}`} ariaCurrent={atual ? "true" : undefined}>
            {m.modulo.nome}
          </LinkDeArea>
        </li>;
      })}
    </ul>
    {sub && <ul ref={faixa.ref} onScroll={faixa.aoRolar} data-continua={faixa.continua || undefined} className="v2-modulos-sub" aria-label={t("Telas de {modulo}", { modulo: sub.modulo.nome })}>
      {sub.areas.map((a) => <li key={a.id}>
        <LinkDeArea area={a} ir={ir} className={`v2-submodulo${a.ativa ? " is-ativa" : ""}`} ariaCurrent={a.ativa ? "page" : undefined}>
          {a.rotulo}
        </LinkDeArea>
      </li>)}
    </ul>}
  </nav>;
}

/* A BARRA LATERAL: os mesmos modulos e telas da faixa, na mesma ordem. 176 px aberta, 48 px recolhida (so icones, o
   nome no title e no nome acessivel). Rola POR DENTRO quando ha mais telas que a altura; a pagina nunca. */
function BarraLateral({ agrupados, ir, recolhido, aoRecolher, nome }: {
  agrupados: Agrupados; ir: (a: AreaDaMoldura) => void; recolhido: boolean; aoRecolher: (recolhido: boolean) => void; nome: string;
}) {
  const Seta = recolhido ? ChevronsRight : ChevronsLeft;
  return <nav className="v2-lateral" data-recolhido={recolhido || undefined} aria-label={nome}>
    <div className="v2-lateral-lista">
      {agrupados.map((m) => <section key={m.modulo.id} aria-labelledby={`v2-lateral-${m.modulo.id}`}>
        <h2 id={`v2-lateral-${m.modulo.id}`} className={recolhido ? "v2-sr" : undefined}>{m.modulo.nome}</h2>
        <ul>
          {m.areas.map((a) => {
            const Icone = a.icone;
            return <li key={a.id}>
              <LinkDeArea area={a} ir={ir} className={`v2-lateral-link${a.ativa ? " is-ativa" : ""}`} ariaCurrent={a.ativa ? "page" : undefined}
                {...(recolhido ? { rotulo: a.rotulo } : {})}>
                <Icone size={16} aria-hidden="true" />
                {!recolhido && <span>{a.rotulo}</span>}
              </LinkDeArea>
            </li>;
          })}
        </ul>
      </section>)}
    </div>
    <button type="button" className="v2-lateral-recolher" onClick={() => aoRecolher(!recolhido)} aria-expanded={!recolhido}
      aria-label={recolhido ? t("Expandir menu") : t("Recolher menu")} title={recolhido ? t("Expandir menu") : t("Recolher menu")}>
      <Seta size={16} aria-hidden="true" />{!recolhido && <span>{t("Recolher menu")}</span>}
    </button>
  </nav>;
}

/* O SELETOR DO MENU, sempre a vista no cabecalho (owner do Stonen, 23/10: "a escolha nao pode ficar oculta"). */
function SeletorDeMenu({ menu, aoMudar }: { menu: MenuDaMoldura; aoMudar: (menu: MenuDaMoldura) => void }) {
  return <span className="v2-seletor-menu" role="group" aria-label={t("Menu")}>
    <button type="button" aria-pressed={menu === "lateral"} onClick={() => aoMudar("lateral")} title={t("Menu lateral")}>
      <PanelLeft size={16} aria-hidden="true" /><span>{t("Lateral")}</span>
    </button>
    <button type="button" aria-pressed={menu === "topo"} onClick={() => aoMudar("topo")} title={t("Menu no topo")}>
      <PanelTop size={16} aria-hidden="true" /><span>{t("Topo")}</span>
    </button>
  </span>;
}

/* No celular as telas do modulo rolam de lado: a atual rola para a vista, e enquanto ha destinos a direita a faixa
   esmaece na borda (`data-continua`). */
function useFaixaQueContinua(ativa: string | null) {
  const ref = useRef<HTMLUListElement>(null);
  const [continua, setContinua] = useState(false);
  const medir = () => {
    const no = ref.current;
    setContinua(Boolean(no && no.scrollWidth - no.clientWidth - no.scrollLeft > 4));
  };
  useEffect(() => {
    const no = ref.current;
    no?.querySelector<HTMLElement>("[aria-current='page']")?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    medir();
    if (!no || typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(medir);
    observador.observe(no);
    return () => observador.disconnect();
  }, [ativa]);
  return { ref, continua, aoRolar: medir };
}

function MenuDaConta({ pessoa, contexto, botao, itens }: {
  pessoa: PessoaDaMoldura; contexto: string; botao: RefObject<HTMLButtonElement | null>; itens: ItemDaConta[];
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!aberto) return;
    caixa.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const fora = (e: globalThis.MouseEvent) => { if (!caixa.current?.contains(e.target as Node) && !botao.current?.contains(e.target as Node)) setAberto(false); };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setAberto(false); botao.current?.focus(); return; }
      const lista = [...(caixa.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
      const atual = lista.indexOf(document.activeElement as HTMLButtonElement);
      const alvo = e.key === "ArrowDown" ? (atual + 1) % lista.length : e.key === "ArrowUp" ? (atual - 1 + lista.length) % lista.length
        : e.key === "Home" ? 0 : e.key === "End" ? lista.length - 1 : null;
      if (alvo === null || lista.length === 0 || atual === -1) return;
      e.preventDefault();
      lista[alvo]?.focus();
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", tecla); };
  }, [aberto, botao]);

  return <div className="v2-conta">
    <button ref={botao} type="button" className="v2-avatar" aria-haspopup="menu" aria-expanded={aberto} aria-controls={id}
      aria-label={t("Conta de {nome}", { nome: pessoa.nome })} title={pessoa.nome} onClick={() => setAberto((v) => !v)}>
      <Avatar nome={pessoa.nome} fotoUrl={pessoa.fotoUrl} classe="v2-avatar-imagem" />
    </button>
    {aberto && <div ref={caixa} id={id} className="v2-menu is-fim" role="menu" aria-label={t("Conta")}>
      <p className="v2-menu-nome"><strong>{pessoa.nome}</strong>{contexto && <small>{contexto}</small>}</p>
      {itens.map((item) => {
        const Icone = item.icone;
        return <button key={item.id} type="button" role="menuitem" onClick={() => { setAberto(false); item.acao(); }}>
          <Icone size={15} aria-hidden="true" />{item.rotulo}
        </button>;
      })}
    </div>}
  </div>;
}

/** Aparelho de toque sem mouse: ali nao ha lateral nem seletor, a faixa vale sempre. */
function useToque(): boolean {
  const consulta = "(hover: none) and (pointer: coarse)";
  const [toque, setToque] = useState(() => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(consulta).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(consulta);
    const mudar = () => setToque(mq.matches);
    mq.addEventListener?.("change", mudar);
    return () => mq.removeEventListener?.("change", mudar);
  }, []);
  return toque;
}

/*
  A ESCOLHA DO MENU, por pessoa, neste navegador: so `topo` e o recolhido deixam marca (padrao: lateral aberta).
  `prefixo` separa os produtos (`cert4all-menu:<usuario>`).
*/
export function useMenuDaMoldura(prefixo: string, usuario: string): {
  menu: MenuDaMoldura; mudarMenu: (menu: MenuDaMoldura) => void; recolhido: boolean; mudarRecolhido: (recolhido: boolean) => void;
} {
  const chaveDoMenu = `${prefixo}-menu:${usuario || "sem-usuario"}`;
  const chaveDoRecolhido = `${prefixo}-menu-recolhido:${usuario || "sem-usuario"}`;
  const [menu, setMenu] = useState<MenuDaMoldura>(() => (ler(chaveDoMenu, "topo") ? "topo" : "lateral"));
  const [recolhido, setRecolhido] = useState(() => ler(chaveDoRecolhido, "sim"));
  const mudarMenu = useCallback((novo: MenuDaMoldura) => { gravar(chaveDoMenu, "topo", novo === "topo"); setMenu(novo); }, [chaveDoMenu]);
  const mudarRecolhido = useCallback((novo: boolean) => { gravar(chaveDoRecolhido, "sim", novo); setRecolhido(novo); }, [chaveDoRecolhido]);
  return { menu, mudarMenu, recolhido, mudarRecolhido };
}

function ler(chave: string, marca: string): boolean {
  try {
    return window.localStorage.getItem(chave) === marca;
  } catch {
    return false;
  }
}

function gravar(chave: string, marca: string, ligado: boolean): void {
  try {
    if (ligado) window.localStorage.setItem(chave, marca);
    else window.localStorage.removeItem(chave);
  } catch {
    // sem armazenamento, a escolha vale ate recarregar
  }
}

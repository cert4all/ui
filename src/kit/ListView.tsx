import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Rows3, Search } from "lucide-react";
import { useLembrado } from "./lembrar";
import { useNaSessao } from "./filtroDaSessao";
import { Carregando, Erro, SemPermissao, Vazio } from "./Estados";
import { localeAtual, numeroLocal, t, tn } from "./textos";

/*
  A LIST VIEW DA V2 (ADR-0065) — a tabela densa de registros, com o cabecalho que diz O QUE se esta vendo.

  Uma unidade de decisao por linha (UI_PRINCIPLES §6). O cabecalho tem o icone do objeto, o titulo e — quando a tela
  declara — as VISTAS SALVAS (fixas por tela; a escolhida e lembrada por usuario neste navegador), a busca local, a
  densidade e as acoes da tela. A contagem e o estado ficam a direita, anunciados (`role="status"`).

  - Colunas DECLARATIVAS: cada uma diz rotulo, celula e, se ordena, a chave. Nulo na chave vai SEMPRE para o fim.
  - Coluna `link` vira o caminho para o registro (`abrir`) ou, sem registro, seleciona a linha (`selecao`).
  - Celular: por padrao a tabela ROLA DENTRO DA PROPRIA CAIXA (a pagina nunca rola de lado); `celular="cartoes"`
    transforma cada linha num bloco com rotulo e valor — a tela pode ajustar o bloco no proprio CSS.
  - Estados: carregando, erro (com tentar de novo), sem permissao, vazio (nada ainda) e vazio da vista/busca.
  - Rodape: contagem e, se a tela declarar, a soma de uma coluna — o que nao tem valor e contado a parte, nunca zero.
  - Contagem com a carga (ADR-0025, `cargaTotal`): quando o numero visivel difere do tamanho total que a importacao
    trouxe, a contagem ganha "de M na carga" — nunca repete "N de N" (ruido em toda tela que nao recorta nada).
  - "Limpar filtros" (`limpar`): um botao so, que aparece so com algo ativo. Busca e vista lembrada sao do PROPRIO
    kit e voltam ao padrao sempre; `limpar.ativo`/`limpar.aoLimpar` cobrem o que a tela filtra por fora dele
    (vendedor, tag, espessura...). Sem a prop `limpar`, a tela nao ganha o botao — quem ja tem o seu (Ofertas,
    Reservas) continua do jeito que esta.
*/
export type ColunaDaLista<T> = {
  id: string;
  rotulo: string;
  celula: (linha: T) => ReactNode;
  /** Chave de ordenacao. Sem ela, a coluna nao ordena. */
  ordenar?: (linha: T) => number | string | null;
  numerica?: boolean;
  /** Coluna larga (titulo, nome): mais espaco, quebra no celular. */
  principal?: boolean;
  /** A celula leva ao registro (com `abrir`) ou seleciona a linha (com `selecao`). */
  link?: boolean;
  /** `title` da celula — o texto inteiro quando ela corta. */
  dica?: (linha: T) => string | undefined;
  classe?: (linha: T) => string | undefined;
  /** O texto quebra linha em vez de cortar (célula de duas linhas). */
  quebra?: boolean;
  /** Coluna de ações: sem largura máxima, nunca corta os botões. */
  acoes?: boolean;
};

export type VistaDaLista<T> = { id: string; rotulo: string; passa: (linha: T) => boolean };

export type EstadoDaLista = {
  carregando?: boolean;
  erro?: boolean;
  mensagemDeErro?: string;
  semPermissao?: boolean;
  aoTentarDeNovo?: () => void;
};

type Ordem = { coluna: string; desc: boolean };

function comparar(a: number | string | null, b: number | string | null, desc: boolean): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const r = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "pt-BR");
  return desc ? -r : r;
}

/*
  A BUSCA DA LISTA IGNORA CAIXA E ACENTO: o nome de empresa e gravado em MAIUSCULAS com acento ("PEDRA BONITA
  MÁRMORES", ADR da grafia), e quem digita "marmores" procurava e nao achava (bateria de 12/10).
*/
const paraBuscar = (texto: string) => texto.normalize("NFD").replace(/\p{M}+/gu, "").toLocaleLowerCase("pt-BR");

export function ListView<T>({
  titulo, icone, colunas, linhas, chave, estado = {}, vistas, memoria, vistaPedida, ordemInicial, busca, densidade = true,
  selecao, abrir, rodape, celular = "rolar", classe, vazio, acoes, avisos, contagem, cargaTotal, limpar, testId, testIdDoTitulo
}: {
  titulo: string;
  icone?: ReactNode;
  colunas: ColunaDaLista<T>[];
  /** `undefined` enquanto nao chegou. */
  linhas: T[] | undefined;
  chave: (linha: T) => string;
  estado?: EstadoDaLista;
  vistas?: VistaDaLista<T>[];
  /** Chave de `localStorage` da vista escolhida (por usuario); a densidade usa `<memoria>:densidade`. */
  memoria?: string;
  /** A vista pedida pelo endereco (`?vista=`, a porta recortada da ADR-0036): vale na abertura, sem virar a lembrada. */
  vistaPedida?: string | null;
  ordemInicial?: Ordem;
  busca?: {
    campos: (linha: T) => (string | null | undefined)[];
    placeholder?: string;
    /** O texto inteiro do que a busca procura, no `title` do campo, quando o placeholder e curto (12/10: placeholder
        longo cortava em 390 px e em ingles). */
    dica?: string;
    /** Termo controlado de fora (ex.: `?q=` da busca global). Sem ele, a busca e da propria lista. */
    termo?: string;
    aoMudarTermo?: (termo: string) => void;
    /** `false` esconde o campo (o termo vem de fora). */
    campoVisivel?: boolean;
    /** `data-testid` do campo. */
    testId?: string;
  };
  densidade?: boolean;
  selecao?: { selecionada: string | null; aoSelecionar: (linha: T) => void };
  abrir?: { href: (linha: T) => string; aoAbrir: (linha: T) => void };
  rodape?: { soma?: {
    rotulo: string; valor: (linha: T) => number | null; formatar: (n: number) => string;
    /** Linha cujo valor esta FORA do alcance de quem ve (nao e "sem valor"): fica fora da soma e e contada a parte. */
    oculta?: (linha: T) => boolean; rotuloDasOcultas?: (n: number) => string;
    /** O total quando nao e a soma linha a linha (o Funil: o mesmo fardo em varias ofertas conta uma vez). Recebe as linhas visiveis com valor. */
    total?: (linhas: T[]) => number;
  } };
  celular?: "rolar" | "cartoes";
  classe?: string;
  vazio?: { semNada?: ReactNode; semResultado?: ReactNode };
  acoes?: ReactNode;
  avisos?: ReactNode;
  /** O texto da contagem: `(n) => "3 ofertas"`. */
  contagem?: (n: number) => string;
  /** O tamanho total da carga (ADR-0025, `meta.loadCount`). Sem ela, ou igual ao visivel, a contagem fica como esta. */
  cargaTotal?: number;
  /** O "Limpar filtros" do kit (busca e vista sempre; isto cobre o resto). Sem esta prop, nenhum botao aparece. */
  limpar?: { ativo: boolean; aoLimpar: () => void };
  /** `data-testid` do cartão da lista. */
  testId?: string;
  /** `data-testid` do título da lista (o `text-page-title` quando a lista é a tela). */
  testIdDoTitulo?: string;
}) {
  const [lembrada, lembrar] = useLembrado(memoria ?? null, vistas?.[0]?.id ?? "");
  const [pedida, setPedida] = useState(vistaPedida ?? null);
  const vistaId = pedida ?? lembrada;
  const setVistaId = (id: string) => { setPedida(null); lembrar(id); };
  // A vista lembrada (ou pedida) pode nao valer para o perfil (perdeu a carteira, nao le o funil): cai na primeira.
  const vista = vistas?.find((v) => v.id === vistaId) ?? vistas?.[0];
  const [compacta, setCompacta] = useLembrado<"padrao" | "compacta">(memoria ? `${memoria}:densidade` : null, "padrao");
  // A ordem e a busca local ficam na sessao, pela memoria da lista (Lucas, 29/10: voltar do registro desfazia).
  const [ordem, setOrdem] = useNaSessao<Ordem | null>(memoria ? `${memoria}:ordem` : null, ordemInicial ?? null);
  const [termoLocal, setTermoLocal] = useNaSessao(memoria ? `${memoria}:termo` : null, "");
  const termo = busca?.termo ?? termoLocal;
  const mudarTermo = (novo: string) => (busca?.aoMudarTermo ? busca.aoMudarTermo(novo) : setTermoLocal(novo));
  // "Limpar filtros" (owner, retrabalho da A12): busca e vista voltam ao padrao do proprio kit; o resto e da tela.
  const vistaPadrao = vistas?.[0]?.id;
  const vistaMudou = vistaPadrao !== undefined && vistaId !== vistaPadrao;
  const mostrarLimpar = Boolean(limpar) && (Boolean(termo) || vistaMudou || Boolean(limpar?.ativo));
  const aoLimparFiltros = () => {
    if (termo) mudarTermo("");
    if (vistaMudou && vistaPadrao !== undefined) setVistaId(vistaPadrao);
    limpar?.aoLimpar();
  };

  const visiveis = useMemo(() => {
    const procurado = paraBuscar(termo.trim());
    const filtradas = (linhas ?? []).filter((l) => (!vista || vista.passa(l))
      && (!procurado || !busca || busca.campos(l).some((c) => paraBuscar(c ?? "").includes(procurado))));
    const coluna = ordem && colunas.find((c) => c.id === ordem.coluna);
    if (!ordem || !coluna?.ordenar) return filtradas;
    const k = coluna.ordenar;
    return [...filtradas].sort((a, b) => comparar(k(a), k(b), ordem.desc));
  }, [linhas, vista, termo, busca, ordem, colunas]);

  const ordenarPor = (id: string) => setOrdem((atual) => ({ coluna: id, desc: atual?.coluna === id ? !atual.desc : true }));
  // ADR-0025: "N de M na carga" so quando os dois numeros DIFEREM — repetir "N de N" seria ruido.
  const textoDaContagem = (n: number) => (cargaTotal !== undefined && cargaTotal !== n
    ? tn(n, "1 resultado de {total} na carga", "{n} resultados de {total} na carga", { total: numeroLocal(cargaTotal) })
    : contagem ? contagem(n) : tn(n, "1 registro", "{n} registros"));

  let corpo: ReactNode;
  if (estado.semPermissao) corpo = <SemPermissao />;
  else if (estado.erro) corpo = <Erro {...(estado.aoTentarDeNovo ? { aoTentarDeNovo: estado.aoTentarDeNovo } : {})}>{estado.mensagemDeErro ?? t("Não foi possível carregar: {oque}.", { oque: titulo.toLocaleLowerCase(localeAtual()) })}</Erro>;
  else if (estado.carregando || linhas === undefined) corpo = <Carregando />;
  else if (visiveis.length === 0) corpo = <Vazio>{linhas.length === 0 ? vazio?.semNada ?? t("Nada por aqui ainda.") : vazio?.semResultado ?? t("Nenhum registro nesta vista.")}</Vazio>;
  else {
    corpo = <div className="v2-tabela-rolagem" tabIndex={celular === "rolar" ? 0 : undefined} role={celular === "rolar" ? "region" : undefined}
      aria-label={celular === "rolar" ? t("{titulo} — tabela", { titulo }) : undefined}>
      <table className={`v2-tabela${compacta === "compacta" ? " is-compacta" : ""}${celular === "cartoes" ? " is-cartoes" : ""}`}>
        <thead><tr>{colunas.map((c) => {
          const ativa = ordem?.coluna === c.id;
          return <th key={c.id} scope="col" className={c.numerica ? "is-num" : undefined}
            aria-sort={c.ordenar ? (ativa ? (ordem!.desc ? "descending" : "ascending") : "none") : undefined}>
            {c.ordenar ? <button type="button" className="v2-ordenar" onClick={() => ordenarPor(c.id)}>
              {c.rotulo}{ativa && (ordem!.desc ? <ArrowDown size={12} aria-hidden="true" /> : <ArrowUp size={12} aria-hidden="true" />)}
            </button> : c.rotulo}
          </th>;
        })}</tr></thead>
        <tbody>{visiveis.map((l) => {
          const id = chave(l);
          const escolhida = selecao?.selecionada === id;
          /* A LINHA INTEIRA ABRE O REGISTRO (owner, 22/10, Reservas: "so consigo abrir a reserva se eu clico no nome do
             bundle, o usuario esta ficando perdido"). O link da celula segue para teclado e para abrir em outra aba;
             o clique no resto da linha faz o mesmo, menos em botao, campo ou link proprio da linha, e com texto selecionado. */
          const abrirPelaLinha = abrir ? (e: MouseEvent<HTMLTableRowElement>) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
            if ((e.target as HTMLElement).closest("a, button, input, select, textarea, label, summary, [role='button']")) return;
            if (window.getSelection?.()?.toString()) return;
            if (selecao) selecao.aoSelecionar(l);
            abrir.aoAbrir(l);
          } : undefined;
          return <tr key={id} className={[escolhida && "is-selecionada", abrir && "is-abrivel"].filter(Boolean).join(" ") || undefined} onClick={abrirPelaLinha}>
            {colunas.map((c) => <td key={c.id} data-rotulo={c.rotulo} title={c.dica?.(l)}
              className={[c.numerica && "is-num", c.principal && "is-titulo", c.quebra && "is-quebra", c.acoes && "is-acoes", c.classe?.(l)].filter(Boolean).join(" ") || undefined}>
              {c.link ? <CelulaLink linha={l} abrir={abrir} selecao={selecao} escolhida={escolhida}>{c.celula(l)}</CelulaLink> : c.celula(l)}
            </td>)}
          </tr>;
        })}</tbody>
      </table>
    </div>;
  }

  const prontas = !estado.carregando && !estado.erro && !estado.semPermissao && linhas !== undefined;
  // `com` conta as linhas que TEM valor: sem nenhuma, a soma e "—", e nao "US$ 0" (bateria de 12/10, Funil sem preco).
  const soma = rodape?.soma && prontas ? visiveis.reduce<{ total: number; sem: number; com: number; ocultas: number }>((acc, l) => {
    if (rodape.soma!.oculta?.(l)) return { ...acc, ocultas: acc.ocultas + 1 };
    const v = rodape.soma!.valor(l);
    return v === null ? { ...acc, sem: acc.sem + 1 } : { ...acc, total: acc.total + v, com: acc.com + 1 };
  }, { total: 0, sem: 0, com: 0, ocultas: 0 }) : null;
  if (soma && rodape?.soma?.total) soma.total = rodape.soma.total(visiveis.filter((l) => !rodape.soma!.oculta?.(l) && rodape.soma!.valor(l) !== null));

  return <div className={`v2-cartao v2-lista${celular === "cartoes" ? " is-celular-cartoes" : ""}${classe ? ` ${classe}` : ""}`} {...(testId ? { "data-testid": testId } : {})}>
    <header className="v2-lista-cabecalho">
      {icone && <span className="v2-icone-objeto" aria-hidden="true">{icone}</span>}
      <div className={`v2-lista-identidade${vistas ? "" : " is-sem-vista"}`}>
        <h1 {...(testIdDoTitulo ? { "data-testid": testIdDoTitulo } : {})}>{titulo}</h1>
        {vistas && vista && <label className="v2-vista">
          <span className="v2-sr">{t("Vista salva")}</span>
          <select value={vista.id} onChange={(e) => setVistaId(e.target.value)}>
            {vistas.map((v) => <option key={v.id} value={v.id}>{v.rotulo}</option>)}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>}
      </div>
      <div className="v2-lista-ferramentas">
        {busca && busca.campoVisivel !== false && <label className="v2-lista-busca">
          <span className="v2-sr">{t("Buscar em {titulo}", { titulo })}</span>
          <Search size={14} aria-hidden="true" />
          <input type="search" value={termo} onChange={(e) => mudarTermo(e.target.value)} placeholder={busca.placeholder ?? t("Buscar nesta lista")}
            {...(busca.dica ? { title: busca.dica } : {})} {...(busca.testId ? { "data-testid": busca.testId } : {})} />
        </label>}
        {densidade && <button type="button" className="v2-botao-icone v2-densidade" aria-pressed={compacta === "compacta"}
          aria-label={t("Linhas compactas")} title={t("Linhas compactas")} onClick={() => setCompacta(compacta === "compacta" ? "padrao" : "compacta")}>
          <Rows3 size={16} aria-hidden="true" />
        </button>}
        {acoes}
        {mostrarLimpar && <button type="button" className="v2-botao is-pequeno v2-lista-limpar" onClick={aoLimparFiltros}>{t("Limpar filtros")}</button>}
      </div>
      <p className="v2-lista-contagem" role="status">
        {!prontas ? (estado.carregando || linhas === undefined) && !estado.erro && !estado.semPermissao ? t("carregando…") : "—" : textoDaContagem(visiveis.length)}
        {termo && busca?.campoVisivel === false && <> · {t("busca “{termo}”", { termo })} <button type="button" className="v2-link" onClick={() => mudarTermo("")}>{t("limpar")}</button></>}
        {avisos}
      </p>
    </header>
    {corpo}
    {soma && <p className="v2-lista-rodape">
      <span>{textoDaContagem(visiveis.length)}</span>
      <span>{rodape!.soma!.rotulo}: <strong>{soma.com > 0 ? rodape!.soma!.formatar(soma.total) : "—"}</strong>{soma.sem > 0 && <> · {t("{n} sem valor", { n: soma.sem })}</>}{soma.ocultas > 0 && rodape!.soma!.rotuloDasOcultas && <> · {rodape!.soma!.rotuloDasOcultas(soma.ocultas)}</>}</span>
    </p>}
  </div>;
}

function CelulaLink<T>({ linha, abrir, selecao, escolhida, children }: {
  linha: T; abrir: { href: (l: T) => string; aoAbrir: (l: T) => void } | undefined;
  selecao: { aoSelecionar: (l: T) => void } | undefined; escolhida: boolean; children: ReactNode;
}) {
  if (abrir) {
    const seguir = (e: MouseEvent) => {
      // Ctrl/Cmd/meio abrem em outra aba pelo endereco; o clique simples navega por dentro.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (selecao) selecao.aoSelecionar(linha);
      abrir.aoAbrir(linha);
    };
    return <a href={abrir.href(linha)} onClick={seguir} aria-current={escolhida ? "true" : undefined}>{children}</a>;
  }
  if (selecao) return <button type="button" className="v2-celula-botao" aria-current={escolhida ? "true" : undefined} onClick={() => selecao.aoSelecionar(linha)}>{children}</button>;
  return <>{children}</>;
}

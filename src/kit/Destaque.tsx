import { useId, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { Menu } from "./Menu";
import { Segmentado } from "./Segmentado";
import { t } from "./textos";

/*
  A PAGINA DE REGISTRO DA V2 (ADR-0065) — o esqueleto de toda tela que abre UM registro (oferta, cliente, bundle,
  pessoa, campanha...):

      trilha (Lista > registro)
      DESTAQUE  icone · tipo · titulo                         [primaria] [secundaria] [Mais v]
                campo-chave | campo-chave | campo-chave ...
      PATH      etapa > etapa > ETAPA ATUAL > etapa            (so se o registro anda por etapas)
      corpo:    ABAS (Itens / Detalhes / Relacionado)  |  ATIVIDADE (lateral)

  `PaginaDeRegistro` monta o esqueleto; `Destaque`, `Path`, `Abas`, `Atividade` e `ListaRelacionada` sao as pecas.

  A TELA NAO ROLA (diretiva do owner, 10/10/2026): a pagina de registro ocupa a altura da moldura. Trilha, Destaque
  e Path ficam FIXOS; o corpo divide o resto — o conteudo das Abas rola dentro do painel (a fileira de abas fica) e a
  Atividade rola separada. Abaixo de 1180 px a lateral desce para baixo do corpo (as duas dividem a altura); ate
  900 px e UM POR VEZ: um seletor segmentado troca entre o principal e a lateral (`rotulos`).
*/
export function PaginaDeRegistro({ idDoTitulo, trilha, passos, destaque, caminho, principal, lateral, rotulos = { principal: t("Registro"), lateral: t("Atividade") } }: {
  /** O id do `h1` do destaque — rotula a secao inteira. */
  idDoTitulo: string;
  /** Os niveis acima do registro; o ultimo e o proprio registro (sem link). */
  trilha: { rotulo: string; href?: string; aoClicar?: () => void }[];
  /** Anterior / proximo registro, na ponta direita da linha da trilha (owner, 27/10). */
  passos?: ReactNode;
  destaque: ReactNode;
  caminho?: ReactNode;
  principal: ReactNode;
  lateral?: ReactNode;
  /** Os nomes do principal e da lateral no seletor do celular (um por vez). */
  rotulos?: { principal: string; lateral: string };
}) {
  const base = useId();
  const [noCelular, setNoCelular] = useState<"principal" | "lateral">("principal");
  const navegacao = <nav className="v2-trilha" aria-label={t("Você está em")}>
      {trilha.map((nivel, i) => {
        const ultimo = i === trilha.length - 1;
        const seguir = (e: MouseEvent) => { if (nivel.aoClicar) { e.preventDefault(); nivel.aoClicar(); } };
        return <span key={`${i}:${nivel.rotulo}`} className="v2-trilha-nivel">
          {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
          {ultimo || !nivel.href ? <span aria-current={ultimo ? "page" : undefined}>{nivel.rotulo}</span>
            : <a href={nivel.href} onClick={seguir}>{nivel.rotulo}</a>}
        </span>;
      })}
    </nav>;
  return <section className="v2-pagina is-inteira v2-registro" aria-labelledby={idDoTitulo}>
    {passos ? <div className="v2-trilha-linha">{navegacao}{passos}</div> : navegacao}
    {destaque}
    {caminho}
    {lateral && <Segmentado classe="v2-registro-seletor" rotulo={t("Parte do registro em tela")} ativa={noCelular}
      aoTrocar={(id) => setNoCelular(id === "lateral" ? "lateral" : "principal")}
      opcoes={[{ id: "principal", rotulo: rotulos.principal, controla: `${base}-principal` }, { id: "lateral", rotulo: rotulos.lateral, controla: `${base}-lateral` }]} />}
    <div className={`v2-registro-corpo${lateral ? ` is-celular-${noCelular}` : " is-sem-lateral"}`}>
      <div id={`${base}-principal`} className="v2-registro-principal">{principal}</div>
      {lateral && <div id={`${base}-lateral`} className="v2-registro-lateral">{lateral}</div>}
    </div>
  </section>;
}

export type CampoDoDestaque = {
  rotulo: string;
  valor: ReactNode;
  /** Ausencia honesta ("sem preço", "—"): o valor sai em italico e na cor secundaria. */
  ausente?: boolean;
  /** Texto inteiro, quando o valor corta. */
  dica?: string;
};

/** O painel de destaque: identidade do registro, os campos que decidem e as acoes a direita. */
export function Destaque({ icone, tipo, codigo, titulo, idDoTitulo, campos, acoes, rodape }: {
  icone: ReactNode;
  /** O tipo do registro ("Oferta", "Cliente", "Bundle"). */
  tipo: string;
  /** Codigo do registro, em mono (numero da oferta, codigo do bundle). */
  codigo?: string;
  titulo: string;
  idDoTitulo: string;
  campos: CampoDoDestaque[];
  /** Normalmente uma `BarraDeAcoes`; pode trazer o formulario curto que uma acao abre. */
  acoes?: ReactNode;
  /** Uma faixa abaixo dos campos, visivel em qualquer aba (as tags do cliente, 12/10). */
  rodape?: ReactNode;
}) {
  return <div className="v2-cartao v2-destaque">
    <div className="v2-destaque-topo">
      <span className="v2-icone-objeto" aria-hidden="true">{icone}</span>
      <div className="v2-destaque-titulo">
        <small>{tipo}{codigo && <> <span className="v2-codigo">{codigo}</span></>}</small>
        <h1 id={idDoTitulo} title={titulo}>{titulo}</h1>
      </div>
      {acoes}
    </div>
    {campos.length > 0 && <dl className="v2-campos">
      {campos.map((c) => <div key={c.rotulo}>
        <dt>{c.rotulo}</dt>
        <dd className={c.ausente ? "is-ausente" : undefined} title={c.dica ?? (typeof c.valor === "string" ? c.valor : undefined)}>{c.valor}</dd>
      </div>)}
    </dl>}
    {rodape && <div className="v2-destaque-rodape">{rodape}</div>}
  </div>;
}

export type AcaoDoRegistro = {
  id: string;
  rotulo: string;
  icone?: ReactNode;
  aoClicar: () => void;
  desabilitada?: boolean;
  /** Botao de liga/desliga (ex.: "Ganha" marcada). */
  pressionada?: boolean;
  tom?: "primaria" | "perigo";
};

/*
  AS ACOES DO REGISTRO: as `visiveis` primeiras como botao, o resto no menu "Mais". A primaria vem primeiro e e uma so.
  Em celular a barra ocupa a largura e quebra linha — nada some sem o "Mais".
*/
export function BarraDeAcoes({ acoes, visiveis = 3, rotulo = t("Ações"), erro, children }: {
  acoes: AcaoDoRegistro[];
  visiveis?: number;
  rotulo?: string;
  /** Mensagem da ultima acao que falhou. */
  erro?: string | undefined;
  /** O formulario curto que uma acao abriu (justificativa, motivo). */
  children?: ReactNode;
}) {
  const fora = acoes.slice(0, visiveis);
  const dentro = acoes.slice(visiveis);
  return <div className="v2-acoes">
    <div className="v2-grupo-botoes" role="group" aria-label={rotulo}>
      {fora.map((a) => <button key={a.id} type="button" disabled={a.desabilitada} onClick={a.aoClicar}
        aria-pressed={a.pressionada === undefined ? undefined : a.pressionada}
        className={`v2-botao${a.tom === "primaria" ? " is-primario" : a.tom === "perigo" ? " is-perigo" : ""}${a.pressionada ? " is-ligado" : ""}`}>
        {a.icone}{a.rotulo}
      </button>)}
      {dentro.length > 0 && <Menu rotulo={t("Mais ações")} classeDoBotao="v2-botao"
        conteudoDoBotao={<><MoreHorizontal size={14} aria-hidden="true" />{t("Mais")}</>}
        itens={dentro.map((a) => ({ id: a.id, rotulo: a.rotulo, icone: a.icone, aoEscolher: a.aoClicar, desabilitado: a.desabilitada, perigo: a.tom === "perigo" }))} />}
    </div>
    {erro && <p className="v2-erro" role="alert">{erro}</p>}
    {children}
  </div>;
}

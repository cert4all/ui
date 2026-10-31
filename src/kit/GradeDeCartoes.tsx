import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { Dica } from "./Dica";
import { Segmentado } from "./Segmentado";
import { t } from "./textos";

/*
  A PAGINA INTEIRA E A GRADE DE CARTOES — a regra "a tela nao rola" (diretiva do owner, 10/10/2026): "As telas nao
  podem rolar, o conteudo do card pode, a tela nao."

  `PaginaInteira` e a pagina que ocupa a altura da moldura e NAO cresce alem dela. Os filhos ficam com a altura
  natural (cabecalho, faixa de indicadores, filtros) e so os ELASTICOS dividem o resto: `ListView`, `GradeDeCartoes`,
  `Kanban`, o corpo da `PaginaDeRegistro` — ou qualquer caixa com a classe `v2-elastico`. Quem rola e o corpo do
  elastico, nunca a pagina.

  `GradeDeCartoes` e a home/sintese que preenche o resto da pagina com cartoes. Cada cartao tem o CABECALHO FIXO
  (titulo ou abas, (i), contagem, ferramentas), o CORPO que rola por dentro e, se houver, o RODAPE fixo (a acao
  primaria fica fora do que rola). Abas internas sao opcionais: o que nao cabe vira aba do cartao, nunca "mais abaixo".

  - Desktop (piso 1366x768): a grade segue `areas`/`colunas`/`linhas` (CSS grid). Acima do piso os cartoes CRESCEM
    (as trilhas sao frações), abaixo dele nada some — o corpo do cartao rola.
  - Celular e tablet em pe (ate 900 px): UM CARTAO POR VEZ. Um seletor segmentado no topo troca qual cartao ocupa a
    tela; o cartao escolhido preenche a altura e rola por dentro.

  O cartao aberto no celular e a aba de cada cartao podem ser controlados pela tela (`ativo`/`aoTrocar`,
  `aba`/`aoTrocarAba`) — e assim que um numero da faixa leva ao cartao certo, na aba certa.
*/
export function PaginaInteira({ rotulo, classe, testId, children }: { rotulo?: string; classe?: string; testId?: string; children: ReactNode }) {
  return <section className={`v2-pagina is-inteira${classe ? ` ${classe}` : ""}`} {...(rotulo ? { "aria-label": rotulo } : {})} {...(testId ? { "data-testid": testId } : {})}>{children}</section>;
}

export type AbaDoCartao = {
  id: string;
  rotulo: string;
  contador?: ReactNode;
  conteudo: () => ReactNode;
  testId?: string;
};

export type CartaoDaGrade = {
  id: string;
  /** O nome do cartao: titulo visivel (sem abas) e nome acessivel da secao. */
  titulo: string;
  /** O nome no seletor do celular, quando o titulo e longo. */
  rotuloCurto?: string;
  /** A area da grade (`grid-area`) no desktop. */
  area?: string;
  dica?: string;
  contagem?: ReactNode;
  ferramentas?: ReactNode;
  /** Fixo embaixo, fora do que rola (a acao primaria do cartao). */
  rodape?: ReactNode;
  /** Abas internas: o que nao cabe no cartao vira aba dele. */
  abas?: AbaDoCartao[];
  aba?: string;
  aoTrocarAba?: (id: string) => void;
  /**
   * Com abas, o titulo some por padrao (as abas tomam o lugar). `tituloComAbas` o mantem visivel ANTES das abas — a
   * Visao de Hoje usa: "Funil" e "Estoque" eram cartoes sem nome a vista (bateria de 12/10, recomendacao aceita).
   */
  tituloComAbas?: boolean;
  /** O corpo, quando o cartao nao tem abas. */
  conteudo?: ReactNode;
  /**
   * O conteudo JA E um cartao com cabecalho proprio (uma `ListView`): a grade so o posiciona, sem casca nem cabecalho
   * em volta — e ele divide a altura do cartao como qualquer corpo (a tabela rola por dentro).
   */
  proprio?: boolean;
  classe?: string;
};

export function GradeDeCartoes({ rotulo, cartoes, areas, colunas, linhas, ativo, aoTrocar, classe }: {
  /** Nome da grade ("Painel de hoje"). */
  rotulo: string;
  cartoes: CartaoDaGrade[];
  /** `grid-template-areas` do desktop, ex.: `'"decisoes previsao" "decisoes mapa"'`. */
  areas?: string;
  colunas?: string;
  linhas?: string;
  /** O cartao em tela no celular (controlado). */
  ativo?: string;
  aoTrocar?: (id: string) => void;
  classe?: string;
}) {
  const base = useId();
  const [interno, setInterno] = useState(cartoes[0]?.id ?? "");
  const atual = cartoes.some((c) => c.id === (ativo ?? interno)) ? (ativo ?? interno) : cartoes[0]?.id ?? "";
  const trocar = (id: string) => { if (ativo === undefined) setInterno(id); aoTrocar?.(id); };
  const estilo = {
    ...(areas ? { "--v2-grade-areas": areas } : {}),
    ...(colunas ? { "--v2-grade-colunas": colunas } : {}),
    ...(linhas ? { "--v2-grade-linhas": linhas } : {})
  } as CSSProperties;
  return <div className={`v2-grade${classe ? ` ${classe}` : ""}`}>
    <Segmentado classe="v2-grade-seletor" rotulo={t("{grade}: cartão em tela", { grade: rotulo })} ativa={atual} aoTrocar={trocar}
      opcoes={cartoes.map((c) => ({ id: c.id, rotulo: c.rotuloCurto ?? c.titulo, controla: `${base}-${c.id}` }))} />
    <div className="v2-grade-cartoes" style={estilo} role="group" aria-label={rotulo}>
      {cartoes.map((c) => <Cartao key={c.id} cartao={c} id={`${base}-${c.id}`} ativo={c.id === atual} />)}
    </div>
  </div>;
}

function Cartao({ cartao: c, id, ativo }: { cartao: CartaoDaGrade; id: string; ativo: boolean }) {
  const [abaInterna, setAbaInterna] = useState(c.abas?.[0]?.id ?? "");
  if (c.proprio) {
    return <div id={id} className={`v2-grade-cartao is-proprio${ativo ? " is-ativo" : ""}${c.classe ? ` ${c.classe}` : ""}`}
      style={c.area ? { gridArea: c.area } : undefined}>{c.conteudo}</div>;
  }
  const aba = c.abas?.find((a) => a.id === (c.aba ?? abaInterna)) ?? c.abas?.[0];
  const trocarAba = (nova: string) => { if (c.aba === undefined) setAbaInterna(nova); c.aoTrocarAba?.(nova); };
  return <section id={id} className={`v2-cartao v2-grade-cartao${ativo ? " is-ativo" : ""}${c.classe ? ` ${c.classe}` : ""}`}
    style={c.area ? { gridArea: c.area } : undefined} aria-label={c.titulo}>
    <header className={`v2-grade-cabecalho${c.abas && aba && c.tituloComAbas ? " is-titulado" : ""}`}>
      {c.abas && aba && c.tituloComAbas && <h2>{c.titulo}</h2>}
      {c.abas && aba ? <Segmentado classe="v2-grade-abas" rotulo={t("Seções: {cartao}", { cartao: c.titulo })} ativa={aba.id} aoTrocar={trocarAba}
        opcoes={c.abas.map((a) => ({ id: a.id, rotulo: a.rotulo, contador: a.contador, controla: `${id}-painel`, idDoBotao: `${id}-aba-${a.id}`, ...(a.testId ? { testId: a.testId } : {}) }))} />
        : <h2>{c.titulo}</h2>}
      {c.dica && <Dica texto={c.dica} />}
      {c.contagem !== undefined && <span className="v2-contador">{c.contagem}</span>}
      {c.ferramentas && <span className="v2-grade-ferramentas">{c.ferramentas}</span>}
    </header>
    {c.abas && aba
      ? <div id={`${id}-painel`} className="v2-grade-corpo" role="tabpanel" aria-labelledby={`${id}-aba-${aba.id}`} tabIndex={0}>{aba.conteudo()}</div>
      : <div className="v2-grade-corpo" role="region" aria-label={t("{cartao} — conteúdo", { cartao: c.titulo })} tabIndex={0}>{c.conteudo}</div>}
    {c.rodape && <footer className="v2-grade-rodape">{c.rodape}</footer>}
  </section>;
}

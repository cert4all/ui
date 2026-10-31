import type { ReactNode } from "react";
import type { Tom } from "./Selo";
import { Vazio } from "./Estados";
import { localeAtual, t } from "./textos";

/*
  A LINHA DO TEMPO DE ATIVIDADE — a coluna lateral do registro. Do mais novo para o mais velho, AGRUPADA POR DIA
  ("Hoje", "Ontem", a data). Conta o que o registro GUARDOU e mais nada: nao ha "ligacao" nem "tarefa" inventada.
*/
export type EventoDaAtividade = {
  id: string;
  /** ISO 8601. */
  quando: string;
  titulo: string;
  detalhe?: string;
  tom: Tom;
};

const hora = (d: Date) => d.toLocaleTimeString(localeAtual(), { hour: "2-digit", minute: "2-digit" });
/*
  DATA SO-DIA ("2026-01-30", ultima compra e ultima interacao do cadastro) e data do CALENDARIO, nao meia-noite UTC: lida
  como `new Date(...)` ela caia no dia ANTERIOR no Brasil e ganhava um "21:00" inventado (bateria de 12/10 — o cabecalho
  dizia 30/01 e a atividade 29/01). O dia vem dos digitos e a hora nao aparece.
*/
const soDia = (quando: string) => /^\d{4}-\d{2}-\d{2}$/.test(quando);
const dataDe = (quando: string) => {
  if (!soDia(quando)) return new Date(quando);
  const [ano, mes, dia] = quando.split("-").map(Number) as [number, number, number];
  return new Date(ano, mes - 1, dia, 12);
};
const chaveDoDia = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function nomeDoDia(d: Date, agora: Date): string {
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (chaveDoDia(d) === chaveDoDia(agora)) return t("Hoje");
  if (chaveDoDia(d) === chaveDoDia(ontem)) return t("Ontem");
  return d.toLocaleDateString(localeAtual(), { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function Atividade({ eventos, titulo = t("Atividade"), vazio = t("Nada registrado ainda."), agora = new Date(), extra }: {
  eventos: EventoDaAtividade[];
  titulo?: string;
  vazio?: ReactNode;
  /** Para teste e para telas que fixam o relogio. */
  agora?: Date;
  /** Conteudo abaixo da linha do tempo (ex.: "ver tudo"). */
  extra?: ReactNode;
}) {
  const ordenados = [...eventos].sort((a, b) => b.quando.localeCompare(a.quando));
  const dias: { nome: string; chave: string; eventos: EventoDaAtividade[] }[] = [];
  for (const e of ordenados) {
    const d = dataDe(e.quando);
    const k = chaveDoDia(d);
    const ultimo = dias.at(-1);
    if (ultimo?.chave === k) ultimo.eventos.push(e);
    else dias.push({ nome: nomeDoDia(d, agora), chave: k, eventos: [e] });
  }
  return <aside className="v2-cartao v2-atividade" aria-label={titulo}>
    <h2 className="v2-subtitulo">{titulo}</h2>
    {/* O titulo fica; a linha do tempo rola por dentro (a tela nao rola). */}
    <div className="v2-atividade-corpo" tabIndex={0} role="region" aria-label={`${titulo} — linha do tempo`}>
    {dias.length === 0 ? <Vazio>{vazio}</Vazio> : dias.map((dia) => <section key={dia.chave} className="v2-atividade-dia" aria-label={dia.nome}>
      <h3>{dia.nome}</h3>
      <ol className="v2-linha-do-tempo">
        {dia.eventos.map((e) => <li key={e.id} className={`is-${e.tom}`}>
          <span className="v2-ponto" aria-hidden="true" />
          <div>
            <strong>{e.titulo}</strong>
            {e.detalhe && <span title={e.detalhe}>{e.detalhe}</span>}
            {!soDia(e.quando) && <time dateTime={e.quando}>{hora(dataDe(e.quando))}</time>}
          </div>
        </li>)}
      </ol>
    </section>)}
    </div>
    {extra}
  </aside>;
}

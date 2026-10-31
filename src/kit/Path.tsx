import { useEffect, useRef, type ReactNode } from "react";
import { Check } from "lucide-react";
import { t } from "./textos";

/*
  O PATH (caminho de etapas) de um registro que anda: oferta, campanha, reserva, pedido.

  Cada etapa e concluida, atual ou futura; a leitura acessivel diz isso em texto ("— concluída", "— etapa atual"), e a
  lista tem nome proprio. `encerrada` fecha o caminho por fora (perdida, cancelada): a ultima etapa troca de nome e de
  cor, e as outras apagam. `atual = -1` e o caminho que ainda nao comecou (rascunho) — diga isso em `nota`.

  No celular o caminho rola dentro do proprio cartao, e a etapa atual abre a vista.
*/
export function Path({ rotulo, etapas, atual, encerrada, nota }: {
  /** Nome da lista para o leitor de tela ("Etapas da oferta"). */
  rotulo: string;
  etapas: readonly string[];
  /** Indice da etapa atual; -1 se nenhuma. */
  atual: number;
  /** Rotulo que substitui a ultima etapa quando o registro fechou mal ("Perdida", "Cancelada"). */
  encerrada?: string;
  nota?: ReactNode;
}) {
  const lista = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = lista.current;
    const marcada = ol?.querySelector<HTMLElement>('[aria-current="step"]');
    if (ol && marcada && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = Math.max(0, marcada.offsetLeft - ol.offsetLeft - 24);
  }, [atual]);
  const ultima = etapas.length - 1;
  return <div className={`v2-cartao v2-caminho${encerrada ? " is-fechado" : ""}`}>
    <ol ref={lista} aria-label={rotulo}>
      {etapas.map((etapa, i) => {
        const estado = i === ultima && encerrada ? "is-final-ruim" : i < atual ? "is-feito" : i === atual ? "is-atual" : "is-futuro";
        return <li key={etapa} className={estado} aria-current={i === atual ? "step" : undefined}>
          {i < atual && <Check size={14} aria-hidden="true" />}
          <span>{i === ultima && encerrada ? encerrada : etapa}</span>
          <span className="v2-sr">{estado === "is-feito" ? ` — ${t("concluída")}` : estado === "is-atual" ? ` — ${t("etapa atual")}` : estado === "is-final-ruim" ? ` — ${t("encerrada")}` : ""}</span>
        </li>;
      })}
    </ol>
    {nota && <p className="v2-caminho-nota">{nota}</p>}
  </div>;
}

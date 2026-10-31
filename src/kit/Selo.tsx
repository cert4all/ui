import type { ReactNode } from "react";

/** Os cinco tons de estado da v2. Cor E texto, nunca so cor (UI_PRINCIPLES §8). */
export type Tom = "neutro" | "info" | "atencao" | "sucesso" | "perigo";

/** O selo de estado: etapa, situacao, resposta. O texto e obrigatorio — o tom so reforca. */
export function Selo({ tom, children, dica }: { tom: Tom; children: ReactNode; dica?: string }) {
  return <span className={`v2-selo is-${tom}`} title={dica}>{children}</span>;
}

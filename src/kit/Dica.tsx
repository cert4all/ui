import { Info } from "lucide-react";

/*
  O (i) DA V2 — a mesma regra do `InfoTip` da v1 (owner, 24/08: "texto explicativo tem que vir de icone (i)"): frase
  que explica COMO algo funciona nao vira paragrafo na tela, mora aqui. Abre por hover E por foco; o leitor de tela le
  a explicacao no proprio icone (`aria-label`). A bolha e CSS (`.v2-dica::after`), opaca.
*/
export function Dica({ texto }: { texto: string }) {
  return <span className="v2-dica" tabIndex={0} role="note" aria-label={texto} data-dica={texto}>
    <Info size={14} aria-hidden="true" />
  </span>;
}

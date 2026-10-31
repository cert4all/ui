/*
  O TEXTO DO KIT (C40 do Cert4All, 31/10). O kit nasceu no Stonen chamando o `t()` dele; aqui ele chama este, que o
  produto troca uma vez, na entrada: `configurarKit({ t, locale })`.

  Contrato do `t()` (o do Stonen): a chave e o proprio texto em portugues e `{nome}` e interpolado. Sem configurar, o
  kit fala portugues e formata numero em pt-BR — o que o Cert4All quer, sem dicionario.
*/
export type Valores = Record<string, string | number>;
export type Traduzir = (pt: string, valores?: Valores) => string;

function preencher(texto: string, valores?: Valores): string {
  if (!valores) return texto;
  return texto.replace(/\{(\w+)\}/g, (inteiro, nome: string) => (nome in valores ? String(valores[nome]) : inteiro));
}

let traduzir: Traduzir = preencher;
let locale: () => string = () => "pt-BR";

export function configurarKit(opcoes: { t?: Traduzir; locale?: () => string }): void {
  if (opcoes.t) traduzir = opcoes.t;
  if (opcoes.locale) locale = opcoes.locale;
}

export function t(pt: string, valores?: Valores): string {
  return traduzir(pt, valores);
}

/** Singular/plural: `tn(n, "1 reserva", "{n} reservas")`. `{n}` sempre disponivel nas duas formas. */
export function tn(n: number, um: string, varios: string, valores?: Valores): string {
  return t(n === 1 ? um : varios, { n, ...valores });
}

export function localeAtual(): string {
  return locale();
}

export function numeroLocal(valor: number, opcoes?: Intl.NumberFormatOptions): string {
  return valor.toLocaleString(localeAtual(), opcoes);
}

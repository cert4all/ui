import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

/*
  O FILTRO FICA ENQUANTO A ROTINA DURA (Lucas, Premier, 29/10): "faz o filtro, escolhe um registro para entrar nele,
  quando volta o filtro esta desfeito e precisa fazer tudo de novo". A lista e o registro sao a mesma tela da v2, e abrir
  o registro desmontava a lista: o filtro em `useState` sumia, e o que morava no endereco (`?q=`, `?vendedor=`) se
  perdia porque a trilha e o menu voltam para a rota limpa. Valia para Clientes, Ofertas, Campanhas, Estoque, Quadro,
  Funil, Chat — todas.

  DUAS PECAS, as duas em `sessionStorage`: dura enquanto a aba esta aberta, some ao fechar (o filtro de ontem nao
  aparece hoje sem ninguem pedir) e cada aba tem o seu. Sem armazenamento (aba privada, bloqueio), vale so enquanto a
  tela esta aberta — nunca um erro.

    - `useNaSessao`: o `useState` dos filtros que nao moram no endereco. Mesma assinatura; a chave e da tela.
    - `lembrarBuscaDaLista`/`buscaLembradaDaLista`: o endereco filtrado de cada lista. A V2App grava a busca enquanto a
      lista esta aberta e a devolve quando se chega a rota limpa vindo de outro lugar (o registro, o menu, a trilha).
      Parametro que ABRE alguma coisa (o cartao, a conversa, o recorte de outra tela) nao se guarda: voltar a lista nao
      pode reabrir o cartao de antes.
*/

const PREFIXO_DO_FILTRO = "stonen-v2-filtro:";
const PREFIXO_DA_LISTA = "stonen-v2-lista:";

function ler<T>(chave: string): { valor: T } | null {
  try {
    const bruto = window.sessionStorage.getItem(chave);
    return bruto === null ? null : { valor: JSON.parse(bruto) as T };
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown): void {
  try { window.sessionStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento, vale so agora */ }
}

/** O `useState` de um filtro, guardado na sessao pela `chave` (nula = nao guarda). Valor precisa ser JSON. */
export function useNaSessao<T>(chave: string | null, inicial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [valor, setValor] = useState<T>(() => {
    const lido = chave ? ler<T>(PREFIXO_DO_FILTRO + chave) : null;
    if (lido) return lido.valor;
    return typeof inicial === "function" ? (inicial as () => T)() : inicial;
  });
  const mudar = useCallback<Dispatch<SetStateAction<T>>>((novo) => {
    setValor((atual) => {
      const proximo = typeof novo === "function" ? (novo as (anterior: T) => T)(atual) : novo;
      if (chave) gravar(PREFIXO_DO_FILTRO + chave, proximo);
      return proximo;
    });
  }, [chave]);
  return [valor, mudar];
}

/** Parametros que abrem um registro ou recortam pela porta de outra tela: valem para a ida, nao para a volta. */
const DE_PORTA = new Set(["recommendationId", "customerId", "sellerId", "axis", "focus", "productId", "productName",
  "bundleId", "conversa", "campanha", "chamado", "aba", "secao"]);

/** A busca que vale guardar: sem os parametros de porta. "" quando nao sobra nada. */
export function buscaDeFiltro(search: string): string {
  const parametros = new URLSearchParams(search);
  for (const nome of [...parametros.keys()]) if (DE_PORTA.has(nome)) parametros.delete(nome);
  const texto = parametros.toString();
  return texto ? `?${texto}` : "";
}

export function lembrarBuscaDaLista(raiz: string, search: string): void {
  gravar(PREFIXO_DA_LISTA + raiz, buscaDeFiltro(search));
}

export function buscaLembradaDaLista(raiz: string): string {
  const lida = ler<unknown>(PREFIXO_DA_LISTA + raiz)?.valor;
  return typeof lida === "string" ? lida : "";
}

import { useState } from "react";

/*
  A ESCOLHA LEMBRADA (vista salva, densidade, aba): por usuario, neste navegador, em `localStorage`. Sem armazenamento
  (aba privada, bloqueio) a escolha vale so enquanto a tela esta aberta — nunca um erro. O valor lido que nao e mais
  valido (vista que deixou de existir para o perfil) cai no `inicial` por quem consome, via `valido`.
*/
export function useLembrado<T extends string>(chave: string | null, inicial: T, valido?: (valor: string) => boolean): [T, (valor: T) => void] {
  const [valor, setValor] = useState<T>(() => {
    if (!chave) return inicial;
    try {
      const lido = window.localStorage.getItem(chave);
      return lido !== null && (!valido || valido(lido)) ? lido as T : inicial;
    } catch {
      return inicial;
    }
  });
  const gravar = (novo: T) => {
    setValor(novo);
    if (!chave) return;
    try { window.localStorage.setItem(chave, novo); } catch { /* sem memoria, vale so agora */ }
  };
  return [valor, gravar];
}

import { useState } from "react";

/*
  O AVATAR DA V2 (ADR-0069: "foto se houver, iniciais se nao; a foto nao e elemento central") — um so para o topo e a
  Equipe. Sem foto, ou se ela nao carregar, as iniciais. Decorativo: quem usa poe o nome ao lado ou no nome acessivel
  do botao, entao o leitor de tela nao le o avatar. A forma (tamanho, cor) e de quem usa, pela `classe`.
*/
export function iniciaisDe(nome: string): string {
  return nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export function Avatar({ nome, fotoUrl, classe }: { nome: string; fotoUrl?: string | null | undefined; classe: string }) {
  const [falhou, setFalhou] = useState(false);
  if (fotoUrl && !falhou) return <img className={classe} src={fotoUrl} alt="" onError={() => setFalhou(true)} />;
  return <span className={`${classe} is-iniciais`} aria-hidden="true">{iniciaisDe(nome)}</span>;
}

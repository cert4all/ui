import type { ReactNode } from "react";
import { CheckCircle2, Lock, RefreshCw } from "lucide-react";
import { t } from "./textos";

/*
  OS ESTADOS DE UMA AREA DA V2: carregando, vazio, erro, sem permissao, sucesso e desabilitado com motivo. Toda lista, aba e painel usa estes quatro, e
  nunca um texto solto — assim a pessoa le o mesmo estado do mesmo jeito em todas as telas.

  - `Carregando` anuncia (`role="status"`), sem esqueleto animado: a v2 nao inventa forma do que ainda nao chegou.
  - `Vazio` diz o que NAO ha e, quando houver, a proxima acao (`acao`).
  - `Erro` diz que falhou e oferece tentar de novo; nunca mostra dado parcial como se fosse inteiro.
  - `SemPermissao` diz que o perfil nao alcanca — diferente de vazio, que e "alcanca e nao ha".
  - `Sucesso` confirma o que acabou de acontecer, curto, anunciado (`role="status"`), com a proxima acao se houver.
  - `Motivo` diz POR QUE uma acao esta desabilitada, ligado a ela por `aria-describedby` — nunca botao apagado calado.
*/
export function Carregando({ children = t("Carregando…") }: { children?: ReactNode }) {
  return <p className="v2-estado-area" role="status">{children}</p>;
}

export function Vazio({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return <div className="v2-estado-area"><p>{children}</p>{acao}</div>;
}

export function Erro({ children = t("Não foi possível carregar."), aoTentarDeNovo }: { children?: ReactNode; aoTentarDeNovo?: () => void }) {
  return <div className="v2-estado-area is-erro" role="alert">
    <p>{children}</p>
    {aoTentarDeNovo && <button type="button" className="v2-botao" onClick={aoTentarDeNovo}>
      <RefreshCw size={14} aria-hidden="true" />{t("Tentar de novo")}
    </button>}
  </div>;
}

/** A API recusou por PERMISSAO (403): tentar de novo nao resolve, e a tela diz quem resolve (auditoria 16/10). */
export function ehSemPermissao(erro: unknown): boolean {
  return Boolean(erro && typeof erro === "object" && (erro as { status?: number }).status === 403);
}

export function SemPermissao({ children = t("Seu perfil não alcança esta informação.") }: { children?: ReactNode }) {
  return <p className="v2-estado-area"><Lock size={14} aria-hidden="true" />{children}</p>;
}

export function Sucesso({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return <div className="v2-estado-area is-sucesso" role="status">
    <p><CheckCircle2 size={14} aria-hidden="true" />{children}</p>{acao}
  </div>;
}

export function Motivo({ id, children }: { id: string; children: ReactNode }) {
  return <p id={id} className="v2-motivo">{children}</p>;
}

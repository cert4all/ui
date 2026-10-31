/*
  O INTERRUPTOR — o liga/desliga da v2 (C40, 31/10: as telas do Cert4All trocavam o `Switch` do shadcn por um checkbox
  com classe local). Um checkbox NATIVO com `role="switch"`: teclado, formulário e leitor de tela de graça. Também serve
  como classe solta (`v2-interruptor`) num `<input type="checkbox" role="switch">` que a tela já monta.
*/
export function Interruptor({ ligado, aoMudar, rotulo, desabilitado = false, id, testId, dica }: {
  ligado: boolean;
  aoMudar: (ligado: boolean) => void;
  /** Nome acessível (o rótulo visível, quando há, fica num `<label htmlFor>` da tela). */
  rotulo: string;
  desabilitado?: boolean;
  id?: string;
  testId?: string;
  dica?: string;
}) {
  return <input type="checkbox" role="switch" className="v2-interruptor" checked={ligado} aria-checked={ligado}
    aria-label={rotulo} title={dica} disabled={desabilitado} onChange={(e) => aoMudar(e.target.checked)}
    {...(id ? { id } : {})} {...(testId ? { "data-testid": testId } : {})} />;
}

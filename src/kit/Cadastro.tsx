import { useId, useRef, useState, type DragEvent, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { ChevronRight, FileUp, RefreshCw, X } from "lucide-react";
import { Dica } from "./Dica";
import { t } from "./textos";

/*
  A PAGINA DE CADASTRO DA V2 (ADR-0069) — a concepcao unica de toda tela que inclui ou edita (Incluir bundle, Importar
  romaneio, Nova campanha, Nova integracao...):

      trilha (Lista > Incluir bundle)
      [icone] Titulo (i)                                          [Cancelar] [SALVAR]   <- cabecalho
      corpo que ROLA: blocos (`Secao`) com campos em DUAS colunas no desktop, uma no celular
      rodape FIXO no painel:  [erro geral]   Cancelar ................................. [SALVAR]

  - A tela nao rola: trilha, cabecalho e rodape ficam; so o corpo rola. Nada de formulario estreito perdido: o corpo
    usa a largura do cartao, com teto de leitura so no texto longo.
  - Cancelar SEMPRE a esquerda do rodape; a acao primaria SEMPRE a direita. O cabecalho repete as duas (a pessoa que
    nao rolou ate o fim alcanca as duas).
  - Erro de campo mora junto do campo (cada tela usa `aria-invalid`/`aria-describedby`); erro geral (o do servidor) no
    rodape, `role="alert"`. `motivo` diz POR QUE a primaria esta desabilitada — nunca um botao apagado calado.
  - O `<form>` e daqui: Enter num campo envia; a tela recebe `aoSalvar`.
*/
export function PaginaDeCadastro({
  icone, titulo, dica, trilha, rotuloDaPrimaria, aoSalvar, aoCancelar, salvando = false, motivo = null, erro = null,
  rotuloDoCancelar = t("Cancelar"), extraDoRodape, children
}: {
  icone: ReactNode;
  titulo: string;
  dica?: string;
  /** Os niveis acima do cadastro (a lista de onde se veio). O ultimo nivel e o proprio cadastro, posto aqui. */
  trilha: { rotulo: string; href: string; aoClicar: () => void }[];
  rotuloDaPrimaria: string;
  aoSalvar: () => void;
  aoCancelar: () => void;
  salvando?: boolean;
  /** Por que salvar esta desabilitado. Presente = desabilitado, e a frase aparece no rodape. */
  motivo?: string | null;
  /** O erro geral (o do servidor), no rodape. */
  erro?: string | null;
  rotuloDoCancelar?: string;
  /** Algo a mais no rodape, antes do Cancelar (ex.: "Gravar rascunho"). */
  extraDoRodape?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const desabilitado = salvando || Boolean(motivo);
  const enviar = (e: FormEvent) => { e.preventDefault(); if (!desabilitado) aoSalvar(); };
  const primaria = (onde: "topo" | "rodape") => <button type="submit" form={`${id}-form`} className="v2-botao is-primario"
    disabled={desabilitado} aria-describedby={motivo ? `${id}-motivo` : undefined} data-onde={onde}>
    {salvando ? t("Salvando…") : rotuloDaPrimaria}
  </button>;
  return <section className="v2-pagina is-inteira v2-cadastro" aria-labelledby={`${id}-titulo`}>
    <nav className="v2-trilha" aria-label={t("Você está em")}>
      {trilha.map((nivel, i) => <span key={`${i}:${nivel.rotulo}`} className="v2-trilha-nivel">
        {i > 0 && <ChevronRight size={14} aria-hidden="true" />}
        <a href={nivel.href} onClick={(e: MouseEvent) => { e.preventDefault(); nivel.aoClicar(); }}>{nivel.rotulo}</a>
      </span>)}
      <span className="v2-trilha-nivel"><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{titulo}</span></span>
    </nav>
    <header className="v2-cartao v2-cabecalho-tela">
      <span className="v2-icone-objeto" aria-hidden="true">{icone}</span>
      <h1 id={`${id}-titulo`}>{titulo}</h1>
      {dica && <Dica texto={dica} />}
      <span className="v2-cabecalho-tela-acoes">
        <button type="button" className="v2-botao" onClick={aoCancelar} disabled={salvando}>{rotuloDoCancelar}</button>
        {primaria("topo")}
      </span>
    </header>
    <form id={`${id}-form`} className="v2-cartao v2-cadastro-painel" aria-labelledby={`${id}-titulo`} onSubmit={enviar} noValidate>
      <div className="v2-cadastro-corpo">{children}</div>
      <footer className="v2-cadastro-rodape">
        <button type="button" className="v2-botao" onClick={aoCancelar} disabled={salvando}>{rotuloDoCancelar}</button>
        <span className="v2-cadastro-rodape-meio">
          {erro && <p className="v2-erro" role="alert">{erro}</p>}
          {!erro && motivo && <p id={`${id}-motivo`} className="v2-cadastro-motivo">{motivo}</p>}
        </span>
        {extraDoRodape}
        {primaria("rodape")}
      </footer>
    </form>
  </section>;
}

/** Um bloco do cadastro: titulo, (i) e campos em duas colunas (`v2-cadastro-campos`). */
export function BlocoDoCadastro({ titulo, dica, children, largo = false }: { titulo: string; dica?: string; children: ReactNode; largo?: boolean }) {
  const id = useId();
  return <fieldset className={`v2-cadastro-bloco${largo ? " is-largo" : ""}`} aria-labelledby={`${id}-titulo`}>
    <legend id={`${id}-titulo`}>{titulo}{dica && <Dica texto={dica} />}</legend>
    <div className="v2-cadastro-campos">{children}</div>
  </fieldset>;
}

/*
  UM CAMPO DO CADASTRO: rotulo visivel, obrigatorio marcado, ajuda curta e erro JUNTO do campo. O controle e da tela
  (input, select, textarea) — recebe `id`, `aria-invalid` e `aria-describedby` prontos por `props`.
*/
export function CampoDoCadastro({ rotulo, obrigatorio = false, ajuda, erro, largo = false, children }: {
  rotulo: string;
  obrigatorio?: boolean;
  ajuda?: string;
  erro?: string | null;
  largo?: boolean;
  children: (props: { id: string; "aria-invalid": true | undefined; "aria-describedby": string | undefined; required: boolean | undefined }) => ReactNode;
}) {
  const id = useId();
  const descritos = [ajuda ? `${id}-ajuda` : null, erro ? `${id}-erro` : null].filter(Boolean).join(" ") || undefined;
  return <div className={`v2-cadastro-campo${largo ? " is-largo" : ""}${erro ? " is-erro" : ""}`}>
    <label htmlFor={id}>{rotulo}{obrigatorio && <span className="v2-obrigatorio" aria-hidden="true"> *</span>}</label>
    {children({ id, "aria-invalid": erro ? true : undefined, "aria-describedby": descritos, required: obrigatorio || undefined })}
    {ajuda && <small id={`${id}-ajuda`} className="v2-cadastro-ajuda">{ajuda}</small>}
    {erro && <p id={`${id}-erro`} className="v2-campo-erro">{erro}</p>}
  </div>;
}

/*
  O BLOCO DE ARQUIVO: os quatro estados que todo upload tem — vazio (soltar ou escolher), arquivo escolhido (nome,
  tamanho, trocar, tirar), erro (a frase, apontando arquivo/linha quando a tela souber) e progresso (enviando N%).
*/
export function BlocoDeArquivo({ rotulo, aceita, arquivos, multiplo = false, aoEscolher, aoTirar, erro = null, progresso = null, ajuda, obrigatorio = false }: {
  rotulo: string;
  /** O `accept` do input (".xls,.xlsx", "application/pdf", "image/*"). */
  aceita: string;
  arquivos: File[];
  multiplo?: boolean;
  aoEscolher: (arquivos: File[]) => void;
  aoTirar: (indice: number) => void;
  erro?: string | null;
  /** 0 a 100 enquanto envia; nulo fora do envio. */
  progresso?: number | null;
  ajuda?: string;
  obrigatorio?: boolean;
}) {
  const id = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [sobre, setSobre] = useState(false);
  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setSobre(false);
    const lista = [...e.dataTransfer.files];
    if (lista.length) aoEscolher(multiplo ? lista : lista.slice(0, 1));
  };
  const tamanho = (n: number) => (n >= 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} kB`);
  const estado = progresso !== null ? "enviando" : erro ? "erro" : arquivos.length ? "escolhido" : "vazio";
  return <div className={`v2-arquivo is-${estado}${sobre ? " is-sobre" : ""}`}
    onDragOver={(e) => { e.preventDefault(); setSobre(true); }} onDragLeave={() => setSobre(false)} onDrop={soltar}>
    <p className="v2-arquivo-rotulo" id={`${id}-rotulo`}>{rotulo}{obrigatorio && <span className="v2-obrigatorio" aria-hidden="true"> *</span>}</p>
    <input ref={campo} id={id} type="file" className="v2-sr" accept={aceita} multiple={multiplo}
      aria-labelledby={`${id}-rotulo`} aria-describedby={[ajuda ? `${id}-ajuda` : null, erro ? `${id}-erro` : null].filter(Boolean).join(" ") || undefined}
      onChange={(e) => { const lista = [...(e.target.files ?? [])]; if (lista.length) aoEscolher(lista); e.target.value = ""; }} />
    {arquivos.length > 0 && <ul className="v2-arquivo-lista">
      {arquivos.map((a, i) => <li key={`${a.name}:${i}`}>
        <span title={a.name}>{a.name}</span><small>{tamanho(a.size)}</small>
        <button type="button" className="v2-botao-icone" aria-label={t("Tirar {arquivo}", { arquivo: a.name })} onClick={() => aoTirar(i)} disabled={progresso !== null}>
          <X size={14} aria-hidden="true" />
        </button>
      </li>)}
    </ul>}
    {progresso !== null
      ? <div className="v2-arquivo-progresso" role="progressbar" aria-labelledby={`${id}-rotulo`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progresso)}>
        <i style={{ width: `${Math.max(0, Math.min(100, progresso))}%` }} /><span>{t("Enviando… {n}%", { n: Math.round(progresso) })}</span>
      </div>
      : <button type="button" className="v2-botao" onClick={() => campo.current?.click()}>
        {arquivos.length ? <><RefreshCw size={14} aria-hidden="true" />{multiplo ? t("Acrescentar arquivos") : t("Trocar arquivo")}</>
          : <><FileUp size={14} aria-hidden="true" />{multiplo ? t("Escolher arquivos") : t("Escolher arquivo")}</>}
      </button>}
    {!arquivos.length && progresso === null && <small className="v2-arquivo-soltar">{t("ou solte aqui")}</small>}
    {ajuda && <small id={`${id}-ajuda`} className="v2-cadastro-ajuda">{ajuda}</small>}
    {erro && <p id={`${id}-erro`} className="v2-campo-erro" role="alert">{erro}</p>}
  </div>;
}

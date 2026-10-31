import { createContext, useContext, useId, useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { Dica } from "./Dica";
import { t } from "./textos";

/*
  SECAO, CAMPO E FORMULARIO — os "Detalhes" de um registro, no padrao de pagina de registro: rotulo em cima, valor
  embaixo, duas colunas no desktop e uma no celular.

  LEITURA E EDICAO INLINE. Fora de um `Formulario`, `Campo` so le. Dentro de um, cada campo editavel mostra o lapis;
  o lapis (ou "Editar") poe o formulario INTEIRO em edicao, como no registro de um CRM: os campos viram controles,
  "Salvar" e "Cancelar" aparecem embaixo. Salvar valida TODOS os campos; o erro aparece embaixo do proprio campo
  (`aria-invalid` + `aria-describedby`) e o foco vai ao primeiro com erro. O erro do servidor (a frase que o `api.ts`
  ja traduziu) aparece no rodape. Cancelar volta aos valores de antes.

  O valor e sempre texto no formulario; a tela converte no `aoSalvar` (numero, data) e recusa la o que a API recusaria.
*/
export type Valores = Record<string, string>;

type Contexto = {
  editando: boolean;
  valores: Valores;
  erros: Record<string, string>;
  podeEditar: boolean;
  mudar: (nome: string, valor: string) => void;
  editar: () => void;
  registrar: (nome: string, validar: (valor: string, todos: Valores) => string | null) => void;
};
const ContextoDoFormulario = createContext<Contexto | null>(null);

export function Formulario({ valores: iniciais, aoSalvar, podeEditar = true, rotulo, children }: {
  valores: Valores;
  /** Recebe os valores editados. Lance `Error` para mostrar a frase no rodape; resolva DEPOIS de atualizar a fonte
   *  (mutacao + invalidacao), porque a leitura volta a mostrar `valores` de fora. */
  aoSalvar: (valores: Valores) => Promise<void> | void;
  podeEditar?: boolean;
  /** Nome acessivel do formulario ("Detalhes do cliente"). */
  rotulo: string;
  children: ReactNode;
}) {
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState<Valores>(iniciais);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  // Cada campo editavel registra a propria regra a cada render; o objeto e deste render, como o `salvar` que o le.
  const validadores: Record<string, (valor: string, todos: Valores) => string | null> = {};

  const ctx: Contexto = {
    // Em leitura vale a FONTE (`iniciais`): o `aoSalvar` resolve depois de atualizar a fonte, e a leitura acompanha.
    editando, valores: editando ? valores : iniciais, erros, podeEditar,
    mudar: (nome, valor) => {
      setValores((v) => ({ ...v, [nome]: valor }));
      if (erros[nome]) setErros((atual) => { const copia = { ...atual }; delete copia[nome]; return copia; });
    },
    editar: () => { if (podeEditar) { setValores(iniciais); setEditando(true); } },
    registrar: (nome, validar) => { validadores[nome] = validar; }
  };

  const cancelar = () => { setEditando(false); setValores(iniciais); setErros({}); setErroGeral(null); };
  const salvar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const achados: Record<string, string> = {};
    for (const [nome, validar] of Object.entries(validadores)) {
      const erro = validar(valores[nome] ?? "", valores);
      if (erro) achados[nome] = erro;
    }
    setErros(achados);
    const primeiro = Object.keys(achados)[0];
    if (primeiro) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${primeiro}"]`)?.focus();
      return;
    }
    setSalvando(true);
    setErroGeral(null);
    try {
      await aoSalvar(valores);
      setEditando(false);
    } catch (falha) {
      setErroGeral(falha instanceof Error ? falha.message : t("Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  };

  return <ContextoDoFormulario.Provider value={ctx}>
    <form className={`v2-formulario-registro${editando ? " is-editando" : ""}`} aria-label={rotulo} onSubmit={salvar} noValidate>
      {children}
      {editando && <div className="v2-formulario-rodape">
        {erroGeral && <p className="v2-erro" role="alert">{erroGeral}</p>}
        <button type="button" className="v2-botao" onClick={cancelar} disabled={salvando}>{t("Cancelar")}</button>
        <button type="submit" className="v2-botao is-primario" disabled={salvando}>{salvando ? t("Salvando…") : t("Salvar")}</button>
      </div>}
    </form>
  </ContextoDoFormulario.Provider>;
}

/** Um grupo de campos com titulo (e (i) opcional). `recolhivel` deixa a pessoa fechar a secao. */
export function Secao({ titulo, dica, acoes, recolhivel = false, children }: {
  titulo: string;
  dica?: string;
  acoes?: ReactNode;
  recolhivel?: boolean;
  children: ReactNode;
}) {
  const [aberta, setAberta] = useState(true);
  const id = useId();
  return <section className="v2-secao" aria-labelledby={`${id}-titulo`}>
    <header>
      {recolhivel
        ? <button type="button" className="v2-secao-alternar" aria-expanded={aberta} aria-controls={`${id}-corpo`} onClick={() => setAberta((v) => !v)}>
          <ChevronDown size={16} aria-hidden="true" className={aberta ? undefined : "is-fechada"} /><h2 id={`${id}-titulo`}>{titulo}</h2>
        </button>
        : <h2 id={`${id}-titulo`}>{titulo}</h2>}
      {dica && <Dica texto={dica} />}
      {acoes && <span className="v2-secao-acoes">{acoes}</span>}
    </header>
    <div id={`${id}-corpo`} className="v2-secao-corpo" hidden={!aberta}>{children}</div>
  </section>;
}

type TipoDeCampo = "texto" | "numero" | "email" | "telefone" | "data" | "area" | "selecao";

/*
  UM CAMPO. Fora de `Formulario` (ou sem `nome`), le `valor`. Dentro, le e edita `valores[nome]`.
  `formatar` muda so a LEITURA (ex.: "300" -> "US$ 300/m²"); vazio na leitura vira `ausente` ("—" por padrao).
*/
export function Campo({ rotulo, nome, valor, tipo = "texto", opcoes, obrigatorio = false, validar, formatar, ausente = "—", dica, largo = false, somenteLeitura = false }: {
  rotulo: string;
  nome?: string;
  valor?: ReactNode;
  tipo?: TipoDeCampo;
  opcoes?: { valor: string; rotulo: string }[];
  obrigatorio?: boolean;
  validar?: (valor: string, todos: Valores) => string | null;
  formatar?: (valor: string) => ReactNode;
  ausente?: string;
  dica?: string;
  /** Ocupa a largura da secao (mensagem, observacao). */
  largo?: boolean;
  somenteLeitura?: boolean;
}) {
  const ctx = useContext(ContextoDoFormulario);
  const id = useId();
  const doFormulario = Boolean(ctx && nome);
  const bruto = doFormulario ? ctx!.valores[nome!] ?? "" : null;
  const editavel = doFormulario && !somenteLeitura && ctx!.podeEditar;

  if (doFormulario && editavel) {
    ctx!.registrar(nome!, (v, todos) => {
      if (obrigatorio && !v.trim()) return t("Obrigatório.");
      if (tipo === "email" && v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return t("E-mail inválido.");
      if (tipo === "numero" && v.trim() && !Number.isFinite(Number(v.replace(",", ".")))) return t("Número inválido.");
      return validar?.(v, todos) ?? null;
    });
  }

  const classe = `v2-campo${largo ? " is-largo" : ""}`;
  if (doFormulario && editavel && ctx!.editando) {
    const erro = ctx!.erros[nome!];
    const comum = {
      id, name: nome, value: bruto ?? "", "aria-invalid": erro ? true : undefined, "aria-describedby": erro ? `${id}-erro` : undefined,
      required: obrigatorio || undefined
    };
    const mudar = (v: string) => ctx!.mudar(nome!, v);
    return <div className={classe}>
      <label htmlFor={id}>{rotulo}{obrigatorio && <span aria-hidden="true"> *</span>}{dica && <Dica texto={dica} />}</label>
      {tipo === "area" ? <textarea {...comum} rows={3} onChange={(e) => mudar(e.target.value)} />
        : tipo === "selecao" ? <select {...comum} onChange={(e) => mudar(e.target.value)}>
          {!obrigatorio && <option value="">—</option>}
          {(opcoes ?? []).map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
        </select>
          : <input {...comum} type={tipo === "numero" ? "text" : tipo === "telefone" ? "tel" : tipo === "data" ? "date" : tipo === "email" ? "email" : "text"}
            inputMode={tipo === "numero" ? "decimal" : undefined} onChange={(e) => mudar(e.target.value)} />}
      {erro && <p id={`${id}-erro`} className="v2-campo-erro">{erro}</p>}
    </div>;
  }

  const textoLido = bruto !== null
    ? (bruto.trim() ? (formatar ? formatar(bruto) : tipo === "selecao" ? opcoes?.find((o) => o.valor === bruto)?.rotulo ?? bruto : bruto) : null)
    : valor ?? null;
  return <div className={classe}>
    <dt className="v2-campo-rotulo">{rotulo}{dica && <Dica texto={dica} />}</dt>
    <dd className={textoLido === null || textoLido === "" ? "is-ausente" : undefined}>
      <span>{textoLido === null || textoLido === "" ? ausente : textoLido}</span>
      {editavel && <button type="button" className="v2-campo-editar" aria-label={t("Editar {campo}", { campo: rotulo })} title={t("Editar {campo}", { campo: rotulo })} onClick={ctx!.editar}>
        <Pencil size={14} aria-hidden="true" />
      </button>}
    </dd>
  </div>;
}

/** A grade de campos de uma secao: `<dl>` em leitura, `<div>` em edicao (os campos ja trazem `label`). */
export function Campos({ children }: { children: ReactNode }) {
  const ctx = useContext(ContextoDoFormulario);
  return ctx?.editando ? <div className="v2-campos-grade">{children}</div> : <dl className="v2-campos-grade">{children}</dl>;
}

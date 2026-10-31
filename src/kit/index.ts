/*
  O KIT DA V2 (ADR-0065 do Stonen; no `@cert4all/ui` desde a C40 do Cert4All, 31/10) — os componentes que toda tela
  usa. Importe de `@cert4all/ui/kit`; o estilo e `@cert4all/ui/kit.css`. Guia de uso: `src/kit/LEIA-ME.md`.
  O texto passa por `configurarKit({ t, locale })` (padrao: portugues).
*/
export { configurarKit, type Traduzir } from "./textos";
export { Selo, type Tom } from "./Selo";
export { Dica } from "./Dica";
export { Carregando, Vazio, Erro, SemPermissao, Sucesso, Motivo, ehSemPermissao } from "./Estados";
export { useLembrado } from "./lembrar";
export { useNaSessao, lembrarBuscaDaLista, buscaLembradaDaLista, buscaDeFiltro } from "./filtroDaSessao";
export { Menu, type ItemDeMenu } from "./Menu";
export { ListView, type ColunaDaLista, type VistaDaLista, type EstadoDaLista } from "./ListView";
export { PaginaDeRegistro, Destaque, BarraDeAcoes, type CampoDoDestaque, type AcaoDoRegistro } from "./Destaque";
export { Path } from "./Path";
export { Abas, type AbaDoRegistro } from "./Abas";
export { Atividade, type EventoDaAtividade } from "./Atividade";
export { ListaRelacionada } from "./ListaRelacionada";
export { Formulario, Secao, Campo, Campos, type Valores } from "./Formulario";
export { Kanban, type ColunaDoKanban } from "./Kanban";
export { PainelDeIndicadores, type Indicador } from "./PainelDeIndicadores";
export { Dialogo, Gaveta } from "./Sobreposicao";
export { Segmentado, type OpcaoSegmentada } from "./Segmentado";
export { PaginaInteira, GradeDeCartoes, type CartaoDaGrade, type AbaDoCartao } from "./GradeDeCartoes";
export { CabecalhoDaTela } from "./Cabecalho";
export { PaginaDeCadastro, BlocoDoCadastro, CampoDoCadastro, BlocoDeArquivo } from "./Cadastro";
export { Avatar, iniciaisDe } from "./Avatar";

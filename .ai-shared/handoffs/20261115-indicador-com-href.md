# Handoff — o indicador com `href` sem o valor (15/11)

- Branch `work/indicador-com-href`. Origem: o Portfólio da Daphnis (cert4all/daphnis#161, handoff
  `daphnis/.ai-shared/handoffs/20261115-portfolio-v2.md`), onde "Custo acumulado" e "Custo do mês" apareciam só com o rótulo
  centralizado e o detalhe, sem o número.
- O merge e a publicação do kit são do owner. Este PR para no PR.

## A causa

O DOM do kit sempre esteve certo: o `<a>` tem rótulo, `<strong>` e detalhe, como o `<button>`. O problema era a cascata.

- O Portfólio embrulha o painel em `<div className="daphnis-faixa">` (`web/src/paginas/Portfolio.tsx`).
- `.daphnis-faixa a` é a regra das abas de seção do projeto (`web/src/estilos/projeto.css`): `display: inline-flex;
  height: 38px; align-items: center; white-space: nowrap`.
- `.daphnis-faixa a` e `.v2-indicador > a` têm a mesma especificidade (0,1,1). A folha da Daphnis vem depois do kit, então a
  regra dela vencia: o cartão ficava com 38 px e o rótulo centralizado, e o valor (`overflow: hidden` no `gestao.css`)
  ficava com altura 0.
- Com `aoAbrir` o cartão é um `<button>`, que a regra `a` não atinge. Por isso só os dois com `href` falhavam.

Medido no Chromium, com o web da Daphnis (origin/main com `href` de volta nos dois cartões), a API simulada pelos números de
`e2e/portfolio.estado.json`, a 1440 px:

| Cartão | Antes (kit `c9d2974`) | Depois (esta branch) |
|---|---|---|
| Custo acumulado (`<a>`) | `inline-flex`, valor com altura 0 | `flex`, valor com 30,8 px |
| Custo do mês (`<a>`) | `inline-flex`, valor com altura 0 | `flex`, valor com 30,8 px |
| Os 5 com `aoAbrir` (`<button>`) | `flex`, 30,8 px | `flex`, 30,8 px |

## A correção (`src/kit/kit.css`)

- A forma do cartão passou de `.v2-indicador > a|button|div` para `.v2-indicadores > .v2-indicador > a|button|div`, com
  especificidade 0,2,1. Uma regra de contexto do produto do tipo `.x a` (0,1,1) não ganha mais do cartão.
- O bloco agora declara também o que a regra de link do produto mudava e o `<button>` já tinha por padrão: `flex: none`,
  `align-items: stretch`, `justify-content: flex-start` e `white-space: normal`. O `:hover` fixa a cor do texto.
- As sobrescritas que os produtos fazem de propósito continuam valendo, porque todas têm especificidade maior que 0,2,1:
  Stonen (`.v2 .v2-hoje .v2-indicadores.is-faixa .v2-indicador > :is(a, button, div)`,
  `.v2 .v2-acomp-faixa .v2-indicador > button`), Hugi (`.v2[data-aparencia] #v2-conteudo .v2-indicador > :is(a, button, div)`)
  e Cert4All (`.c4a-fin .v2-indicador strong`, que mira o `strong`).
- O teste está em `src/kit/PainelDeIndicadores.test.tsx`. O primeiro caso confere no DOM a mesma estrutura com `href` e com
  `aoAbrir`, e a navegação. Ele passava antes da correção: o defeito não aparece no DOM. O segundo caso lê a folha e exige
  pelo menos duas classes no seletor da forma do cartão com `> a`, mais as declarações acima. Sem a correção ele falha:
  `.v2-indicador > a: expected 1 to be greater than or equal to 2`.

## Os indicadores com `href` nos produtos (`origin/main` de cada repositório, 15/11)

Levantamento estático. Para cada `PainelDeIndicadores` com indicador que tem `href`, procurei nas folhas do produto alguma
regra de `a` cujo contexto envolva o painel.

| Produto | Tela | Indicadores com `href` | Afetado antes da correção? |
|---|---|---|---|
| Daphnis | Portfólio (`web/src/paginas/Portfolio.tsx`) | Custo acumulado, Custo do mês | **Sim** (`.daphnis-faixa a`). Contornado no #161 com `aoAbrir`. |
| Daphnis | Lançador (`web/src/paginas/Lancador.tsx:66`) | Decisões esperando você | Não: nenhuma regra de `a` com contexto envolve o painel |
| Daphnis | Projeto, resumo (`web/src/paginas/Projeto.tsx:97-99`) | Pede você, Andando (quando há missão), Frentes abertas | Não: a `.daphnis-faixa` do Projeto é a `<nav>` de seções no cabeçalho, fora do painel |
| Stonen | Hoje (`apps/web/src/features/v2/hoje/TelaDeHoje.tsx:170-174`, faixa da linha 384) | os indicadores com porta (`href` + `aoAbrir`) | Não: as regras de `a` do Hoje são de `.v2-hoje-meses` e `.v2-hoje-decisoes-chips`, fora da faixa |
| Cert4All | — | nenhum (todos usam `aoAbrir`) | — |
| Hugi | Publicações e Saúde do número | nenhum com `href` (`metricas.tsx` é um componente próprio, não o painel do kit) | — |

Outros repositórios do portfólio (Íris, Togue, Huga, Elara…) não usam o `PainelDeIndicadores`.

O Lançador, o Projeto e o Hoje não foram abertos no navegador: o "não" deles vem da leitura das folhas. Depois da correção
todos ficam protegidos de qualquer forma.

## Próximo passo (de quem publicar o kit)

- Atualizar o `@cert4all/ui` nos produtos e rodar a trava "a tela não rola" do Stonen e do Cert4All (`src/kit/LEIA-ME.md`).
- Na Daphnis, opcional: com o kit novo o Portfólio pode voltar a `href: "/custos"` (com `aoAbrir` junto, para navegar sem
  recarregar). Assim o cartão vira um link de verdade (abre em outra aba, copia o endereço).

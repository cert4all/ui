# O kit da v2

Os componentes das cinco famílias de tela (Cockpit, Consulta, Cadastro, Detalhe, Mesa de trabalho). Nasceram no
Stonen (ADR-0065 e ADR-0069 de lá) e vieram para cá na C40 do Cert4All (31/10/2026), para os dois produtos usarem a
mesma peça.

**O conceito e as regras de uso estão no guia do Stonen**, `stonen/apps/web/src/features/v2/LEIA-ME.md`, nas seções
3 ("A tela não rola"), 4 ("A família da tela e o componente do kit") e 7 ("CSS"). Elas valem para qualquer produto.

## Consumir

```ts
import { configurarKit, PaginaInteira, ListView } from "@cert4all/ui/kit";
import "@cert4all/ui/kit.css";
```

- **Texto**: o kit chama `t(textoEmPortugues, { valores })`. Sem configuração ele fala português e formata número em
  pt-BR. Um produto com idiomas injeta o próprio `t()` uma vez, na entrada:
  `configurarKit({ t, locale: localeAtual })`.
- **Raiz**: tudo vive dentro de um elemento `.v2`, a camada fixa do tamanho da janela de `base.css`. O conteúdo vai em
  `.v2-conteudo`, e a tela é uma `PaginaInteira`. A moldura (cabeçalho, módulos, busca, avatar) é de cada produto.
- **Tokens**: `--v2-*` em `base.css`. O produto troca os que quiser na própria raiz (`.v2 { --v2-acento: … }`). A
  fonte (IBM Plex) também é do produto.
- **Dependências**: `react`, `react-dom` e `lucide-react` vêm do produto.

## Mudar o kit

Rode `npm test` aqui. O kit é usado pelo Stonen e pelo Cert4All: depois de mudar, rode a trava "a tela não rola" dos
dois produtos antes de atualizar o `@cert4all/ui` neles.

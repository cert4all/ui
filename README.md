# @cert4all/ui

Componentes React compartilhados do portfólio Cert4All — hoje só o "shell"
visual da tela de login (cartão com identidade de marca: barra de cor,
logo/iniciais, título, tagline, rodapé). Extraído do `TenantLogin.tsx` do
Cert4all em 2026-07-26.

## O que este pacote NÃO é

Não inclui `Input`/`Button`/campos de formulário — cada produto usa os seus
(Cert4all/Togue/Huga usam shadcn/ui, Stonen não usa shadcn nenhum). O
formulário em si (campos, botões de SSO, botão de submit) é passado como
`children` — inteira responsabilidade do produto.

Não busca dados (branding do tenant, sessão, etc.) — isso é responsabilidade
do produto. O componente é só apresentacional.

Não inclui as telas de "carregando" ou "tenant suspenso/não encontrado" —
essas não carregam identidade de marca de tenant nenhuma, cada produto
mantém essa marcação localmente (usando `AuthPageBackground` só para o
fundo, se quiser consistência de página).

## Como consumir

Mesmo mecanismo do `@cert4all/design-tokens` (git dependency, sem registro
— por ora, mesmo motivo: sem configurar auth de registro privado sob prazo
apertado):

```bash
npm install github:cert4all/ui
```

No CSS de entrada do produto, **depois** de `@cert4all/design-tokens/tokens.css`:

```css
@import "@cert4all/design-tokens/tokens.css";
@import "@cert4all/ui/shell.css";
@import "tailwindcss"; /* se o produto usar Tailwind */
```

No componente de login:

```tsx
import { AuthPageBackground, TenantAuthCard } from "@cert4all/ui";

<AuthPageBackground>
  <TenantAuthCard
    companyName={tenant.companyName}
    logoUrl={tenant.logoUrl}
    tagline={tenant.tagline}
    primaryColor={tenant.primaryColor ?? "#2F3437"}
    error={error}
    footer={supportBlock}
    pageFooter={<p>© {year} {tenant.companyName}</p>}
  >
    {/* formulário próprio do produto */}
  </TenantAuthCard>
</AuthPageBackground>
```

Sem etapa de build — enviado como código-fonte `.tsx`/`.css` puro, igual ao
`design-tokens`. Funciona porque todo consumidor atual roda Vite + TypeScript.

## Por que não dentro do `design-tokens`

O `design-tokens` tem um não-objetivo explícito registrado no próprio
README dele ("não é biblioteca de componentes React"), decidido de propósito
pra continuar consumível por qualquer stack sem herdar React como
dependência. Este pacote é uma camada separada por cima, para os produtos
que efetivamente compartilham React + a mesma estrutura de tela.

## Nota técnica: `react` como devDependency

`react`/`@types/react` estão em `devDependencies` (não `dependencies`) só
para o TypeScript conseguir resolver os tipos ao desenvolver este pacote
isoladamente ou ao consumi-lo localmente via `file:` (que gera symlink —
a resolução de módulos segue o caminho real, fora do `node_modules` do
consumidor). Por serem `devDependencies`, nenhum consumidor real (via git
dependency, sem symlink) instala uma cópia própria de `react` — a
resolução cai naturalmente no `react` do próprio produto consumidor, sem
risco de duas cópias de React coexistindo.

## Dois layouts, e o produto escolhe

O pacote expõe **duas** telas de entrada. Elas não se substituem — coexistem, e
trocar de uma para a outra é trocar o `import`.

| | `TenantAuthCard` | `TenantAuthSplit` |
|---|---|---|
| Forma | cartão de 28rem centrado | metade marca, metade formulário |
| Marca do tenant | barra de 8px no topo | meio ecrã, gradiente da cor dela |
| Precisa de `AuthPageBackground` | sim, por fora | não, ele já é a página |

`TenantAuthSplit` foi acrescentado em 2026-09-17 (primeiro consumidor: Cert4all).
`TenantAuthCard` **não** mudou nessa data — Togue, Huga e Stonen continuam com a
aparência que tinham.

### ⚠️ A tinta do painel é medida, não escolhida

A cor primária vem do cadastro e é a EMPRESA que a escolhe. Ela pode ser clara.
`TenantAuthSplit` calcula a tinta (`readableInkOn`, exportada) pela razão de
contraste da WCAG e usa a de maior contraste — branco `#FFFFFF` ou petróleo
`#10222A`.

Consequência para quem consome: **não pinte texto seu de branco fixo sobre a cor
do tenant**. Use `readableInkOn(cor)`. O botão de submit do Cert4all dava 1,7:1
num tenant de marca amarela exatamente por isso.

O gradiente do painel também se afasta da tinta, nunca em direção a ela — um
gradiente que sempre escurece parece seguro e não é: com tinta escura, escurecer
o pé do painel derruba o contraste onde fica o bloco de suporte.

Cobertura: `server/tests/login-do-cliente-contraste.test.ts`, no repositório do
Cert4all — inclui o controle positivo (reprova a implementação de branco fixo).

```tsx
import { TenantAuthSplit, readableInkOn } from "@cert4all/ui";

<TenantAuthSplit
  companyName={tenant.companyName}
  logoUrl={tenant.logoUrl}
  tagline={tenant.tagline}
  primaryColor={tenant.primaryColor}
  formEyebrow="Bem-vindo de volta"
  formTitle="Acessar o portal"
  error={error}
  asideFooter={blocoDeSuporte}
  pageFooter={<p>© {year} {tenant.companyName}</p>}
>
  {/* formulário próprio do produto */}
</TenantAuthSplit>
```

## Consumidores atuais

- **Cert4all** — `github:cert4all/ui`. `TenantAuthSplit` em
  `client/src/pages/TenantLogin.tsx` desde 2026-09-17.
- **Togue, Huga, Stonen (`apps/web`)** — `TenantAuthCard`, sem alteração.

⚠️ O `package.json` do Cert4all aponta para `github:cert4all/ui` **sem ref**, ou
seja, para o default branch. Mudança aqui chega nos outros produtos no `npm
install` seguinte deles — por isso o layout novo é componente NOVO, e não uma
troca de aparência do `TenantAuthCard`.

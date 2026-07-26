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

## Consumidores atuais

- (nenhum ainda — pacote em criação, 2026-07-26)

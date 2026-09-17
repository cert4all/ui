import type { CSSProperties, ReactNode } from "react";

export interface TenantAuthSplitProps {
  /** Nome da empresa exibido no painel de marca. */
  companyName: string;
  /** O logo do tenant para superfície CLARA — é o que o resto do app usa. */
  logoUrl?: string | null;
  /**
   * A variante do logo para superfície ESCURA. Usada quando o painel fica escuro, que é
   * decidido pela medida de contraste, não por configuração.
   *
   * ⚠️ O nome é `logoOnDark`, e não `darkLogo`, de propósito: "dark logo" pode ser lido como
   * "o logo de cor escura" — exatamente a ambiguidade que deixou o campo equivalente do banco
   * (`darkLogoUrl`) parado sem ninguém o desenhar. Aqui o nome diz ONDE ele vai.
   *
   * Ausente: cai em `logoUrl`. Um tenant com um logo só continua funcionando como antes.
   */
  logoOnDarkUrl?: string | null;
  tagline?: string | null;
  /** Cor de marca do tenant — origem do gradiente do painel. Cada produto define seu fallback. */
  primaryColor?: string | null;
  /** Alerta de erro padronizado, renderizado acima de `children`. */
  error?: ReactNode | null;
  /** Título do lado do formulário. */
  formTitle?: string;
  /** Linha acima do título (ex.: "Bem-vindo de volta"). */
  formEyebrow?: string;
  /** Bloco ao pé do painel de marca (ex.: contato de suporte). */
  asideFooter?: ReactNode;
  /** Linha ao pé do lado do formulário (ex.: copyright). */
  pageFooter?: ReactNode;
  /** Formulário/botões — inteiramente responsabilidade do produto (campos, SSO, submit). */
  children: ReactNode;
}

const FALLBACK_BRAND = "#16333C";

/** Tinta clara e tinta escura do painel. A escolha entre elas é medida, não fixada. */
const INK_LIGHT = "#FFFFFF";
const INK_DARK = "#10222A";

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

/** #abc | #aabbcc -> [r, g, b] em 0–255. `null` quando a string não é um hex reconhecível. */
function parseHex(value: string): [number, number, number] | null {
  const hex = value.trim().replace(/^#/, "");

  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16),
    ];
  }

  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  return null;
}

/** Luminância relativa WCAG 2.x. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (raw: number) => {
    const c = raw / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Tinta legível sobre a cor de marca do tenant.
 *
 * A cor primária é escolhida pelo cliente no cadastro e pode ser clara — amarelo, lima, areia.
 * Fixar branco ali produziria texto ilegível para esses tenants, e o defeito só apareceria no
 * dia em que um deles entrasse. Então a tinta é a que tem MAIOR razão de contraste medida, e
 * não a que costuma dar certo.
 */
export function readableInkOn(color: string | null | undefined): string {
  const rgb = parseHex(color || "");
  if (!rgb) return INK_LIGHT;

  const surface = relativeLuminance(rgb);
  const onLight = contrastRatio(surface, relativeLuminance(parseHex(INK_LIGHT)!));
  const onDark = contrastRatio(surface, relativeLuminance(parseHex(INK_DARK)!));

  return onDark > onLight ? INK_DARK : INK_LIGHT;
}

export function TenantAuthSplit({
  companyName,
  logoUrl,
  logoOnDarkUrl,
  tagline,
  primaryColor,
  error,
  formTitle = "Entrar",
  formEyebrow,
  asideFooter,
  pageFooter,
  children,
}: TenantAuthSplitProps) {
  const brand = primaryColor || FALLBACK_BRAND;
  const ink = readableInkOn(brand);

  // Direção em que o gradiente se afasta da tinta. Um gradiente que escurece sempre parece
  // seguro e não é: com tinta ESCURA (tenant de marca clara), escurecer o pé do painel derruba
  // o contraste justamente onde fica o bloco de suporte. Então o painel se afasta da tinta,
  // qualquer que seja ela, e o contraste só cresce do topo para o pé.
  const away = ink === INK_LIGHT ? INK_DARK : INK_LIGHT;

  // O logo segue a MESMA medida que a tinta, não uma configuração à parte: se o texto precisa
  // ser branco, o painel é escuro, e é ali que a variante de fundo escuro serve. Duas decisões
  // sobre a mesma superfície, tomadas pelo mesmo número, não podem divergir.
  const logoDoPainel = (ink === INK_LIGHT ? logoOnDarkUrl || logoUrl : logoUrl) || null;

  // As variáveis descem por style inline porque a cor nasce do banco, por tenant — não há
  // folha de estilo capaz de conhecê-la de antemão. O CSS as consome com color-mix().
  const asideVars = {
    ["--c4a-brand" as string]: brand,
    ["--c4a-ink" as string]: ink,
    ["--c4a-away" as string]: away,
  } as CSSProperties;

  return (
    <div className="c4a-auth-split">
      <aside className="c4a-auth-split__brand" style={asideVars}>
        <div className="c4a-auth-split__brand-inner">
          <div className="c4a-auth-split__lockup">
            {logoDoPainel ? (
              <img src={logoDoPainel} alt={companyName} className="c4a-auth-split__logo" />
            ) : (
              <div className="c4a-auth-split__avatar">{initials(companyName)}</div>
            )}
            <div>
              <h1 className="c4a-auth-split__company">{companyName}</h1>
              {tagline && <p className="c4a-auth-split__tagline">{tagline}</p>}
            </div>
          </div>

          {asideFooter && <div className="c4a-auth-split__aside-footer">{asideFooter}</div>}
        </div>
      </aside>

      <main className="c4a-auth-split__form">
        <div className="c4a-auth-split__form-inner">
          {formEyebrow && <p className="c4a-auth-split__eyebrow">{formEyebrow}</p>}
          <h2 className="c4a-auth-split__title">{formTitle}</h2>

          {error && (
            <div className="c4a-auth-split__error" role="alert">
              {error}
            </div>
          )}

          <div className="c4a-auth-split__body">{children}</div>

          {pageFooter && <div className="c4a-auth-split__page-footer">{pageFooter}</div>}
        </div>
      </main>
    </div>
  );
}

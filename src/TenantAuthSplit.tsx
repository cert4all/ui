import type { CSSProperties, ReactNode } from "react";

/**
 * A assinatura do dono da plataforma.
 *
 * `product` é opcional de propósito: quando o painel já mostra o nome do produto em tamanho
 * grande — que é o caso do Stonen e do Hugi — repeti-lo aqui embaixo é redundância, e a
 * assinatura fica só com o lado que falta ("uma plataforma Cert4All").
 */
export interface OwnerSignature {
  /** Nome de quem opera. Ex.: "Cert4All". */
  owner: string;
  /** Texto que liga o produto ao dono. Ex.: "uma plataforma", "by". */
  lead?: string;
  /** Nome do produto, quando a assinatura nomeia os dois lados ("Stonen by Cert4All"). */
  product?: string;
  /** Destino do link. Ausente: a assinatura não é clicável. */
  href?: string;
  /**
   * O endereço, escrito por extenso numa segunda linha (ex.: "cert4all.com.br").
   *
   * ⚠️ É TEXTO, e não é derivado de `href`. Derivar pareceria esperto e seria pior: o dia em que o
   * link virasse `cert4all.com.br/parceiros?ref=stonen`, a linha visível passaria a exibir isso.
   * Quem escreve o endereço decide o que o cliente lê.
   */
  site?: string;
}

/**
 * A marca do Cert4All — o numeral 4 como grafo, com o núcleo no cruzamento dos traços.
 *
 * ⚠️ Os traços são `currentColor`, e a telha petróleo do favicon NÃO vem junto. É o mesmo
 * princípio do resto do componente: a assinatura pousa sobre a cor de marca do TENANT, que pode
 * ser clara ou escura, e uma telha de cor fixa some numa das duas. Herdando a cor, ela usa a
 * tinta que já foi MEDIDA para aquele painel.
 *
 * O núcleo fica menta (`#4FE3C1`) porque é a única cor própria da marca e o que a distingue de um
 * "4" qualquer. É um ponto de 5px, decorativo — não carrega informação que o contraste precise
 * garantir.
 */
export function Cert4AllMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M30 9 L13 29 M13 29 H39 M30 9 V41"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="9" r="4" fill="currentColor" />
      <circle cx="13" cy="29" r="4" fill="currentColor" />
      <circle cx="39" cy="29" r="4" fill="currentColor" />
      <circle cx="30" cy="41" r="4" fill="currentColor" />
      <circle cx="30" cy="29" r="5.6" fill="#4FE3C1" />
    </svg>
  );
}

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
  /**
   * Assinatura de quem OPERA a plataforma, no rodapé do painel de marca.
   *
   * Existe porque o painel mostra a marca do produto (Stonen, Hugi) e nada dizia de quem ele é.
   * Não é `asideFooter`: aquele é um bloco de conteúdo do produto, e este é uma linha de
   * procedência que precisa ser IGUAL nos três produtos. Prop, e não composição livre, para que
   * nenhum deles invente a sua e elas divirjam.
   *
   * ⚠️ O Cert4All NÃO a passa. "Cert4All, uma plataforma Cert4All" é ruído, e suprimir por prop
   * ausente é mais honesto que o componente adivinhar comparando strings de nome.
   */
  ownerSignature?: OwnerSignature;
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

/**
 * #abc | #aabbcc -> [r, g, b] em 0–255. `null` quando a string não é um hex reconhecível.
 *
 * ⚠️ A forma curta é EXPANDIDA para seis antes de qualquer leitura, e a leitura é por
 * `slice`, nunca por índice. O motivo é de compilação, não de estilo: o consumidor mais
 * estrito deste pacote (o Stonen) usa `noUncheckedIndexedAccess`, onde `hex[0]` é
 * `string | undefined` e a versão indexada **não compila**. Um pacote compartilhado precisa
 * compilar sob o mais estrito dos consumidores — o Cert4All sozinho não pegava isto.
 */
function parseHex(value: string): [number, number, number] | null {
  const hex = value.trim().replace(/^#/, "");
  const largo = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;

  if (!/^[0-9a-f]{6}$/i.test(largo)) return null;

  return [
    parseInt(largo.slice(0, 2), 16),
    parseInt(largo.slice(2, 4), 16),
    parseInt(largo.slice(4, 6), 16),
  ];
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


/**
 * ⚠️ Esta linha É PINADA no pé, e o bloco de apoio (`asideFooter`) NÃO é — a diferença não é
 * inconsistência.
 *
 * O `asideFooter` é conteúdo (contato de suporte): pinado, ele deixava o símbolo sozinho no meio
 * e o texto sozinho embaixo, dois órfãos em vez de um bloco. A assinatura é de outra classe de
 * peso — é colofão, e o pé é o lugar dela em qualquer impresso. Uma linha de 0.75rem na borda não
 * lê como órfã; lê como rodapé, que é o que ela é.
 *
 * ⚠️ E ela tem TEXTO ao lado do símbolo, de propósito. A regra que o owner fixou em 18/09 sobre o
 * lockup vale aqui: símbolo sozinho encostado numa borda não é composição.
 */
function OwnerLine({ signature }: { signature: OwnerSignature }) {
  const { owner, lead, product, href, site } = signature;

  const conteudo = (
    <>
      <span className="c4a-auth-split__owner-line">
        {product && <span className="c4a-auth-split__owner-product">{product}</span>}
        {lead && <span className="c4a-auth-split__owner-lead">{lead}</span>}
        <Cert4AllMark />
        <span className="c4a-auth-split__owner-name">{owner}</span>
      </span>
      {site && <span className="c4a-auth-split__owner-site">{site}</span>}
    </>
  );

  if (!href) {
    return <p className="c4a-auth-split__owner">{conteudo}</p>;
  }

  // `rel="noreferrer"` junto com `noopener`: a tela de entrada de um cliente não precisa contar ao
  // site do Cert4All de qual tenant o visitante veio.
  return (
    <p className="c4a-auth-split__owner">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {conteudo}
      </a>
    </p>
  );
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
  ownerSignature,
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

        {ownerSignature && <OwnerLine signature={ownerSignature} />}
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

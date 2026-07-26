import type { ReactNode } from "react";

export interface TenantAuthCardProps {
  /** Nome do módulo/empresa exibido no cabeçalho do cartão. */
  companyName: string;
  logoUrl?: string | null;
  tagline?: string | null;
  /** Cor de destaque (barra superior + avatar de iniciais). Cada produto/tenant define seu próprio fallback. */
  primaryColor?: string | null;
  /** Alerta de erro padronizado, renderizado acima de `children`. */
  error?: ReactNode | null;
  /** Bloco opcional abaixo de `children` (ex.: contato de suporte), com divisória própria. */
  footer?: ReactNode;
  /** Linha opcional renderizada fora do cartão (ex.: copyright). */
  pageFooter?: ReactNode;
  cardClassName?: string;
  /** Formulário/botões — inteiramente responsabilidade do produto (campos, SSO, submit). */
  children: ReactNode;
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function TenantAuthCard({
  companyName,
  logoUrl,
  tagline,
  primaryColor,
  error,
  footer,
  pageFooter,
  cardClassName,
  children,
}: TenantAuthCardProps) {
  const accentStyle = primaryColor ? { backgroundColor: primaryColor } : undefined;

  return (
    <>
      <div className={`c4a-auth-card ${cardClassName ?? ""}`}>
        <div className="c4a-auth-card__bar" style={accentStyle} />

        <div className="c4a-auth-card__header">
          <div className="c4a-auth-card__logo-slot">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="c4a-auth-card__logo" />
            ) : (
              <div className="c4a-auth-card__avatar" style={accentStyle}>
                {initials(companyName)}
              </div>
            )}
          </div>
          <h1 className="c4a-auth-card__title">{companyName}</h1>
          {tagline && <p className="c4a-auth-card__tagline">{tagline}</p>}
        </div>

        <div className="c4a-auth-card__body">
          {error && (
            <div className="c4a-auth-card__error" role="alert">
              {error}
            </div>
          )}
          {children}
        </div>

        {footer && <div className="c4a-auth-card__footer">{footer}</div>}
      </div>

      {pageFooter && <div className="c4a-auth-page__footer">{pageFooter}</div>}
    </>
  );
}

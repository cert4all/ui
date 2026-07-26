import type { ReactNode } from "react";

export function AuthPageBackground({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`c4a-auth-page ${className ?? ""}`}>{children}</div>;
}

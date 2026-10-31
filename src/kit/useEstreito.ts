import { useEffect, useState } from "react";

/** A tela e de celular (um cartao por vez, ate 900 px — o mesmo corte do kit)? */
export function useEstreito(): boolean {
  const consulta = "(max-width: 900px)";
  const ler = () => (typeof window.matchMedia === "function" ? window.matchMedia(consulta).matches : false);
  const [estreito, setEstreito] = useState(ler);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(consulta);
    const mudar = () => setEstreito(mq.matches);
    mq.addEventListener?.("change", mudar);
    return () => mq.removeEventListener?.("change", mudar);
  }, []);
  return estreito;
}

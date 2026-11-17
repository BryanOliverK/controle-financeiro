// Contas das animações (separadas do React para poderem ser testadas).

// Começa rápido e vai freando no fim (0 → 1)
export function suavizar(t) {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0))
  return 1 - Math.pow(1 - x, 3)
}

// Valor entre "de" e "alvo" no ponto t (0 a 1). Em t = 1 devolve exatamente o alvo.
export function interpolar(de, alvo, t) {
  if (t >= 1) {
    return alvo
  }

  return de + (alvo - de) * suavizar(t)
}

// O aparelho pediu para reduzir movimento? (começa com o modo leve ligado nesse caso)
export function preferePoucoMovimento() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  } catch {
    return false
  }
}

// Comparação entre meses (gráfico de barras e variação).

import { calcularResumo } from "./calculos"
import { chaveMes } from "./formatar"

// Chaves "AAAA-MM" dos últimos n meses, do mais antigo ao atual
export function ultimosMeses(n, hoje = new Date()) {
  const chaves = []

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    chaves.push(chaveMes(d))
  }

  return chaves
}

export function resumoPorMes(transacoes, n = 6, hoje = new Date()) {
  const grupos = {}

  for (const t of transacoes) {
    const chave = chaveMes(t.data)
    ;(grupos[chave] ||= []).push(t)
  }

  return ultimosMeses(n, hoje).map((chave) => {
    const { entradas, saidas } = calcularResumo(grupos[chave] || [])
    return { chave, entradas, saidas }
  })
}

// Variação percentual; null quando não há base de comparação
export function variacao(atual, anterior) {
  if (!anterior) {
    return null
  }

  return ((atual - anterior) / anterior) * 100
}

// "2026-11" -> "nov"
export function rotuloMesCurto(chave) {
  const [ano, mes] = chave.split("-").map(Number)

  return new Date(ano, mes - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
}

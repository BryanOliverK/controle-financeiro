// Meta geral de gastos do mês (um limite só, somando todas as categorias).
// Fica ao lado dos orçamentos por categoria: 0 = sem meta.

import { arredondar, chaveMes } from "./formatar"
import { statusOrcamento } from "./orcamentos"

export const META_MAXIMA = 1000000000

// Aceita só número positivo (vale também para nuvem e backup)
export function limparMeta(bruto) {
  const n = Number(bruto)

  return Number.isFinite(n) && n > 0 && n <= META_MAXIMA ? arredondar(n) : 0
}

// Tudo que saiu no mês ("AAAA-MM"). Guardar em caixinha não é gasto.
export function gastoDoMes(transacoes, mes) {
  let centavos = 0

  for (const t of transacoes) {
    if (t.tipo === "saida" && t.categoria !== "caixinha" && chaveMes(t.data) === mes) {
      centavos += Math.round(t.valor * 100)
    }
  }

  return centavos / 100
}

// Mesmo formato do orçamento por categoria: { nivel, porcentagem, restante } ou null
export function statusMeta(gasto, meta) {
  return statusOrcamento(gasto, meta)
}

// Aviso depois de lançar uma saída: só quando CRUZA 80% ou 100% da meta
export function mensagemAlertaMeta(gastoAntes, gastoDepois, meta) {
  const antes = statusMeta(gastoAntes, meta)
  const depois = statusMeta(gastoDepois, meta)

  if (!depois || depois.nivel === "ok" || antes?.nivel === depois.nivel) {
    return null
  }

  return depois.nivel === "estourado"
    ? "Meta de gastos do mês estourada"
    : `Você já usou ${Math.floor(depois.porcentagem)}% da meta de gastos do mês`
}

// Sugestão de meta: média do que você gastou nos últimos meses fechados (até 3,
// só os que tiveram gasto), arredondada para cima de 10 em 10. null se não há histórico.
export function sugerirMeta(transacoes, hoje = new Date()) {
  const atual = chaveMes(hoje)
  const totais = new Map()

  for (const t of transacoes) {
    if (t.tipo !== "saida" || t.categoria === "caixinha") continue

    const mes = chaveMes(t.data)

    if (mes < atual) {
      totais.set(mes, (totais.get(mes) || 0) + Math.round(t.valor * 100))
    }
  }

  const recentes = [...totais.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 3)

  if (recentes.length === 0) {
    return null
  }

  const mediaCentavos = recentes.reduce((s, [, c]) => s + c, 0) / recentes.length

  return Math.ceil(mediaCentavos / 100 / 10) * 10
}

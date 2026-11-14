// Orçamento mensal por categoria: { alimentacao: 800, lazer: 200 }

import { arredondar, chaveMes } from "./formatar"
import { nomeCategoria } from "./categorias"

// A partir de 80% do limite o app avisa
export const LIMITE_ALERTA = 0.8

// Quanto foi gasto (só saídas) na categoria naquele mês ("AAAA-MM")
export function gastoDaCategoria(transacoes, categoria, mes) {
  let centavos = 0

  for (const t of transacoes) {
    if (t.tipo === "saida" && t.categoria === categoria && chaveMes(t.data) === mes) {
      centavos += Math.round(t.valor * 100)
    }
  }

  return centavos / 100
}

// nivel: "ok" | "alerta" (80% ou mais) | "estourado" (passou do limite)
export function statusOrcamento(gasto, limite) {
  if (!(limite > 0)) {
    return null
  }

  const nivel =
    gasto > limite ? "estourado" : gasto >= limite * LIMITE_ALERTA ? "alerta" : "ok"

  return {
    nivel,
    porcentagem: (gasto / limite) * 100,
    restante: arredondar(limite - gasto)
  }
}

// Texto do aviso depois de lançar uma saída, ou null se não há o que avisar.
// Só avisa quando o gasto CRUZA uma faixa (80% ou 100%), para não repetir.
export function mensagemAlerta(categoria, gastoAntes, gastoDepois, limite) {
  const antes = statusOrcamento(gastoAntes, limite)
  const depois = statusOrcamento(gastoDepois, limite)

  if (!depois || depois.nivel === "ok" || antes?.nivel === depois.nivel) {
    return null
  }

  const nome = nomeCategoria(categoria)

  return depois.nivel === "estourado"
    ? `Orçamento de ${nome} estourado`
    : `${nome}: você já usou ${Math.floor(depois.porcentagem)}% do orçamento`
}

// Aceita só números positivos de categorias; o resto é ignorado
export function limparOrcamentos(bruto) {
  const limpo = {}

  if (!bruto || typeof bruto !== "object") {
    return limpo
  }

  for (const [categoria, valor] of Object.entries(bruto)) {
    const numero = Number(valor)

    if (Number.isFinite(numero) && numero > 0) {
      limpo[categoria] = arredondar(numero)
    }
  }

  return limpo
}

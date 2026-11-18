// Resumo do ano: mês a mês e totais. Tudo em centavos por dentro.
// Guardar/retirar de caixinha não conta como entrada nem saída.

import { chaveMes } from "./formatar"

const centavos = (v) => Math.round(v * 100)
const reais = (c) => c / 100

const contaNoAno = (t, ano) => chaveMes(t.data).startsWith(`${ano}-`)

// Anos que têm transações, do mais novo para o mais antigo
export function anosDisponiveis(transacoes) {
  return [...new Set(transacoes.map((t) => Number(chaveMes(t.data).slice(0, 4))))]
    .filter((a) => Number.isInteger(a))
    .sort((a, b) => b - a)
}

export function resumoDoAno(transacoes, ano) {
  const meses = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, entradas: 0, saidas: 0 }))
  const porCategoria = {}

  for (const t of transacoes) {
    if (t.categoria === "caixinha" || !contaNoAno(t, ano)) continue

    const m = meses[Number(chaveMes(t.data).slice(5, 7)) - 1]
    const c = centavos(t.valor)

    if (t.tipo === "entrada") {
      m.entradas += c
    } else if (t.tipo === "saida") {
      m.saidas += c
      const chave = t.categoria || "sem-categoria"
      porCategoria[chave] = (porCategoria[chave] || 0) + c
    }
  }

  const totalEntradas = meses.reduce((s, m) => s + m.entradas, 0)
  const totalSaidas = meses.reduce((s, m) => s + m.saidas, 0)
  const comMovimento = meses.filter((m) => m.entradas > 0 || m.saidas > 0).length

  const maior = meses.reduce((a, m) => (m.saidas > (a?.saidas ?? 0) ? m : a), null)

  const topCategorias = Object.entries(porCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([categoria, c]) => ({
      categoria,
      valor: reais(c),
      porcentagem: totalSaidas > 0 ? (c / totalSaidas) * 100 : 0
    }))

  return {
    ano,
    meses: meses.map((m) => ({
      mes: m.mes,
      entradas: reais(m.entradas),
      saidas: reais(m.saidas),
      saldo: reais(m.entradas - m.saidas)
    })),
    totais: {
      entradas: reais(totalEntradas),
      saidas: reais(totalSaidas),
      saldo: reais(totalEntradas - totalSaidas)
    },
    mesesComMovimento: comMovimento,
    mediaSaidas: comMovimento > 0 ? reais(Math.round(totalSaidas / comMovimento)) : 0,
    maiorGasto: maior ? { mes: maior.mes, valor: reais(maior.saidas) } : null,
    taxaPoupanca: totalEntradas > 0 ? ((totalEntradas - totalSaidas) / totalEntradas) * 100 : null,
    topCategorias
  }
}

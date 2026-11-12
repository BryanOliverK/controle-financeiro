import { chaveMes, rotuloData } from "./formatar"

// Somas feitas em centavos (inteiros) para não acumular erro de arredondamento.

const emCentavos = (valor) => Math.round(valor * 100)

export function listarMeses(transacoes) {
  return [...new Set(transacoes.map((t) => chaveMes(t.data)))]
    .sort()
    .reverse()
}

export function calcularResumo(transacoes) {
  let entradas = 0
  let saidas = 0
  let guardado = 0

  for (const t of transacoes) {
    const centavos = emCentavos(t.valor)

    if (t.categoria === "caixinha") {
      // Guardar tira do saldo; retirar devolve
      guardado += t.tipo === "saida" ? centavos : -centavos
    } else if (t.tipo === "entrada") {
      entradas += centavos
    } else if (t.tipo === "saida") {
      saidas += centavos
    }
  }

  return {
    entradas: entradas / 100,
    saidas: saidas / 100,
    saldo: (entradas - saidas - guardado) / 100
  }
}

export function gastosPorCategoria(transacoes) {
  const centavos = {}

  for (const t of transacoes) {
    if (t.tipo === "saida" && t.categoria !== "caixinha") {
      const chave = t.categoria || "sem-categoria"
      centavos[chave] = (centavos[chave] || 0) + emCentavos(t.valor)
    }
  }

  const gastos = {}
  let total = 0

  for (const [chave, valor] of Object.entries(centavos)) {
    gastos[chave] = valor / 100
    total += valor
  }

  return { gastos, totalGastos: total / 100 }
}

export function filtrar(transacoes, { busca, filtroTipo }) {
  const termo = busca.toLowerCase().trim()

  return transacoes.filter((t) =>
    t.descricao.toLowerCase().includes(termo) &&
    (filtroTipo === "todos" || t.tipo === filtroTipo)
  )
}

// Ordena pela data da transação. Se a data for igual, vale a ordem em que
// foram adicionadas (a lista já chega nessa ordem).
export function ordenar(transacoes, ordenacao) {
  const itens = transacoes.map((t, i) => ({
    t,
    i,
    ms: new Date(t.data).getTime()
  }))

  itens.sort((a, b) => {
    if (ordenacao === "antigas") {
      return (a.ms - b.ms) || (a.i - b.i)
    }

    if (ordenacao === "maiorValor") {
      return b.t.valor - a.t.valor
    }

    if (ordenacao === "menorValor") {
      return a.t.valor - b.t.valor
    }

    return (b.ms - a.ms) || (b.i - a.i)
  })

  return itens.map((item) => item.t)
}

// [["HOJE", [...]], ["ONTEM", [...]]] na ordem em que aparecem
export function agruparPorData(transacoes) {
  const grupos = new Map()

  for (const t of transacoes) {
    const rotulo = rotuloData(t.data)

    if (!grupos.has(rotulo)) {
      grupos.set(rotulo, [])
    }

    grupos.get(rotulo).push(t)
  }

  return [...grupos.entries()]
}

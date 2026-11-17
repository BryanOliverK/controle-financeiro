import { describe, it, expect } from "vitest"
import {
  agruparPorData, calcularResumo, filtrar, gastosPorCategoria, listarMeses, ordenar, saldoDoDia
} from "./calculos"

const t = (id, tipo, valor, extra = {}) => ({
  id, tipo, valor, descricao: `t${id}`, categoria: "casa",
  data: new Date(2026, 10, 10, 12).toISOString(), ...extra
})

describe("calcularResumo", () => {
  it("soma entradas, saídas e calcula o saldo", () => {
    const r = calcularResumo([t(1, "entrada", 1000), t(2, "saida", 250.5)])
    expect(r).toEqual({ entradas: 1000, saidas: 250.5, saldo: 749.5 })
  })

  it("não acumula erro de centavos", () => {
    const r = calcularResumo([t(1, "saida", 0.1), t(2, "saida", 0.2)])
    expect(r.saidas).toBe(0.3)
  })

  it("guardar na caixinha tira do saldo e retirar devolve", () => {
    const guardar = calcularResumo([t(1, "entrada", 500), t(2, "saida", 100, { categoria: "caixinha" })])
    expect(guardar.saldo).toBe(400)
    expect(guardar.saidas).toBe(0)

    const retirar = calcularResumo([
      t(1, "entrada", 500),
      t(2, "saida", 100, { categoria: "caixinha" }),
      t(3, "entrada", 100, { categoria: "caixinha" })
    ])
    expect(retirar.saldo).toBe(500)
    expect(retirar.entradas).toBe(500)
  })

  it("lista vazia dá zero", () => {
    expect(calcularResumo([])).toEqual({ entradas: 0, saidas: 0, saldo: 0 })
  })
})

describe("gastosPorCategoria", () => {
  it("soma só saídas e ignora caixinha", () => {
    const r = gastosPorCategoria([
      t(1, "saida", 10, { categoria: "casa" }),
      t(2, "saida", 5.5, { categoria: "casa" }),
      t(3, "saida", 7, { categoria: "lazer" }),
      t(4, "entrada", 999, { categoria: "salario" }),
      t(5, "saida", 100, { categoria: "caixinha" })
    ])
    expect(r.gastos).toEqual({ casa: 15.5, lazer: 7 })
    expect(r.totalGastos).toBe(22.5)
  })

  it("junta o que não tem categoria", () => {
    const r = gastosPorCategoria([t(1, "saida", 3, { categoria: "" })])
    expect(r.gastos["sem-categoria"]).toBe(3)
  })
})

describe("filtrar", () => {
  const lista = [t(1, "entrada", 10, { descricao: "Salário" }), t(2, "saida", 5, { descricao: "Mercado" })]

  it("busca ignorando maiúsculas e espaços", () => {
    expect(filtrar(lista, { busca: "  mer ", filtroTipo: "todos" }).map((x) => x.id)).toEqual([2])
  })

  it("filtra por tipo", () => {
    expect(filtrar(lista, { busca: "", filtroTipo: "entrada" }).map((x) => x.id)).toEqual([1])
  })
})

describe("ordenar", () => {
  const lista = [
    t(1, "saida", 30, { data: new Date(2026, 10, 1, 12).toISOString() }),
    t(2, "saida", 10, { data: new Date(2026, 10, 3, 12).toISOString() }),
    t(3, "saida", 20, { data: new Date(2026, 10, 2, 12).toISOString() })
  ]

  it("mais recentes e mais antigas", () => {
    expect(ordenar(lista, "recentes").map((x) => x.id)).toEqual([2, 3, 1])
    expect(ordenar(lista, "antigas").map((x) => x.id)).toEqual([1, 3, 2])
  })

  it("por valor", () => {
    expect(ordenar(lista, "maiorValor").map((x) => x.id)).toEqual([1, 3, 2])
    expect(ordenar(lista, "menorValor").map((x) => x.id)).toEqual([2, 3, 1])
  })

  it("no mesmo dia vale a ordem em que foram adicionadas", () => {
    const mesmo = new Date(2026, 10, 1, 12).toISOString()
    const dois = [t(1, "saida", 1, { data: mesmo }), t(2, "saida", 1, { data: mesmo })]
    expect(ordenar(dois, "recentes").map((x) => x.id)).toEqual([2, 1])
    expect(ordenar(dois, "antigas").map((x) => x.id)).toEqual([1, 2])
  })

  it("não altera a lista original", () => {
    const copia = [...lista]
    ordenar(lista, "maiorValor")
    expect(lista).toEqual(copia)
  })
})

describe("listarMeses e agruparPorData", () => {
  it("meses únicos, do mais novo para o mais antigo", () => {
    const meses = listarMeses([
      t(1, "saida", 1, { data: new Date(2026, 8, 1).toISOString() }),
      t(2, "saida", 1, { data: new Date(2026, 10, 1).toISOString() }),
      t(3, "saida", 1, { data: new Date(2026, 10, 20).toISOString() })
    ])
    expect(meses).toEqual(["2026-11", "2026-09"])
  })

  it("agrupa pelo rótulo do dia", () => {
    const hoje = new Date().toISOString()
    const grupos = agruparPorData([t(1, "saida", 1, { data: hoje }), t(2, "saida", 2, { data: hoje })])
    expect(grupos).toHaveLength(1)
    expect(grupos[0][0]).toBe("HOJE")
    expect(grupos[0][1]).toHaveLength(2)
  })
})

describe("saldoDoDia", () => {
  it("soma entradas e subtrai saídas sem erro de centavos", () => {
    expect(saldoDoDia([t(1, "entrada", 100), t(2, "saida", 0.1), t(3, "saida", 0.2)])).toBe(99.7)
  })

  it("ignora caixinha e lista vazia", () => {
    expect(saldoDoDia([t(1, "saida", 50, { categoria: "caixinha" }), t(2, "saida", 10)])).toBe(-10)
    expect(saldoDoDia([])).toBe(0)
  })
})

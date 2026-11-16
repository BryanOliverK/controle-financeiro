import { describe, it, expect } from "vitest"
import { MAX_PARCELAS, dividirEmParcelas, gerarParcelas, limparParcela } from "./parcelas"

const somaCentavos = (valores) => valores.reduce((s, v) => s + Math.round(v * 100), 0)
const dia = (iso) => new Date(iso)

describe("dividirEmParcelas", () => {
  it("a sobra de centavos vai para a última parcela", () => {
    expect(dividirEmParcelas(100, 3)).toEqual([33.33, 33.33, 33.34])
  })

  it("a soma sempre bate com o total", () => {
    for (const [total, n] of [[0.1, 3], [1234.57, 7], [99.99, 12], [1000, 48], [0.05, 2]]) {
      expect(somaCentavos(dividirEmParcelas(total, n))).toBe(Math.round(total * 100))
    }
  })

  it("divisão exata não deixa sobra", () => {
    expect(dividirEmParcelas(90, 3)).toEqual([30, 30, 30])
  })
})

describe("gerarParcelas", () => {
  const base = { descricao: "TV", valorTotal: 900, tipo: "saida", categoria: "casa" }

  it("cria uma transação por parcela com a posição (n/total)", () => {
    const p = gerarParcelas(base, new Date(2026, 5, 10, 12).toISOString(), 3)
    expect(p).toHaveLength(3)
    expect(p.map((x) => x.parcela.n)).toEqual([1, 2, 3])
    expect(p.every((x) => x.parcela.total === 3)).toBe(true)
    expect(new Set(p.map((x) => x.parcela.grupo)).size).toBe(1)
  })

  it("ids únicos e valores somando o total", () => {
    const p = gerarParcelas(base, new Date(2026, 5, 10, 12).toISOString(), 4)
    expect(new Set(p.map((x) => x.id)).size).toBe(4)
    expect(somaCentavos(p.map((x) => x.valor))).toBe(90000)
  })

  it("uma parcela por mês, mantendo o dia", () => {
    const p = gerarParcelas(base, new Date(2026, 0, 15, 12).toISOString(), 3)
    expect(p.map((x) => [dia(x.data).getMonth(), dia(x.data).getDate()])).toEqual([[0, 15], [1, 15], [2, 15]])
  })

  it("dia 31 cai no último dia dos meses mais curtos", () => {
    const p = gerarParcelas(base, new Date(2026, 0, 31, 12).toISOString(), 4)
    expect(p.map((x) => dia(x.data).getDate())).toEqual([31, 28, 31, 30])
  })

  it("vira o ano", () => {
    const p = gerarParcelas(base, new Date(2026, 10, 15, 12).toISOString(), 3)
    expect(dia(p[2].data).getFullYear()).toBe(2027)
    expect(dia(p[2].data).getMonth()).toBe(0)
  })

  it("leva o cartão junto, se houver", () => {
    const p = gerarParcelas({ ...base, cartaoId: "n" }, new Date(2026, 5, 10, 12).toISOString(), 2)
    expect(p.every((x) => x.cartaoId === "n")).toBe(true)
    expect(gerarParcelas(base, new Date(2026, 5, 10, 12).toISOString(), 2)[0].cartaoId).toBeUndefined()
  })

  it("leva a conta junto, se houver", () => {
    const p = gerarParcelas({ ...base, contaId: "c1" }, new Date(2026, 5, 10, 12).toISOString(), 2)
    expect(p.every((x) => x.contaId === "c1")).toBe(true)
    expect(gerarParcelas(base, new Date(2026, 5, 10, 12).toISOString(), 2)[0].contaId).toBeUndefined()
  })
})

describe("limparParcela", () => {
  it("aceita parcela válida", () => {
    expect(limparParcela({ n: 1, total: 2, grupo: "g", extra: 1 })).toEqual({ n: 1, total: 2, grupo: "g" })
  })

  it("recusa parcela fora dos limites", () => {
    expect(limparParcela({ n: 3, total: 2, grupo: "g" })).toBeNull()
    expect(limparParcela({ n: 1, total: 1, grupo: "g" })).toBeNull()
    expect(limparParcela({ n: 1, total: MAX_PARCELAS + 1, grupo: "g" })).toBeNull()
    expect(limparParcela({ n: 0, total: 2, grupo: "g" })).toBeNull()
    expect(limparParcela({ n: 1, total: 2 })).toBeNull()
    expect(limparParcela(null)).toBeNull()
  })
})

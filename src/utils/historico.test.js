import { describe, it, expect } from "vitest"
import { agruparPorMes, contarCaixinhas, idsDosMeses, resumirPorMes, semCartao, semOculta } from "./historico"

const d = (a, m, dia) => new Date(a, m - 1, dia, 12).toISOString()
const tx = [
  { id: "1", descricao: "a", valor: 1, tipo: "saida", categoria: "casa", data: d(2026, 11, 3) },
  { id: "2", descricao: "b", valor: 1, tipo: "saida", categoria: "casa", data: d(2026, 11, 20) },
  { id: "3", descricao: "c", valor: 1, tipo: "saida", categoria: "caixinha", data: d(2026, 11, 6) },
  { id: "4", descricao: "d", valor: 1, tipo: "saida", categoria: "casa", data: d(2026, 10, 5), oculta: true },
  { id: "5", descricao: "e", valor: 1, tipo: "entrada", categoria: "salario", data: d(2025, 12, 5) }
]
const visiveis = { ocultas: false, incluirCaixinha: false }

describe("resumirPorMes", () => {
  it("conta por mês, do mais novo ao mais antigo, sem ocultas nem caixinha", () => {
    expect(resumirPorMes(tx, visiveis)).toEqual([
      { mes: "2026-11", ano: "2026", quantidade: 2 },
      { mes: "2025-12", ano: "2025", quantidade: 1 }
    ])
  })

  it("com caixinha incluída ela entra na contagem", () => {
    expect(resumirPorMes(tx, { ocultas: false, incluirCaixinha: true })[0].quantidade).toBe(3)
  })

  it("lista as ocultas separadamente", () => {
    expect(resumirPorMes(tx, { ocultas: true, incluirCaixinha: true })).toEqual([
      { mes: "2026-10", ano: "2026", quantidade: 1 }
    ])
  })
})

describe("agruparPorMes", () => {
  it("devolve as transações de cada mês, mais novas primeiro", () => {
    const g = agruparPorMes(tx, visiveis)
    expect(g.map((x) => x.mes)).toEqual(["2026-11", "2025-12"])
    expect(g[0].itens.map((t) => t.id)).toEqual(["2", "1"])
  })
})

describe("idsDosMeses", () => {
  it("devolve só os ids dos meses escolhidos", () => {
    expect(idsDosMeses(tx, ["2026-11"], visiveis).sort()).toEqual(["1", "2"])
    expect(idsDosMeses(tx, ["2026-11", "2025-12"], visiveis).sort()).toEqual(["1", "2", "5"])
  })

  it("nunca mistura visíveis com ocultas", () => {
    expect(idsDosMeses(tx, ["2026-10"], visiveis)).toEqual([])
    expect(idsDosMeses(tx, ["2026-10"], { ocultas: true, incluirCaixinha: true })).toEqual(["4"])
  })
})

describe("contarCaixinhas", () => {
  it("conta as movimentações de caixinha dos meses escolhidos", () => {
    expect(contarCaixinhas(tx, ["2026-11"])).toBe(1)
    expect(contarCaixinhas(tx, ["2025-12"])).toBe(0)
  })
})

describe("semOculta e semCartao", () => {
  it("removem só a marca, sem alterar o original", () => {
    const original = { id: "1", oculta: true, valor: 5 }
    expect(semOculta(original)).toEqual({ id: "1", valor: 5 })
    expect(original.oculta).toBe(true)

    const comCartao = { id: "1", cartaoId: "n", valor: 5 }
    expect(semCartao(comCartao)).toEqual({ id: "1", valor: 5 })
    expect(comCartao.cartaoId).toBe("n")
  })
})

import { describe, it, expect } from "vitest"
import {
  comPagamento, estaQuitada, limparDividas, ordenarDividas, resumoDividas,
  saldoDivida, semPagamento, statusDivida, totalPago, transacaoDoPagamento,
  validarDivida, validarPagamento, diasParaVencer
} from "./dividas"

const hoje = new Date(2026, 10, 15, 10)
const iso = (a, m, d) => new Date(a, m - 1, d, 12).toISOString()

const nova = (extra = {}) => ({
  id: "d1", tipo: "devo", pessoa: "Maria", descricao: "", valor: 100,
  criadaEm: iso(2026, 11, 1), vencimento: "", pagamentos: [], ...extra
})

describe("limparDividas", () => {
  it("aceita uma dívida boa e normaliza", () => {
    const [d] = limparDividas([{ ...nova(), pessoa: "  Maria  ", valor: 10.005 }])
    expect(d.pessoa).toBe("Maria")
    expect(d.valor).toBe(10.01)
  })

  it("rejeita lixo, tipo errado, valor inválido e ids repetidos", () => {
    const r = limparDividas([
      null, "x", {}, nova({ id: "" }), nova({ tipo: "outro" }), nova({ pessoa: " " }),
      nova({ valor: 0 }), nova({ valor: -5 }), nova({ valor: "10" }), nova({ criadaEm: "lixo" }),
      nova({ id: "ok" }), nova({ id: "ok" })
    ])
    expect(r.map((d) => d.id)).toEqual(["ok"])
  })

  it("não é lista: devolve vazio", () => {
    expect(limparDividas(undefined)).toEqual([])
    expect(limparDividas({})).toEqual([])
  })

  it("vencimento inválido some; válido fica", () => {
    expect(limparDividas([nova({ vencimento: "amanhã" })])[0].vencimento).toBe("")
    expect(limparDividas([nova({ vencimento: "2026-12-31" })])[0].vencimento).toBe("2026-12-31")
  })

  it("limpa pagamentos inválidos e repetidos", () => {
    const [d] = limparDividas([nova({ pagamentos: [
      { id: "a", valor: 10, data: iso(2026, 11, 2) },
      { id: "a", valor: 10, data: iso(2026, 11, 2) },
      { id: "b", valor: -1, data: iso(2026, 11, 2) },
      { id: "c", valor: 5, data: "lixo" },
      { id: "e", valor: 5, data: iso(2026, 11, 3), transacaoId: "t1" }
    ] })])
    expect(d.pagamentos.map((p) => p.id)).toEqual(["a", "e"])
    expect(d.pagamentos[1].transacaoId).toBe("t1")
  })

  it("corta textos longos", () => {
    const [d] = limparDividas([nova({ pessoa: "x".repeat(80), descricao: "y".repeat(80) })])
    expect(d.pessoa.length).toBe(30)
    expect(d.descricao.length).toBe(40)
  })
})

describe("saldo e pagamentos", () => {
  it("soma em centavos, sem erro de ponto flutuante", () => {
    const d = nova({ valor: 0.3, pagamentos: [
      { id: "a", valor: 0.1, data: iso(2026, 11, 2) },
      { id: "b", valor: 0.2, data: iso(2026, 11, 3) }
    ] })
    expect(totalPago(d)).toBe(0.3)
    expect(saldoDivida(d)).toBe(0)
    expect(estaQuitada(d)).toBe(true)
  })

  it("saldo nunca fica negativo", () => {
    const d = nova({ valor: 10, pagamentos: [{ id: "a", valor: 50, data: iso(2026, 11, 2) }] })
    expect(saldoDivida(d)).toBe(0)
  })

  it("comPagamento e semPagamento não alteram a original", () => {
    const d = nova()
    const p = { id: "p1", valor: 40, data: iso(2026, 11, 5) }
    const d2 = comPagamento(d, p)
    expect(d.pagamentos).toHaveLength(0)
    expect(saldoDivida(d2)).toBe(60)
    expect(saldoDivida(semPagamento(d2, "p1"))).toBe(100)
  })
})

describe("status e vencimento", () => {
  it("aberta, vencida e quitada", () => {
    expect(statusDivida(nova(), hoje)).toBe("aberta")
    expect(statusDivida(nova({ vencimento: "2026-11-20" }), hoje)).toBe("aberta")
    expect(statusDivida(nova({ vencimento: "2026-11-15" }), hoje)).toBe("aberta")
    expect(statusDivida(nova({ vencimento: "2026-11-14" }), hoje)).toBe("vencida")
    expect(statusDivida(nova({ vencimento: "2026-11-01", pagamentos: [{ id: "a", valor: 100, data: iso(2026, 11, 2) }] }), hoje)).toBe("quitada")
  })

  it("dias para vencer", () => {
    expect(diasParaVencer(nova(), hoje)).toBe(null)
    expect(diasParaVencer(nova({ vencimento: "2026-11-18" }), hoje)).toBe(3)
    expect(diasParaVencer(nova({ vencimento: "2026-11-13" }), hoje)).toBe(-2)
  })
})

describe("resumoDividas", () => {
  it("separa o que você deve do que te devem, só o que falta", () => {
    const r = resumoDividas([
      nova({ id: "1", tipo: "devo", valor: 100, pagamentos: [{ id: "a", valor: 30, data: iso(2026, 11, 2) }] }),
      nova({ id: "2", tipo: "devem", valor: 50.1 }),
      nova({ id: "3", tipo: "devem", valor: 20.2 })
    ])
    expect(r.devo).toBe(70)
    expect(r.devem).toBe(70.3)
    expect(r.saldo).toBe(0.3)
  })

  it("lista vazia", () => {
    expect(resumoDividas([])).toEqual({ devo: 0, devem: 0, saldo: 0 })
  })
})

describe("ordenarDividas", () => {
  it("abertas por vencimento (sem data por último), quitadas no fim", () => {
    const quitada = nova({ id: "q", valor: 5, pagamentos: [{ id: "a", valor: 5, data: iso(2026, 11, 2) }] })
    const r = ordenarDividas([
      quitada,
      nova({ id: "sem" }),
      nova({ id: "tarde", vencimento: "2026-12-20" }),
      nova({ id: "cedo", vencimento: "2026-11-20" })
    ])
    expect(r.map((d) => d.id)).toEqual(["cedo", "tarde", "sem", "q"])
  })

  it("não altera a lista original", () => {
    const l = [nova({ id: "b", vencimento: "2026-12-01" }), nova({ id: "a", vencimento: "2026-11-01" })]
    ordenarDividas(l)
    expect(l[0].id).toBe("b")
  })
})

describe("validações", () => {
  it("validarDivida", () => {
    expect(validarDivida({ pessoa: "", valor: 10 })).not.toBe("")
    expect(validarDivida({ pessoa: " ", valor: 10 })).not.toBe("")
    expect(validarDivida({ pessoa: "Ana", valor: "" })).not.toBe("")
    expect(validarDivida({ pessoa: "Ana", valor: 0 })).not.toBe("")
    expect(validarDivida({ pessoa: "Ana", valor: -1 })).not.toBe("")
    expect(validarDivida({ pessoa: "Ana", valor: "abc" })).not.toBe("")
    expect(validarDivida({ pessoa: "Ana", valor: 1e15 })).not.toBe("")
    expect(validarDivida({ pessoa: "Ana", valor: 10, vencimento: "x" })).not.toBe("")
    expect(validarDivida({ pessoa: "Ana", valor: "10.5", vencimento: "2026-12-01" })).toBe("")
    expect(validarDivida({ pessoa: "Ana", valor: 10, vencimento: "" })).toBe("")
  })

  it("validarPagamento não deixa passar do saldo", () => {
    const d = nova({ valor: 100, pagamentos: [{ id: "a", valor: 30, data: iso(2026, 11, 2) }] })
    expect(validarPagamento(d, 70)).toBe("")
    expect(validarPagamento(d, 70.01)).not.toBe("")
    expect(validarPagamento(d, 0)).not.toBe("")
    expect(validarPagamento(d, "")).not.toBe("")
    expect(validarPagamento(d, "x")).not.toBe("")
  })
})

describe("transacaoDoPagamento", () => {
  const p = { id: "p", valor: 25.5, data: iso(2026, 11, 5) }

  it("se você deve, é saída", () => {
    const t = transacaoDoPagamento(nova({ tipo: "devo" }), p, "t1")
    expect([t.id, t.tipo, t.valor, t.categoria]).toEqual(["t1", "saida", 25.5, "outros"])
    expect(t.descricao).toBe("Pagamento: Maria")
  })

  it("se te devem, é entrada", () => {
    const t = transacaoDoPagamento(nova({ tipo: "devem" }), p, "t2")
    expect(t.tipo).toBe("entrada")
    expect(t.descricao).toBe("Recebido de Maria")
  })

  it("descrição respeita o limite de 40", () => {
    const t = transacaoDoPagamento(nova({ pessoa: "z".repeat(30) }), p, "t3")
    expect(t.descricao.length <= 40).toBe(true)
  })
})

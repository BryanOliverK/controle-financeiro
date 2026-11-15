import { describe, it, expect } from "vitest"
import { criarRecorrente, gerarPendentes } from "./recorrentes"

const rec = (extra = {}) => ({
  id: "r1", descricao: "Aluguel", valor: 1000, tipo: "saida", categoria: "casa",
  dia: 5, proximoMes: "2026-11", ...extra
})

describe("criarRecorrente", () => {
  it("guarda o dia do mês e a próxima geração é no mês seguinte", () => {
    const r = criarRecorrente(
      { descricao: "Netflix", valor: 40, tipo: "saida", categoria: "lazer" },
      new Date(2026, 10, 20, 12).toISOString()
    )
    expect(r.dia).toBe(20)
    expect(r.proximoMes).toBe("2026-12")
    expect(r.id).toBeTruthy()
  })

  it("dezembro vira janeiro do ano seguinte", () => {
    const r = criarRecorrente({ descricao: "x", valor: 1, tipo: "saida", categoria: "casa" }, new Date(2026, 11, 3, 12).toISOString())
    expect(r.proximoMes).toBe("2027-01")
  })

  it("leva o cartão junto", () => {
    const r = criarRecorrente({ descricao: "x", valor: 1, tipo: "saida", categoria: "casa", cartaoId: "n" }, new Date(2026, 0, 3, 12).toISOString())
    expect(r.cartaoId).toBe("n")
  })
})

describe("gerarPendentes", () => {
  it("não gera nada se o dia ainda não chegou", () => {
    expect(gerarPendentes([rec()], new Date(2026, 10, 4, 10))).toBeNull()
  })

  it("gera no próprio dia", () => {
    const r = gerarPendentes([rec()], new Date(2026, 10, 5, 10))
    expect(r.transacoes).toHaveLength(1)
    expect(r.transacoes[0].id).toBe("rec-r1-2026-11")
    expect(r.recorrentes[0].proximoMes).toBe("2026-12")
  })

  it("recupera todos os meses atrasados de uma vez", () => {
    const r = gerarPendentes([rec({ proximoMes: "2026-08" })], new Date(2026, 10, 20, 10))
    expect(r.transacoes.map((t) => t.id)).toEqual([
      "rec-r1-2026-08", "rec-r1-2026-09", "rec-r1-2026-10", "rec-r1-2026-11"
    ])
    expect(r.recorrentes[0].proximoMes).toBe("2026-12")
  })

  it("os ids são fixos: gerar de novo dá os mesmos ids (sem duplicar)", () => {
    const a = gerarPendentes([rec()], new Date(2026, 10, 10, 10))
    const b = gerarPendentes([rec()], new Date(2026, 10, 25, 10))
    expect(a.transacoes[0].id).toBe(b.transacoes[0].id)
  })

  it("dia 31 vira o último dia dos meses curtos", () => {
    const r = gerarPendentes([rec({ dia: 31, proximoMes: "2027-02" })], new Date(2027, 2, 15, 10))
    expect(new Date(r.transacoes[0].data).getDate()).toBe(28)
  })

  it("copia os dados e o cartão para a transação gerada", () => {
    const r = gerarPendentes([rec({ cartaoId: "n" })], new Date(2026, 10, 6, 10))
    const t = r.transacoes[0]
    expect([t.descricao, t.valor, t.tipo, t.categoria, t.cartaoId]).toEqual(["Aluguel", 1000, "saida", "casa", "n"])
  })

  it("não mexe nos que ainda não venceram", () => {
    const r = gerarPendentes([rec(), rec({ id: "r2", dia: 25 })], new Date(2026, 10, 6, 10))
    expect(r.transacoes).toHaveLength(1)
    expect(r.recorrentes.find((x) => x.id === "r2").proximoMes).toBe("2026-11")
  })
})

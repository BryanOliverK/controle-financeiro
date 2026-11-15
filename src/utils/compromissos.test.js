import { describe, it, expect } from "vitest"
import { agruparCompromissosPorMes, listarCompromissos } from "./compromissos"

const d = (a, m, dia) => new Date(a, m - 1, dia, 12).toISOString()
const hoje = new Date(2026, 10, 15, 10)
const nubank = { id: "n", nome: "Nubank", fechamento: 10, vencimento: 17 }

const tx = [
  { id: "1", descricao: "Mercado", valor: 100.1, tipo: "saida", categoria: "casa", data: d(2026, 11, 5), cartaoId: "n" },
  { id: "2", descricao: "Uber", valor: 20.2, tipo: "saida", categoria: "transporte", data: d(2026, 11, 12), cartaoId: "n" },
  { id: "5", descricao: "TV", valor: 100, tipo: "saida", categoria: "casa", data: d(2027, 1, 14), cartaoId: "n", parcela: { n: 3, total: 3, grupo: "g" } },
  { id: "6", descricao: "Sofá", valor: 200, tipo: "saida", categoria: "casa", data: d(2026, 12, 20), parcela: { n: 2, total: 4, grupo: "h" } },
  { id: "7", descricao: "Oculta", valor: 50, tipo: "saida", categoria: "casa", data: d(2026, 12, 21), oculta: true },
  { id: "8", descricao: "Guardar", valor: 50, tipo: "saida", categoria: "caixinha", data: d(2026, 12, 22) }
]

const entrada = (extra = {}) => ({
  transacoes: tx, recorrentes: [], cartoes: [nubank], faturasPagas: [], ...extra
})

describe("listarCompromissos", () => {
  it("lista faturas não pagas com o total e a data de vencimento", () => {
    const itens = listarCompromissos(entrada(), hoje, 6).filter((i) => i.origem === "fatura")
    expect(itens.map((i) => [i.id, i.valor])).toEqual([
      ["fatura-n-2026-11", 100.1],
      ["fatura-n-2026-12", 20.2],
      ["fatura-n-2027-02", 100]
    ])
  })

  it("fatura paga some", () => {
    const itens = listarCompromissos(entrada({ faturasPagas: ["n|2026-11"] }), hoje, 6)
    expect(itens.some((i) => i.id === "fatura-n-2026-11")).toBe(false)
  })

  it("fatura vencida e não paga fica marcada como atrasada", () => {
    const depois = new Date(2026, 10, 20, 10)
    const f = listarCompromissos(entrada(), depois, 6).find((i) => i.id === "fatura-n-2026-11")
    expect(f.atrasada).toBe(true)
    const antes = listarCompromissos(entrada(), hoje, 6).find((i) => i.id === "fatura-n-2026-11")
    expect(antes.atrasada).toBe(false)
  })

  it("parcela no cartão não é contada duas vezes (já está na fatura)", () => {
    const itens = listarCompromissos(entrada(), hoje, 6)
    expect(itens.some((i) => i.titulo === "TV")).toBe(false)
  })

  it("parcela fora do cartão aparece, mas ocultas e caixinha não", () => {
    const itens = listarCompromissos(entrada(), hoje, 6)
    expect(itens.find((i) => i.titulo === "Sofá").detalhe).toBe("Parcela 2/4")
    expect(itens.some((i) => i.titulo === "Oculta")).toBe(false)
    expect(itens.some((i) => i.titulo === "Guardar")).toBe(false)
  })

  it("projeta os lançamentos mensais mês a mês dentro do prazo", () => {
    const mensal = { id: "r", descricao: "Netflix", valor: 40, tipo: "saida", dia: 20, proximoMes: "2026-11" }
    const itens = listarCompromissos(entrada({ transacoes: [], cartoes: [], recorrentes: [mensal] }), hoje, 3)
    expect(itens.map((i) => i.data.getMonth() + 1)).toEqual([11, 12, 1, 2])
  })

  it("mensal de hoje para trás não é compromisso futuro", () => {
    const mensal = { id: "r", descricao: "Netflix", valor: 40, tipo: "saida", dia: 5, proximoMes: "2026-11" }
    const itens = listarCompromissos(entrada({ transacoes: [], cartoes: [], recorrentes: [mensal] }), hoje, 1)
    expect(itens.map((i) => i.data.getMonth() + 1)).toEqual([12])
  })

  it("respeita o prazo de meses à frente", () => {
    const itens = listarCompromissos(entrada(), hoje, 1)
    expect(itens.some((i) => i.id === "fatura-n-2027-02")).toBe(false)
  })

  it("vem em ordem de data", () => {
    const itens = listarCompromissos(entrada(), hoje, 6)
    const datas = itens.map((i) => i.data.getTime())
    expect(datas).toEqual([...datas].sort((a, b) => a - b))
  })
})

describe("agruparCompromissosPorMes", () => {
  it("separa por mês e soma saídas e entradas", () => {
    const g = agruparCompromissosPorMes([
      { id: "a", data: new Date(2026, 10, 20, 12), valor: 10.1, tipo: "saida" },
      { id: "b", data: new Date(2026, 10, 21, 12), valor: 20.2, tipo: "saida" },
      { id: "c", data: new Date(2026, 10, 22, 12), valor: 5, tipo: "entrada" },
      { id: "d", data: new Date(2026, 11, 1, 12), valor: 1, tipo: "saida" }
    ])
    expect(g.map((x) => x.mes)).toEqual(["2026-11", "2026-12"])
    expect(g[0].saidas).toBe(30.3)
    expect(g[0].entradas).toBe(5)
  })
})

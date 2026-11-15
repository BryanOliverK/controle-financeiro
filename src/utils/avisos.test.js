import { describe, it, expect } from "vitest"
import { gerarAvisos, limparAvisosLidos, quando } from "./avisos"

const d = (a, m, dia) => new Date(a, m - 1, dia, 12).toISOString()
const hoje = new Date(2026, 10, 15, 10)
const nubank = { id: "n", nome: "Nubank", fechamento: 10, vencimento: 17 }

const transacoes = [
  { id: "1", descricao: "Mercado", valor: 100, tipo: "saida", categoria: "casa", data: d(2026, 11, 5), cartaoId: "n" },
  { id: "2", descricao: "Uber", valor: 50, tipo: "saida", categoria: "transporte", data: d(2026, 11, 12), cartaoId: "n" },
  { id: "3", descricao: "Cinema", valor: 90, tipo: "saida", categoria: "lazer", data: d(2026, 11, 3) },
  { id: "4", descricao: "Sofá", valor: 200, tipo: "saida", categoria: "casa", data: d(2026, 11, 17), parcela: { n: 2, total: 3, grupo: "g" } }
]

const base = {
  transacoes,
  recorrentes: [{ id: "r", descricao: "Netflix", valor: 40, tipo: "saida", dia: 16, proximoMes: "2026-11" }],
  cartoes: [nubank],
  faturasPagas: [],
  orcamentos: { lazer: 100, casa: 1000, transporte: 500 },
  previsao: { saldoPrevisto: -50 }
}

const titulos = (avisos) => avisos.map((a) => a.titulo)

describe("quando", () => {
  it("hoje, amanhã e em N dias", () => {
    expect(quando(0)).toBe("hoje")
    expect(quando(1)).toBe("amanhã")
    expect(quando(5)).toBe("em 5 dias")
  })
})

describe("gerarAvisos: faturas", () => {
  it("avisa quando vence em poucos dias (alerta com 2 dias)", () => {
    const a = gerarAvisos(base, hoje)[0]
    expect(a.titulo).toBe("Fatura Nubank vence em 2 dias")
    expect(a.nivel).toBe("alerta")
  })

  it("vence amanhã é urgente", () => {
    const a = gerarAvisos(base, new Date(2026, 10, 16, 10)).find((x) => x.tipo === "fatura")
    expect(a.nivel).toBe("urgente")
  })

  it("fatura vencida e não paga é urgente e diz há quantos dias", () => {
    const a = gerarAvisos(base, new Date(2026, 10, 20, 10))[0]
    expect(a.titulo).toBe("Fatura Nubank vencida")
    expect(a.nivel).toBe("urgente")
    expect(a.texto).toContain("há 3 dias")
  })

  it("fatura paga não gera aviso", () => {
    const a = gerarAvisos({ ...base, faturasPagas: ["n|2026-11"] }, hoje)
    expect(a.some((x) => x.tipo === "fatura")).toBe(false)
  })

  it("avisa que a fatura vai fechar", () => {
    const a = gerarAvisos(base, new Date(2026, 11, 9, 10))
    expect(titulos(a)).toContain("Fatura Nubank fecha amanhã")
  })

  it("fatura longe do vencimento não avisa", () => {
    const a = gerarAvisos(base, new Date(2026, 10, 12, 10))
    expect(a.some((x) => x.id.startsWith("fatura-vence"))).toBe(false)
  })
})

describe("gerarAvisos: lembretes, orçamento e previsão", () => {
  it("lembra parcela e mensal dos próximos dias", () => {
    const t = titulos(gerarAvisos(base, hoje))
    expect(t).toContain("Netflix vence amanhã")
    expect(t).toContain("Sofá vence em 2 dias")
  })

  it("não avisa o que está a mais de 3 dias", () => {
    const longe = { ...base, recorrentes: [{ id: "r", descricao: "Netflix", valor: 40, tipo: "saida", dia: 25, proximoMes: "2026-11" }] }
    expect(titulos(gerarAvisos(longe, hoje))).not.toContain("Netflix vence em 10 dias")
  })

  it("orçamento a partir de 80% e estourado", () => {
    expect(titulos(gerarAvisos(base, hoje))).toContain("Lazer: 90% do orçamento")

    const estourado = gerarAvisos({ ...base, orcamentos: { lazer: 50 } }, hoje)
    const a = estourado.find((x) => x.titulo === "Orçamento de Lazer estourado")
    expect(a.nivel).toBe("urgente")
  })

  it("previsão negativa avisa; positiva não", () => {
    expect(gerarAvisos(base, hoje).some((x) => x.tipo === "previsao")).toBe(true)
    expect(gerarAvisos({ ...base, previsao: { saldoPrevisto: 10 } }, hoje).some((x) => x.tipo === "previsao")).toBe(false)
  })
})

describe("gerarAvisos: ordem e ids", () => {
  it("urgentes primeiro e novidades por último", () => {
    const a = gerarAvisos(base, new Date(2026, 10, 20, 10))
    expect(a[0].nivel).toBe("urgente")
    expect(a[a.length - 1].tipo).toBe("novidade")
    const ordem = { urgente: 0, alerta: 1, info: 2 }
    const ranks = a.map((x) => ordem[x.nivel])
    expect(ranks).toEqual([...ranks].sort((x, y) => x - y))
  })

  it("mostra só as 3 novidades mais recentes", () => {
    expect(gerarAvisos(base, hoje).filter((x) => x.tipo === "novidade")).toHaveLength(3)
  })

  it("o id muda quando a situação fica mais urgente (aviso lido volta)", () => {
    const antes = gerarAvisos(base, hoje).find((x) => x.tipo === "fatura").id
    const depois = gerarAvisos(base, new Date(2026, 10, 16, 10)).find((x) => x.tipo === "fatura").id
    expect(antes).not.toBe(depois)
  })

  it("todos os ids são únicos", () => {
    const ids = gerarAvisos(base, hoje).map((x) => x.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("sem dados não há aviso além das novidades", () => {
    const vazio = { transacoes: [], recorrentes: [], cartoes: [], faturasPagas: [], orcamentos: {}, previsao: { saldoPrevisto: 0 } }
    expect(gerarAvisos(vazio, hoje).every((x) => x.tipo === "novidade")).toBe(true)
  })
})

describe("limparAvisosLidos", () => {
  it("aceita só texto válido, sem repetidos", () => {
    expect(limparAvisosLidos(["a", "a", 1, "", null, "x".repeat(200), "b"])).toEqual(["a", "b"])
  })

  it("guarda no máximo 300, ficando com os mais recentes", () => {
    const muitos = Array.from({ length: 350 }, (_, i) => `id${i}`)
    const r = limparAvisosLidos(muitos)
    expect(r).toHaveLength(300)
    expect(r[299]).toBe("id349")
  })

  it("entrada que não é lista vira lista vazia", () => {
    expect(limparAvisosLidos(undefined)).toEqual([])
  })
})

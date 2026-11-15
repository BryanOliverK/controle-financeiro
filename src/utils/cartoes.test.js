import { describe, it, expect, afterEach } from "vitest"
import {
  agruparFaturas, chaveFatura, diasAte, faturaDaCompra, infoCartao,
  limparCartoes, limparFaturasPagas, registrarCartoes, statusFatura
} from "./cartoes"

const d = (a, m, dia) => new Date(a, m - 1, dia, 12).toISOString()
const fmt = (x) => `${x.getDate()}/${x.getMonth() + 1}/${x.getFullYear()}`
const nubank = { id: "n", nome: "Nubank", fechamento: 10, vencimento: 17 }

afterEach(() => registrarCartoes([]))

describe("faturaDaCompra", () => {
  it("compra até o dia do fechamento entra na fatura que fecha neste mês", () => {
    const f = faturaDaCompra(nubank, d(2026, 11, 10))
    expect(f.chave).toBe("2026-11")
    expect(fmt(f.fecha)).toBe("10/11/2026")
    expect(fmt(f.vence)).toBe("17/11/2026")
  })

  it("compra no dia seguinte ao fechamento vai para a próxima fatura", () => {
    const f = faturaDaCompra(nubank, d(2026, 11, 11))
    expect(f.chave).toBe("2026-12")
    expect(fmt(f.vence)).toBe("17/12/2026")
  })

  it("vencimento antes do fechamento no calendário cai no mês seguinte", () => {
    const inter = { fechamento: 25, vencimento: 5 }
    const f = faturaDaCompra(inter, d(2026, 11, 20))
    expect(fmt(f.fecha)).toBe("25/11/2026")
    expect(fmt(f.vence)).toBe("5/12/2026")
  })

  it("vira o ano", () => {
    const f = faturaDaCompra({ fechamento: 25, vencimento: 5 }, d(2026, 12, 28))
    expect(f.chave).toBe("2027-01")
    expect(fmt(f.vence)).toBe("5/2/2027")
  })

  it("dia 31 em fevereiro vira o último dia do mês", () => {
    const f = faturaDaCompra({ fechamento: 31, vencimento: 10 }, d(2027, 2, 15))
    expect(fmt(f.fecha)).toBe("28/2/2027")
    expect(fmt(f.vence)).toBe("10/3/2027")
  })
})

describe("agruparFaturas", () => {
  const tx = [
    { id: "1", descricao: "Mercado", valor: 100.1, tipo: "saida", data: d(2026, 11, 5), cartaoId: "n" },
    { id: "2", descricao: "Uber", valor: 20.2, tipo: "saida", data: d(2026, 11, 12), cartaoId: "n" },
    { id: "3", descricao: "Sem cartão", valor: 30, tipo: "saida", data: d(2026, 11, 8) },
    { id: "4", descricao: "Oculta", valor: 999, tipo: "saida", data: d(2026, 11, 5), cartaoId: "n", oculta: true },
    { id: "5", descricao: "Entrada", valor: 50, tipo: "entrada", data: d(2026, 11, 5), cartaoId: "n" },
    { id: "6", descricao: "Outro cartão", valor: 70, tipo: "saida", data: d(2026, 11, 5), cartaoId: "x" },
    { id: "7", descricao: "TV", valor: 100, tipo: "saida", data: d(2027, 1, 14), cartaoId: "n" }
  ]

  it("agrupa por fatura, ordenadas pelo vencimento, ignorando ocultas, entradas e outros cartões", () => {
    const f = agruparFaturas(nubank, tx)
    expect(f.map((x) => x.chave)).toEqual(["2026-11", "2026-12", "2027-02"])
    expect(f.map((x) => x.total)).toEqual([100.1, 20.2, 100])
  })

  it("soma em centavos, sem erro de ponto flutuante", () => {
    const lista = [
      { id: "a", descricao: "a", valor: 0.1, tipo: "saida", data: d(2026, 11, 5), cartaoId: "n" },
      { id: "b", descricao: "b", valor: 0.2, tipo: "saida", data: d(2026, 11, 6), cartaoId: "n" }
    ]
    expect(agruparFaturas(nubank, lista)[0].total).toBe(0.3)
  })
})

describe("statusFatura", () => {
  const fatura = { fecha: new Date(2026, 10, 10, 12), vence: new Date(2026, 10, 17, 12) }

  it("aberta até o dia do fechamento", () => {
    expect(statusFatura(fatura, false, new Date(2026, 10, 10, 9))).toBe("aberta")
  })

  it("fechada entre o fechamento e o vencimento", () => {
    expect(statusFatura(fatura, false, new Date(2026, 10, 11, 9))).toBe("fechada")
    expect(statusFatura(fatura, false, new Date(2026, 10, 17, 9))).toBe("fechada")
  })

  it("vencida depois do vencimento", () => {
    expect(statusFatura(fatura, false, new Date(2026, 10, 18, 9))).toBe("vencida")
  })

  it("paga vale em qualquer data", () => {
    expect(statusFatura(fatura, true, new Date(2026, 10, 30, 9))).toBe("paga")
  })
})

describe("diasAte", () => {
  it("conta dias de calendário, sem depender da hora", () => {
    const hoje = new Date(2026, 10, 15, 23, 59)
    expect(diasAte(new Date(2026, 10, 15, 0, 1), hoje)).toBe(0)
    expect(diasAte(new Date(2026, 10, 17, 12), hoje)).toBe(2)
    expect(diasAte(new Date(2026, 10, 14, 12), hoje)).toBe(-1)
  })
})

describe("cadastro", () => {
  it("limparCartoes recusa dados ruins e corta nome grande", () => {
    const r = limparCartoes([
      { id: "a", nome: "X", fechamento: 5, vencimento: 12 },
      { id: "a", nome: "repetido", fechamento: 5, vencimento: 12 },
      { id: "b", nome: "dia ruim", fechamento: 40, vencimento: 1 },
      { id: "c", nome: " ", fechamento: 1, vencimento: 1 },
      { id: "d", nome: "Y".repeat(40), fechamento: 1, vencimento: 31, cor: "x" },
      { nome: "sem id", fechamento: 1, vencimento: 1 }
    ])
    expect(r.map((c) => c.id)).toEqual(["a", "d"])
    expect(r[1].nome).toHaveLength(20)
    expect(r[1].cor).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it("registrarCartoes permite achar o cartão pelo id", () => {
    registrarCartoes([nubank])
    expect(infoCartao("n").nome).toBe("Nubank")
    expect(infoCartao("zzz")).toBeNull()
  })

  it("limparFaturasPagas aceita só o formato id|AAAA-MM e tira repetidos", () => {
    expect(limparFaturasPagas(["n|2026-11", "n|2026-11", "ruim", 5, "n|2026-1"])).toEqual(["n|2026-11"])
  })

  it("chaveFatura junta cartão e mês", () => {
    expect(chaveFatura("n", "2026-11")).toBe("n|2026-11")
  })
})

import { describe, it, expect } from "vitest"
import { anosDisponiveis, resumoDoAno } from "./resumoAnual"

const t = (tipo, valor, ano, mes, categoria = "casa") => ({ id: Math.random(), tipo, valor, categoria, descricao: "x", data: new Date(ano, mes - 1, 10, 12).toISOString() })

const lista = [
  t("entrada", 3000, 2026, 1, "salario"), t("saida", 1000, 2026, 1, "casa"), t("saida", 200.1, 2026, 1, "lazer"),
  t("entrada", 3000, 2026, 2, "salario"), t("saida", 2500, 2026, 2, "casa"),
  t("saida", 100, 2026, 2, "caixinha"),
  t("saida", 50, 2025, 12, "casa")
]

describe("anosDisponiveis", () => {
  it("do mais novo para o mais antigo, sem repetir", () => {
    expect(anosDisponiveis(lista)).toEqual([2026, 2025])
    expect(anosDisponiveis([])).toEqual([])
  })
})

describe("resumoDoAno", () => {
  const r = resumoDoAno(lista, 2026)

  it("tem 12 meses e soma entradas e saídas em centavos", () => {
    expect(r.meses).toHaveLength(12)
    expect(r.meses[0]).toEqual({ mes: 1, entradas: 3000, saidas: 1200.1, saldo: 1799.9 })
    expect(r.totais.entradas).toBe(6000)
    expect(r.totais.saidas).toBe(3700.1)
    expect(r.totais.saldo).toBe(2299.9)
  })

  it("não conta caixinha nem outros anos", () => {
    expect(r.meses[1].saidas).toBe(2500)
    expect(resumoDoAno(lista, 2025).totais.saidas).toBe(50)
  })

  it("média só dos meses com movimento, maior gasto e poupança", () => {
    expect(r.mesesComMovimento).toBe(2)
    expect(r.mediaSaidas).toBe(1850.05)
    expect(r.maiorGasto).toEqual({ mes: 2, valor: 2500 })
    expect(Math.round(r.taxaPoupanca)).toBe(38)
  })

  it("categorias que mais pesaram, em ordem", () => {
    expect(r.topCategorias.map((c) => c.categoria)).toEqual(["casa", "lazer"])
    expect(Math.round(r.topCategorias[0].porcentagem)).toBe(95)
  })

  it("ano sem dados: tudo zerado e sem erro", () => {
    const vazio = resumoDoAno(lista, 2000)
    expect(vazio.totais).toEqual({ entradas: 0, saidas: 0, saldo: 0 })
    expect(vazio.maiorGasto).toBe(null)
    expect(vazio.taxaPoupanca).toBe(null)
    expect(vazio.mediaSaidas).toBe(0)
    expect(vazio.topCategorias).toEqual([])
  })
})

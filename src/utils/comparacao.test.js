import { describe, it, expect } from "vitest"
import { resumoPorMes, rotuloMesCurto, ultimosMeses, variacao } from "./comparacao"

const hoje = new Date(2026, 10, 15, 12)

describe("ultimosMeses", () => {
  it("do mais antigo ao atual, atravessando o ano", () => {
    expect(ultimosMeses(3, hoje)).toEqual(["2026-09", "2026-10", "2026-11"])
    expect(ultimosMeses(3, new Date(2026, 0, 10))).toEqual(["2025-11", "2025-12", "2026-01"])
  })
})

describe("resumoPorMes", () => {
  it("soma por mês e preenche meses sem movimento com zero", () => {
    const tx = [
      { id: 1, tipo: "entrada", valor: 100, categoria: "salario", data: new Date(2026, 10, 2, 12).toISOString() },
      { id: 2, tipo: "saida", valor: 30, categoria: "casa", data: new Date(2026, 10, 3, 12).toISOString() },
      { id: 3, tipo: "saida", valor: 10, categoria: "casa", data: new Date(2026, 8, 3, 12).toISOString() }
    ]
    expect(resumoPorMes(tx, 3, hoje)).toEqual([
      { chave: "2026-09", entradas: 0, saidas: 10 },
      { chave: "2026-10", entradas: 0, saidas: 0 },
      { chave: "2026-11", entradas: 100, saidas: 30 }
    ])
  })
})

describe("variacao", () => {
  it("calcula o percentual", () => {
    expect(variacao(150, 100)).toBe(50)
    expect(variacao(50, 100)).toBe(-50)
  })

  it("sem base de comparação devolve null", () => {
    expect(variacao(10, 0)).toBeNull()
  })
})

describe("rotuloMesCurto", () => {
  it("abrevia o mês", () => {
    expect(rotuloMesCurto("2026-11")).toBe("nov")
  })
})

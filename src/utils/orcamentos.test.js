import { describe, it, expect } from "vitest"
import { gastoDaCategoria, limparOrcamentos, mensagemAlerta, statusOrcamento } from "./orcamentos"

const t = (tipo, valor, categoria, data) => ({ id: Math.random(), tipo, valor, categoria, data: data.toISOString(), descricao: "x" })
const nov = new Date(2026, 10, 10, 12)

describe("gastoDaCategoria", () => {
  it("soma só saídas da categoria no mês", () => {
    const lista = [
      t("saida", 10.1, "casa", nov),
      t("saida", 20.2, "casa", nov),
      t("entrada", 500, "casa", nov),
      t("saida", 7, "lazer", nov),
      t("saida", 99, "casa", new Date(2026, 9, 10, 12))
    ]
    expect(gastoDaCategoria(lista, "casa", "2026-11")).toBe(30.3)
  })
})

describe("statusOrcamento", () => {
  it("abaixo de 80% está ok", () => {
    expect(statusOrcamento(79, 100).nivel).toBe("ok")
  })

  it("a partir de 80% é alerta, e o limite exato ainda não estourou", () => {
    expect(statusOrcamento(80, 100).nivel).toBe("alerta")
    expect(statusOrcamento(100, 100).nivel).toBe("alerta")
  })

  it("acima do limite estoura e o restante fica negativo", () => {
    const s = statusOrcamento(130, 100)
    expect(s.nivel).toBe("estourado")
    expect(s.restante).toBe(-30)
  })

  it("sem limite não há status", () => {
    expect(statusOrcamento(50, 0)).toBeNull()
    expect(statusOrcamento(50, undefined)).toBeNull()
  })
})

describe("mensagemAlerta", () => {
  it("avisa só quando cruza uma faixa", () => {
    expect(mensagemAlerta("casa", 70, 85, 100)).toContain("85%")
    expect(mensagemAlerta("casa", 85, 90, 100)).toBeNull()
    expect(mensagemAlerta("casa", 90, 120, 100)).toContain("estourado")
    expect(mensagemAlerta("casa", 120, 130, 100)).toBeNull()
  })

  it("não avisa enquanto está ok", () => {
    expect(mensagemAlerta("casa", 10, 20, 100)).toBeNull()
  })
})

describe("limparOrcamentos", () => {
  it("mantém só números positivos e arredonda", () => {
    expect(limparOrcamentos({ casa: "800.456", lazer: 0, saude: -5, x: "abc", y: null }))
      .toEqual({ casa: 800.46 })
  })

  it("entrada que não é objeto vira objeto vazio", () => {
    expect(limparOrcamentos(null)).toEqual({})
    expect(limparOrcamentos("x")).toEqual({})
  })
})

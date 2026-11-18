import { describe, it, expect } from "vitest"
import { gastoDoMes, limparMeta, mensagemAlertaMeta, statusMeta, sugerirMeta } from "./metaGeral"

const t = (tipo, valor, mes, categoria = "casa") => ({ id: Math.random(), tipo, valor, categoria, descricao: "x", data: new Date(2026, mes - 1, 10, 12).toISOString() })

describe("limparMeta", () => {
  it("só aceita número positivo", () => {
    expect(limparMeta(1500)).toBe(1500)
    expect(limparMeta("1500.555")).toBe(1500.56)
    expect(limparMeta(0)).toBe(0)
    expect(limparMeta(-5)).toBe(0)
    expect(limparMeta("abc")).toBe(0)
    expect(limparMeta(null)).toBe(0)
    expect(limparMeta(1e12)).toBe(0)
  })
})

describe("gastoDoMes", () => {
  it("soma só saídas do mês, sem erro de centavos e sem caixinha", () => {
    const lista = [t("saida", 0.1, 11), t("saida", 0.2, 11), t("entrada", 500, 11), t("saida", 50, 10), t("saida", 100, 11, "caixinha")]
    expect(gastoDoMes(lista, "2026-11")).toBe(0.3)
    expect(gastoDoMes(lista, "2026-10")).toBe(50)
    expect(gastoDoMes([], "2026-11")).toBe(0)
  })
})

describe("statusMeta / mensagemAlertaMeta", () => {
  it("sem meta não há status nem aviso", () => {
    expect(statusMeta(100, 0)).toBe(null)
    expect(mensagemAlertaMeta(0, 100, 0)).toBe(null)
  })

  it("avisa ao cruzar 80% e ao estourar, uma vez por faixa", () => {
    expect(mensagemAlertaMeta(700, 750, 1000)).toBe(null)
    expect(mensagemAlertaMeta(700, 820, 1000)).toContain("82%")
    expect(mensagemAlertaMeta(820, 900, 1000)).toBe(null)
    expect(mensagemAlertaMeta(900, 1050, 1000)).toContain("estourada")
    expect(mensagemAlertaMeta(1050, 1100, 1000)).toBe(null)
  })
})

describe("sugerirMeta", () => {
  const hoje = new Date(2026, 10, 15, 12)

  it("média dos últimos meses fechados, arredondada para cima de 10 em 10", () => {
    const lista = [t("saida", 1000, 10), t("saida", 1205, 9), t("saida", 1100, 8), t("saida", 9999, 5), t("saida", 5000, 11)]
    // média de out, set e ago = (1000 + 1205 + 1100) / 3 = 1101,67 -> 1110
    expect(sugerirMeta(lista, hoje)).toBe(1110)
  })

  it("ignora o mês atual, caixinha e entradas; sem histórico dá null", () => {
    expect(sugerirMeta([t("saida", 5000, 11), t("entrada", 100, 10), t("saida", 100, 10, "caixinha")], hoje)).toBe(null)
    expect(sugerirMeta([], hoje)).toBe(null)
  })
})

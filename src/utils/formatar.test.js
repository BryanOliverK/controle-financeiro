import { describe, it, expect } from "vitest"
import {
  arredondar, brl, celulaCSV, chaveMes, contar, dataParaIso,
  hojeLocal, nomeMes, novoId, paraInputData, rotuloData
} from "./formatar"

const semNbsp = (t) => t.replace(/ /g, " ")

describe("brl", () => {
  it("formata em reais", () => {
    expect(semNbsp(brl(1234.5))).toBe("R$ 1.234,50")
    expect(semNbsp(brl(0))).toBe("R$ 0,00")
  })

  it("formata negativos", () => {
    expect(semNbsp(brl(-5))).toBe("-R$ 5,00")
  })
})

describe("arredondar", () => {
  it("evita o erro de ponto flutuante", () => {
    expect(arredondar(0.1 + 0.2)).toBe(0.3)
    expect(arredondar(1.005)).toBe(1.01)
  })
})

describe("novoId", () => {
  it("gera ids diferentes", () => {
    expect(novoId()).not.toBe(novoId())
  })
})

describe("meses", () => {
  it("chaveMes devolve AAAA-MM com zero à esquerda", () => {
    expect(chaveMes(new Date(2026, 0, 5))).toBe("2026-01")
    expect(chaveMes(new Date(2026, 11, 31, 23, 59))).toBe("2026-12")
  })

  it("nomeMes escreve o mês por extenso com inicial maiúscula", () => {
    expect(nomeMes("2026-11")).toBe("Novembro de 2026")
  })
})

describe("datas", () => {
  it("paraInputData usa o dia local, mesmo perto da meia-noite", () => {
    expect(paraInputData(new Date(2026, 10, 5, 23, 59))).toBe("2026-11-05")
  })

  it("dataParaIso: outro dia vira meio-dia daquele dia", () => {
    const iso = dataParaIso("2020-03-10")
    expect(iso).toBe(new Date(2020, 2, 10, 12).toISOString())
  })

  it("dataParaIso: mantém a data original quando o dia não mudou", () => {
    const original = new Date(2020, 2, 10, 8, 30).toISOString()
    expect(dataParaIso("2020-03-10", original)).toBe(original)
  })

  it("dataParaIso: vazio significa agora (hoje)", () => {
    expect(paraInputData(dataParaIso(""))).toBe(hojeLocal())
  })

  it("rotuloData: HOJE, ONTEM e data por extenso", () => {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)

    expect(rotuloData(new Date())).toBe("HOJE")
    expect(rotuloData(ontem)).toBe("ONTEM")
    expect(rotuloData(new Date(2020, 0, 15, 12))).toContain("2020")
  })
})

describe("celulaCSV", () => {
  it("duplica aspas e envolve em aspas", () => {
    expect(celulaCSV('a"b')).toBe('"a""b"')
  })

  it("bloqueia fórmulas do Excel (= + - @)", () => {
    expect(celulaCSV("=1+1")).toBe(`"'=1+1"`)
    expect(celulaCSV("+55")).toBe(`"'+55"`)
    expect(celulaCSV("-2")).toBe(`"'-2"`)
    expect(celulaCSV("@x")).toBe(`"'@x"`)
  })

  it("aceita vazio e nulo", () => {
    expect(celulaCSV(null)).toBe('""')
    expect(celulaCSV(undefined)).toBe('""')
  })
})

describe("contar", () => {
  it("usa singular e plural", () => {
    expect(contar(1, "transação", "transações")).toBe("1 transação")
    expect(contar(0, "transação", "transações")).toBe("0 transações")
    expect(contar(3, "transação", "transações")).toBe("3 transações")
  })
})

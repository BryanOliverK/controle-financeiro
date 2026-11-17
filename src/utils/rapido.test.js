import { describe, it, expect } from "vitest"
import { interpretarRapido, lerNumero, normalizar, sugerirCategoria, sugestoesDescricao } from "./rapido"

const t = (id, descricao, tipo, categoria, valor, dia, extra = {}) => ({
  id, descricao, tipo, categoria, valor, data: new Date(2026, 10, dia, 12).toISOString(), ...extra
})

describe("lerNumero", () => {
  it("entende formatos brasileiros e simples", () => {
    expect(lerNumero("85")).toBe(85)
    expect(lerNumero("85,5")).toBe(85.5)
    expect(lerNumero("85.5")).toBe(85.5)
    expect(lerNumero("1.200")).toBe(1200)
    expect(lerNumero("1.200,50")).toBe(1200.5)
    expect(lerNumero("abc")).toBe(null)
  })
})

describe("interpretarRapido", () => {
  it("texto + valor vira saída", () => {
    expect(interpretarRapido("mercado 85")).toEqual({ ok: true, descricao: "Mercado", valor: 85, tipo: "saida" })
  })

  it("valor antes do texto, com R$ e vírgula", () => {
    const r = interpretarRapido("R$ 12,90 café com leite")
    expect(r).toEqual({ ok: true, descricao: "Café com leite", valor: 12.9, tipo: "saida" })
  })

  it("+ ou palavra de ganho vira entrada", () => {
    expect(interpretarRapido("+ freela site 1.500").tipo).toBe("entrada")
    expect(interpretarRapido("salário 3000").tipo).toBe("entrada")
    expect(interpretarRapido("recebi 50 do joão").tipo).toBe("entrada")
  })

  it("- força saída mesmo com palavra de ganho", () => {
    expect(interpretarRapido("- salário adiantado 100").tipo).toBe("saida")
  })

  it("pega o último número como valor e mantém os outros na descrição", () => {
    const r = interpretarRapido("uber 2 pessoas 30")
    expect(r.valor).toBe(30)
    expect(r.descricao).toBe("Uber 2 pessoas")
  })

  it("não confunde números colados em letras", () => {
    const r = interpretarRapido("plano 5g 99,90")
    expect(r.valor).toBe(99.9)
    expect(r.descricao).toBe("Plano 5g")
  })

  it("recusa o que não dá para lançar", () => {
    expect(interpretarRapido("").ok).toBe(false)
    expect(interpretarRapido("mercado").motivo).toBe("sem-valor")
    expect(interpretarRapido("85").motivo).toBe("sem-descricao")
    expect(interpretarRapido("mercado 0").motivo).toBe("valor-invalido")
    expect(interpretarRapido("mercado 99999999999").motivo).toBe("valor-invalido")
  })

  it("corta a descrição no limite do app", () => {
    const r = interpretarRapido("a".repeat(80) + " 10")
    expect(r.descricao.length).toBe(40)
  })
})

describe("sugerirCategoria", () => {
  const historico = [
    t(1, "Mercado", "saida", "casa", 50, 1, { contaId: "c1" }),
    t(2, "Mercado", "saida", "casa", 60, 2, { contaId: "c1" }),
    t(3, "Mercado", "saida", "alimentacao", 70, 3)
  ]

  it("usa o que você mais fez com essa descrição (ignora acentos e maiúsculas)", () => {
    expect(sugerirCategoria("mercado", "saida", historico)).toEqual({ categoria: "casa", contaId: "c1" })
    expect(sugerirCategoria("MÉRCADO", "saida", historico).categoria).toBe("casa")
  })

  it("sem histórico usa palavras comuns", () => {
    expect(sugerirCategoria("uber centro", "saida", []).categoria).toBe("transporte")
    expect(sugerirCategoria("netflix", "saida", []).categoria).toBe("lazer")
    expect(sugerirCategoria("salário", "entrada", []).categoria).toBe("salario")
  })

  it("categoria que só vale para entrada não é sugerida para saída", () => {
    expect(sugerirCategoria("salario", "saida", []).categoria).toBe("outros")
  })

  it("desconhecido cai em Outros; vazio não sugere nada", () => {
    expect(sugerirCategoria("xyz", "saida", []).categoria).toBe("outros")
    expect(sugerirCategoria("", "saida", [])).toEqual({ categoria: "", contaId: "" })
  })

  it("ignora transações de caixinha e de outro tipo", () => {
    const h = [t(1, "Mercado", "saida", "caixinha", 10, 1), t(2, "Mercado", "entrada", "outros", 10, 2)]
    expect(sugerirCategoria("mercado", "saida", h).categoria).toBe("alimentacao")
  })
})

describe("sugestoesDescricao", () => {
  const historico = [
    t(1, "Mercado", "saida", "alimentacao", 50, 1),
    t(2, "Mercado", "saida", "alimentacao", 85, 5),
    t(3, "Mercado Livre", "saida", "compras", 120, 3),
    t(4, "Padaria", "saida", "alimentacao", 12, 4),
    t(5, "Guardar", "saida", "caixinha", 100, 6)
  ]

  it("agrupa descrições iguais e traz os dados do lançamento mais recente", () => {
    const s = sugestoesDescricao("merc", historico)
    expect(s.map((x) => x.descricao)).toEqual(["Mercado", "Mercado Livre"])
    expect(s[0].valor).toBe(85)
  })

  it("busca sem acento e sem diferenciar maiúsculas; vazio não sugere", () => {
    expect(sugestoesDescricao("PADARIA", historico)).toHaveLength(1)
    expect(sugestoesDescricao("", historico)).toEqual([])
  })

  it("não sugere caixinha e respeita o limite", () => {
    expect(sugestoesDescricao("guard", historico)).toEqual([])
    expect(sugestoesDescricao("a", historico, 1)).toHaveLength(1)
  })
})

describe("normalizar", () => {
  it("tira acento, maiúscula e espaço sobrando", () => {
    expect(normalizar("  Açaí   Grande ")).toBe("acai grande")
  })
})

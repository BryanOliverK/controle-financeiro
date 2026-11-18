import { describe, it, expect } from "vitest"
import { validarTransacao } from "./validacao"

const ok = { descricao: "Almoço", valor: "25.90", tipo: "saida", categoria: "alimentacao" }

describe("validarTransacao", () => {
  it("aceita uma transação correta", () => {
    expect(validarTransacao(ok)).toBeNull()
  })

  it("exige descrição", () => {
    expect(validarTransacao({ ...ok, descricao: "   " })).toBe("Adicione uma descrição")
  })

  it("exige valor, e valor válido e positivo", () => {
    expect(validarTransacao({ ...ok, valor: "" })).toBe("Adicione um valor")
    expect(validarTransacao({ ...ok, valor: "abc" })).toBe("Adicione um valor válido")
    expect(validarTransacao({ ...ok, valor: "0" })).toBe("Adicione um valor válido")
    expect(validarTransacao({ ...ok, valor: "-5" })).toBe("Adicione um valor válido")
  })

  it("exige tipo e categoria", () => {
    expect(validarTransacao({ ...ok, tipo: "" })).toBe("Escolha se é entrada ou saída")
    expect(validarTransacao({ ...ok, categoria: "" })).toBe("Escolha uma categoria")
  })

  it("recusa categoria que não combina com o tipo", () => {
    expect(validarTransacao({ ...ok, tipo: "saida", categoria: "salario" }))
      .toBe("Essa categoria não combina com o tipo escolhido")
  })

  it("recusa categoria que não existe", () => {
    expect(validarTransacao({ ...ok, categoria: "inventada" }))
      .toBe("Essa categoria não combina com o tipo escolhido")
  })
})

import { describe, it, expect, afterEach } from "vitest"
import {
  CATEGORIAS, categoriaCompativel, categoriasPara, infoCategoria,
  limparCategoriasExtras, nomeCategoria, registrarCategorias, todasCategorias
} from "./categorias"

afterEach(() => registrarCategorias([]))

const academia = { id: "c_abc1", nome: "Academia", icone: "saude", cor: "#ef4444" }

describe("categorias do app", () => {
  it("salário só existe para entrada", () => {
    expect(categoriaCompativel("salario", "entrada")).toBe(true)
    expect(categoriaCompativel("salario", "saida")).toBe(false)
  })

  it("categorias 'ambos' servem para os dois tipos", () => {
    expect(categoriaCompativel("casa", "entrada")).toBe(true)
    expect(categoriaCompativel("casa", "saida")).toBe(true)
  })

  it("categoria desconhecida não é compatível", () => {
    expect(categoriaCompativel("xyz", "saida")).toBe(false)
  })

  it("caixinha tem nome próprio, mas não aparece para escolher", () => {
    expect(nomeCategoria("caixinha")).toBe("Caixinha")
    expect(categoriasPara("saida").some(([k]) => k === "caixinha")).toBe(false)
  })

  it("nomeCategoria devolve a própria chave se não conhecer", () => {
    expect(nomeCategoria("zzz")).toBe("zzz")
  })

  it("categoriasPara filtra pelo tipo", () => {
    const saida = categoriasPara("saida").map(([k]) => k)
    expect(saida).not.toContain("salario")
    expect(categoriasPara("entrada").map(([k]) => k)).toContain("salario")
  })
})

describe("categorias personalizadas", () => {
  it("registrar deixa a categoria disponível em todo lugar", () => {
    registrarCategorias([academia])
    expect(infoCategoria("c_abc1").nome).toBe("Academia")
    expect(todasCategorias()).toHaveLength(Object.keys(CATEGORIAS).length + 1)
    expect(categoriaCompativel("c_abc1", "entrada")).toBe(true)
    expect(categoriaCompativel("c_abc1", "saida")).toBe(true)
  })

  it("registrar de novo substitui a lista (remover some)", () => {
    registrarCategorias([academia])
    registrarCategorias([])
    expect(infoCategoria("c_abc1")).toBeNull()
  })

  it("limpa lixo: id inválido, repetido, nome vazio, cor inválida", () => {
    const r = limparCategoriasExtras([
      academia,
      { ...academia, nome: "duplicada" },
      { id: "xx", nome: "Ruim", cor: "#ffffff" },
      { id: "c_z9", nome: "   ", cor: "#ffffff" },
      { id: "c_k2", nome: "Cor ruim", cor: "vermelho" },
      null,
      "texto"
    ])
    expect(r.map((c) => c.id)).toEqual(["c_abc1"])
  })

  it("corta nome grande e troca ícone desconhecido por 'outros'", () => {
    const [c] = limparCategoriasExtras([{ id: "c_k1", nome: "A".repeat(50), icone: "hack", cor: "#00ff00" }])
    expect(c.nome).toHaveLength(20)
    expect(c.icone).toBe("outros")
  })

  it("entrada que não é lista vira lista vazia", () => {
    expect(limparCategoriasExtras(null)).toEqual([])
    expect(limparCategoriasExtras({})).toEqual([])
  })
})

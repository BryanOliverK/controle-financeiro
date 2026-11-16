import { describe, it, expect } from "vitest"
import {
  confirmouExclusao, iniciais, membroDesde, nomeDoProvedor, resumoDaConta, usaSenha, validarNomePerfil
} from "./perfil"

describe("iniciais", () => {
  it("nome completo, um nome, e-mail e vazio", () => {
    expect(iniciais("Maria da Silva", "m@x.com")).toBe("MS")
    expect(iniciais("  joão  ", "")).toBe("JO")
    expect(iniciais("", "ana@x.com")).toBe("A")
    expect(iniciais(null, null)).toBe("?")
    expect(iniciais(undefined, "  ")).toBe("?")
  })
})

describe("provedor", () => {
  it("identifica o tipo de login", () => {
    expect(nomeDoProvedor([{ providerId: "google.com" }])).toBe("Google")
    expect(nomeDoProvedor([{ providerId: "password" }])).toBe("E-mail e senha")
    expect(nomeDoProvedor([{ providerId: "google.com" }, { providerId: "password" }])).toBe("E-mail e senha")
    expect(nomeDoProvedor([])).toBe("Conta")
    expect(nomeDoProvedor(undefined)).toBe("Conta")
  })

  it("usaSenha", () => {
    expect(usaSenha([{ providerId: "password" }])).toBe(true)
    expect(usaSenha([{ providerId: "google.com" }])).toBe(false)
    expect(usaSenha(undefined)).toBe(false)
  })
})

describe("validações", () => {
  it("nome", () => {
    expect(validarNomePerfil("")).not.toBe("")
    expect(validarNomePerfil("   ")).not.toBe("")
    expect(validarNomePerfil("x".repeat(41))).not.toBe("")
    expect(validarNomePerfil("Maria")).toBe("")
    expect(validarNomePerfil("x".repeat(40))).toBe("")
  })

  it("confirmação de exclusão exige a palavra", () => {
    expect(confirmouExclusao("EXCLUIR")).toBe(true)
    expect(confirmouExclusao("  excluir ")).toBe(true)
    expect(confirmouExclusao("excluir tudo")).toBe(false)
    expect(confirmouExclusao("")).toBe(false)
    expect(confirmouExclusao(undefined)).toBe(false)
  })
})

describe("membroDesde", () => {
  it("formata mês e ano; lixo vira vazio", () => {
    expect(membroDesde(new Date(2026, 10, 12, 12).toISOString())).toContain("2026")
    expect(membroDesde("")).toBe("")
    expect(membroDesde("lixo")).toBe("")
    expect(membroDesde(undefined)).toBe("")
  })
})

describe("resumoDaConta", () => {
  it("conta só o visível, soma caixinhas em centavos e dívidas em aberto", () => {
    const r = resumoDaConta({
      transacoes: [{ id: "1" }, { id: "2", oculta: true }, { id: "3" }],
      caixinhas: [{ saldo: 0.1 }, { saldo: 0.2 }, { saldo: 100 }],
      contas: [{}, {}],
      cartoes: [{}],
      dividas: [
        { valor: 100, pagamentos: [{ valor: 100 }] },
        { valor: 50, pagamentos: [{ valor: 10 }] },
        { valor: 20, pagamentos: [] }
      ]
    })
    expect(r).toEqual({ transacoes: 2, caixinhas: 3, guardado: 100.3, contas: 2, cartoes: 1, dividasAbertas: 2 })
  })

  it("sem dados", () => {
    expect(resumoDaConta({})).toEqual({ transacoes: 0, caixinhas: 0, guardado: 0, contas: 0, cartoes: 0, dividasAbertas: 0 })
  })
})

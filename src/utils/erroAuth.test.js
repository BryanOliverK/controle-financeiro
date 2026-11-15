import { describe, it, expect } from "vitest"
import { mensagemErroAuth } from "./erroAuth"

describe("mensagemErroAuth", () => {
  it("traduz os erros comuns", () => {
    expect(mensagemErroAuth("auth/invalid-credential")).toBe("E-mail ou senha incorretos.")
    expect(mensagemErroAuth("auth/email-already-in-use")).toContain("Já existe uma conta")
    expect(mensagemErroAuth("auth/weak-password")).toContain("6 caracteres")
  })

  it("não revela se o e-mail existe: usuário inexistente e senha errada têm a mesma mensagem", () => {
    expect(mensagemErroAuth("auth/user-not-found")).toBe(mensagemErroAuth("auth/wrong-password"))
  })

  it("erro desconhecido tem mensagem genérica", () => {
    expect(mensagemErroAuth("auth/qualquer-coisa")).toBe("Não foi possível concluir. Tente novamente.")
    expect(mensagemErroAuth(undefined)).toBe("Não foi possível concluir. Tente novamente.")
  })
})

import { describe, it, expect } from "vitest"
import { estadoNuvem, mensagemErroNuvem } from "./nuvem"

describe("mensagemErroNuvem", () => {
  it("traduz os códigos do Firestore (com ou sem prefixo)", () => {
    expect(mensagemErroNuvem("permission-denied")).toContain("regras")
    expect(mensagemErroNuvem("firestore/unavailable")).toContain("Sem conexão")
    expect(mensagemErroNuvem("invalid-argument")).toContain("1 MB")
  })

  it("código desconhecido ou vazio vira mensagem genérica", () => {
    expect(mensagemErroNuvem("xyz")).toContain("Não foi possível")
    expect(mensagemErroNuvem(undefined)).toContain("Não foi possível")
  })
})

describe("estadoNuvem", () => {
  it("tudo certo: sincronizado", () => {
    expect(estadoNuvem().estado).toBe("ok")
  })

  it("enviando e sem conexão", () => {
    expect(estadoNuvem({ enviando: true }).estado).toBe("enviando")
    const off = estadoNuvem({ online: false, enviando: true })
    expect(off.estado).toBe("offline")
    expect(off.podeTentar).toBe(false)
  })

  it("erro tem prioridade e permite tentar de novo", () => {
    const e = estadoNuvem({ online: false, enviando: true, erroEnvio: "falhou" })
    expect(e.estado).toBe("erro")
    expect(e.detalhe).toBe("falhou")
    expect(e.podeTentar).toBe(true)
    expect(estadoNuvem({ erroEscuta: "x" }).texto).toBe("Sem atualizações")
  })
})

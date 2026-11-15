import { describe, it, expect } from "vitest"
import { lerBackup } from "./backup"

// Arquivo falso com o mesmo formato que o navegador entrega
const arquivo = (conteudo, tamanho) => {
  const texto = typeof conteudo === "string" ? conteudo : JSON.stringify(conteudo)
  return { size: tamanho ?? texto.length, text: async () => texto }
}

const falha = async (promessa) => {
  try {
    await promessa
  } catch (erro) {
    return erro
  }
  return null
}

const data = new Date(2026, 10, 10, 12).toISOString()
const transacao = { id: "1", descricao: "Mercado", valor: 10, tipo: "saida", categoria: "casa", data }
const caixinha = { id: "c1", nome: "Viagem", saldo: 100 }

describe("lerBackup", () => {
  it("lê um backup válido", async () => {
    const r = await lerBackup(arquivo({ transacoes: [transacao], caixinhas: [caixinha] }))
    expect(r.transacoes).toHaveLength(1)
    expect(r.caixinhas[0].nome).toBe("Viagem")
    expect(r.orcamentos).toEqual({})
    expect(r.recorrentes).toEqual([])
    expect(r.cartoes).toEqual([])
    expect(r.faturasPagas).toEqual([])
  })

  it("mantém os campos novos (parcela, oculta, cartão) e descarta campos estranhos", () => {
    return lerBackup(arquivo({
      transacoes: [{
        ...transacao,
        parcela: { n: 1, total: 3, grupo: "g" },
        oculta: true,
        cartaoId: "n",
        invasor: "<script>"
      }],
      caixinhas: []
    })).then((r) => {
      const t = r.transacoes[0]
      expect(t.parcela).toEqual({ n: 1, total: 3, grupo: "g" })
      expect(t.oculta).toBe(true)
      expect(t.cartaoId).toBe("n")
      expect(t.invasor).toBeUndefined()
    })
  })

  it("lê backup antigo, sem orçamentos nem cartões", async () => {
    const r = await lerBackup(arquivo({ transacoes: [], caixinhas: [] }))
    expect(r.transacoes).toEqual([])
  })

  it("limpa orçamentos, categorias e cartões inválidos vindos do arquivo", async () => {
    const r = await lerBackup(arquivo({
      transacoes: [], caixinhas: [],
      orcamentos: { casa: 100, lixo: -1 },
      categoriasExtras: [{ id: "ruim", nome: "x", cor: "#fff" }],
      cartoes: [{ id: "n", nome: "Nubank", fechamento: 10, vencimento: 17 }, { id: "x", nome: "Ruim", fechamento: 99, vencimento: 1 }],
      faturasPagas: ["n|2026-11", "lixo"]
    }))
    expect(r.orcamentos).toEqual({ casa: 100 })
    expect(r.categoriasExtras).toEqual([])
    expect(r.cartoes.map((c) => c.id)).toEqual(["n"])
    expect(r.faturasPagas).toEqual(["n|2026-11"])
  })

  it("recusa arquivo que não é JSON", async () => {
    const erro = await falha(lerBackup(arquivo("isto não é json")))
    expect(erro.message).toBe("Esse arquivo não é um backup válido.")
  })

  it("recusa JSON que não parece backup do app", async () => {
    const erro = await falha(lerBackup(arquivo({ qualquer: "coisa" })))
    expect(erro.message).toBe("Esse arquivo não parece ser um backup do app.")
  })

  it("recusa transação com formato inesperado", async () => {
    const erro = await falha(lerBackup(arquivo({ transacoes: [{ ...transacao, valor: "dez" }], caixinhas: [] })))
    expect(erro.message).toBe("O backup tem dados em um formato inesperado.")
  })

  it("recusa transação com data inválida ou tipo desconhecido", async () => {
    expect((await falha(lerBackup(arquivo({ transacoes: [{ ...transacao, data: "ontem" }], caixinhas: [] })))).message)
      .toBe("O backup tem dados em um formato inesperado.")
    expect((await falha(lerBackup(arquivo({ transacoes: [{ ...transacao, tipo: "outro" }], caixinhas: [] })))).message)
      .toBe("O backup tem dados em um formato inesperado.")
  })

  it("recusa arquivo grande demais", async () => {
    const erro = await falha(lerBackup(arquivo({ transacoes: [], caixinhas: [] }, 6 * 1024 * 1024)))
    expect(erro.message).toBe("Esse arquivo é grande demais para ser um backup.")
  })
})

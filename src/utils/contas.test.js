import { describe, it, expect } from "vitest"
import {
  contarSemConta, infoConta, limparContas, limparTransferencias, registrarContas,
  saldoConta, saldoSemConta, semConta, totalContas, validarConta, validarTransferencia
} from "./contas"

const iso = (d) => new Date(2026, 10, d, 12).toISOString()
const conta = (extra = {}) => ({ id: "c1", nome: "Nubank", tipo: "banco", saldoInicial: 0, cor: "#3b82f6", ...extra })
const t = (id, tipo, valor, extra = {}) => ({ id, descricao: id, valor, tipo, categoria: "outros", data: iso(1), ...extra })

describe("limparContas", () => {
  it("aceita conta boa e normaliza", () => {
    const [c] = limparContas([{ id: "a", nome: "  Carteira ", tipo: "carteira", saldoInicial: 10.005, cor: "#aabbcc" }])
    expect(c.nome).toBe("Carteira")
    expect(c.saldoInicial).toBe(10.01)
    expect(c.cor).toBe("#aabbcc")
  })

  it("tipo e cor inválidos viram padrão; saldo inválido vira 0", () => {
    const [c] = limparContas([{ id: "a", nome: "X", tipo: "xx", saldoInicial: "10", cor: "vermelho" }])
    expect(c.tipo).toBe("banco")
    expect(c.saldoInicial).toBe(0)
    expect(c.cor).toBe("#3b82f6")
  })

  it("rejeita lixo e ids repetidos", () => {
    const r = limparContas([null, "x", {}, { id: "", nome: "A" }, { id: "a", nome: " " }, { id: "ok", nome: "A" }, { id: "ok", nome: "B" }])
    expect(r.map((c) => c.id)).toEqual(["ok"])
    expect(limparContas(undefined)).toEqual([])
  })

  it("corta nome longo", () => {
    expect(limparContas([{ id: "a", nome: "x".repeat(60) }])[0].nome.length).toBe(20)
  })
})

describe("limparTransferencias", () => {
  const ok = { id: "t", de: "a", para: "b", valor: 50, data: iso(2), nota: " pix " }

  it("aceita e normaliza", () => {
    const [x] = limparTransferencias([ok])
    expect(x.nota).toBe("pix")
    expect(x.valor).toBe(50)
  })

  it("rejeita mesma conta, valor ruim, data ruim e repetidas", () => {
    const r = limparTransferencias([
      { ...ok, id: "1", para: "a" }, { ...ok, id: "2", valor: 0 }, { ...ok, id: "3", valor: -1 },
      { ...ok, id: "4", data: "lixo" }, { ...ok, id: "5", de: "" }, ok, ok, null
    ])
    expect(r.map((x) => x.id)).toEqual(["t"])
  })
})

describe("saldos", () => {
  const transacoes = [
    t("1", "entrada", 1000, { contaId: "c1" }),
    t("2", "saida", 250.5, { contaId: "c1" }),
    t("3", "saida", 100, { contaId: "c2" }),
    t("4", "entrada", 40),
    t("5", "saida", 15, { contaId: "c1", oculta: true }),
    t("6", "saida", 5, { contaId: "apagada" })
  ]
  const contas = [conta({ saldoInicial: 100 }), conta({ id: "c2", nome: "Carteira", saldoInicial: 0 })]

  it("saldo = inicial + entradas - saídas (ignora ocultas e outras contas)", () => {
    expect(saldoConta(contas[0], transacoes)).toBe(849.5)
    expect(saldoConta(contas[1], transacoes)).toBe(-100)
  })

  it("transferências movem entre contas e não mudam o total", () => {
    const trs = [{ id: "x", de: "c1", para: "c2", valor: 300, data: iso(3), nota: "" }]
    expect(saldoConta(contas[0], transacoes, trs)).toBe(549.5)
    expect(saldoConta(contas[1], transacoes, trs)).toBe(200)
    expect(totalContas(contas, transacoes, trs)).toBe(totalContas(contas, transacoes, []))
  })

  it("sem erro de ponto flutuante", () => {
    const c = conta({ saldoInicial: 0.1 })
    expect(saldoConta(c, [t("a", "entrada", 0.2, { contaId: "c1" })])).toBe(0.3)
  })

  it("sem conta: transações sem conta ou de conta que não existe mais", () => {
    expect(saldoSemConta(transacoes, contas)).toBe(35)
    expect(contarSemConta(transacoes, contas)).toBe(2)
  })

  it("caixinha não conta como 'sem conta'", () => {
    expect(contarSemConta([t("c", "saida", 10, { categoria: "caixinha" })], contas)).toBe(0)
  })
})

describe("registro e semConta", () => {
  it("registra e acha por id", () => {
    registrarContas([conta()])
    expect(infoConta("c1").nome).toBe("Nubank")
    expect(infoConta("zz")).toBe(null)
    registrarContas([])
    expect(infoConta("c1")).toBe(null)
  })

  it("semConta tira só o contaId", () => {
    const r = semConta({ id: "1", contaId: "c1", valor: 5 })
    expect(r).toEqual({ id: "1", valor: 5 })
  })
})

describe("validações", () => {
  const contas = [conta()]

  it("validarConta", () => {
    expect(validarConta({ nome: " " }, [])).not.toBe("")
    expect(validarConta({ nome: "nubank" }, contas)).not.toBe("")
    expect(validarConta({ nome: "nubank" }, contas, "c1")).toBe("")
    expect(validarConta({ nome: "Inter", saldoInicial: "abc" }, contas)).not.toBe("")
    expect(validarConta({ nome: "Inter", saldoInicial: "-50.5" }, contas)).toBe("")
    expect(validarConta({ nome: "Inter", saldoInicial: "" }, contas)).toBe("")
  })

  it("validarTransferencia", () => {
    const duas = [conta(), conta({ id: "c2", nome: "B" })]
    expect(validarTransferencia({ de: "c1", para: "c2", valor: "10" }, duas)).toBe("")
    expect(validarTransferencia({ de: "c1", para: "c1", valor: "10" }, duas)).not.toBe("")
    expect(validarTransferencia({ de: "c1", para: "zz", valor: "10" }, duas)).not.toBe("")
    expect(validarTransferencia({ de: "", para: "c2", valor: "10" }, duas)).not.toBe("")
    expect(validarTransferencia({ de: "c1", para: "c2", valor: "0" }, duas)).not.toBe("")
    expect(validarTransferencia({ de: "c1", para: "c2", valor: "" }, duas)).not.toBe("")
    expect(validarTransferencia({ de: "c1", para: "c2", valor: "x" }, duas)).not.toBe("")
  })
})

import { describe, it, expect } from "vitest"
import { calcularPrevisao } from "./previsao"

const d = (m, dia) => new Date(2026, m - 1, dia, 12).toISOString()
const hoje = new Date(2026, 10, 15, 10) // 15/11, mês com 30 dias

const base = [
  { id: "s", descricao: "Salário", valor: 3000, tipo: "entrada", categoria: "salario", data: d(11, 1) },
  { id: "a", descricao: "Mercado", valor: 300, tipo: "saida", categoria: "casa", data: d(11, 5) },
  { id: "rec-x-2026-11", descricao: "Aluguel", valor: 1000, tipo: "saida", categoria: "casa", data: d(11, 5) },
  { id: "p", descricao: "Sofá", valor: 200, tipo: "saida", categoria: "casa", data: d(11, 28), parcela: { n: 1, total: 2, grupo: "z" } },
  { id: "q", descricao: "Mês anterior", valor: 500, tipo: "saida", categoria: "casa", data: d(10, 2) },
  { id: "c", descricao: "Guardado", valor: 50, tipo: "saida", categoria: "caixinha", data: d(11, 3) }
]

describe("calcularPrevisao", () => {
  it("saldo de hoje considera só o que já aconteceu", () => {
    expect(calcularPrevisao(base, [], hoje).saldoHoje).toBe(1150)
  })

  it("projeta o gasto do dia a dia no ritmo atual, sem contar fixos nem caixinha", () => {
    const r = calcularPrevisao(base, [], hoje)
    // variável até hoje: só o mercado (300) → 20/dia × 15 dias restantes
    expect(r.ritmoDiario).toBe(20)
    expect(r.gastoProjetado).toBe(300)
    expect(r.diasRestantes).toBe(15)
  })

  it("saldo previsto = saldo até o fim do mês − pendentes − projeção", () => {
    const mensais = [{ id: "y", descricao: "Curso", valor: 100, tipo: "saida", dia: 25, proximoMes: "2026-11" }]
    const r = calcularPrevisao(base, mensais, hoje)
    // 3000−300−1000−200−500−50 = 950 ; −100 (mensal pendente) −300 (ritmo) = 550
    expect(r.saldoPrevisto).toBe(550)
    expect(r.saidasPendentes).toBe(100)
  })

  it("entradas mensais pendentes aumentam a previsão", () => {
    const mensais = [{ id: "y", descricao: "Freela", valor: 400, tipo: "entrada", dia: 25, proximoMes: "2026-11" }]
    const sem = calcularPrevisao(base, [], hoje).saldoPrevisto
    const com = calcularPrevisao(base, mensais, hoje)
    expect(com.entradasPendentes).toBe(400)
    expect(com.saldoPrevisto).toBe(sem + 400)
  })

  it("mensal de outro mês não entra", () => {
    const mensais = [{ id: "y", descricao: "Curso", valor: 100, tipo: "saida", dia: 25, proximoMes: "2026-12" }]
    expect(calcularPrevisao(base, mensais, hoje).saidasPendentes).toBe(0)
  })

  it("nos primeiros dias do mês não projeta (poucos dados)", () => {
    const r = calcularPrevisao(base, [], new Date(2026, 10, 2, 10))
    expect(r.dadosSuficientes).toBe(false)
    expect(r.gastoProjetado).toBe(0)
  })

  it("sem nenhuma transação tudo é zero", () => {
    const r = calcularPrevisao([], [], hoje)
    expect(r.saldoHoje).toBe(0)
    expect(r.saldoPrevisto).toBe(0)
  })
})

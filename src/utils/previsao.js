// Previsão do mês: quanto deve sobrar (ou faltar) no fim do mês atual.
//
// Parte do saldo até o fim do mês (que já inclui parcelas e lançamentos com data
// futura dentro dele) e soma o que ainda vai acontecer: lançamentos mensais que
// ainda não caíram e o gasto do dia a dia no ritmo que você vem tendo.
// É uma estimativa, não uma garantia.

import { calcularResumo } from "./calculos"
import { chaveMes } from "./formatar"

const MIN_DIAS_PARA_PROJETAR = 3

// Gasto "do dia a dia": exclui o que é fixo (mensais e parcelas) e caixinhas
function ehGastoVariavel(t) {
  return (
    t.tipo === "saida" &&
    t.categoria !== "caixinha" &&
    !t.parcela &&
    !String(t.id).startsWith("rec-")
  )
}

export function calcularPrevisao(transacoes, recorrentes, hoje = new Date()) {
  const ano = hoje.getFullYear()
  const mes0 = hoje.getMonth()
  const diaHoje = hoje.getDate()
  const diasNoMes = new Date(ano, mes0 + 1, 0).getDate()
  const diasRestantes = diasNoMes - diaHoje

  const mesAtual = chaveMes(hoje)
  const fimDeHoje = new Date(ano, mes0, diaHoje, 23, 59, 59, 999)
  const fimDoMes = new Date(ano, mes0 + 1, 0, 23, 59, 59, 999)

  const ate = (limite) => transacoes.filter((t) => new Date(t.data) <= limite)

  const saldoHoje = calcularResumo(ate(fimDeHoje)).saldo
  const saldoFimDoMes = calcularResumo(ate(fimDoMes)).saldo

  // Gasto do dia a dia neste mês, até hoje
  let variavelCentavos = 0

  for (const t of transacoes) {
    if (ehGastoVariavel(t) && chaveMes(t.data) === mesAtual && new Date(t.data) <= fimDeHoje) {
      variavelCentavos += Math.round(t.valor * 100)
    }
  }

  const dadosSuficientes = diaHoje >= MIN_DIAS_PARA_PROJETAR && variavelCentavos > 0
  const ritmoDiario = variavelCentavos / 100 / diaHoje
  const gastoProjetado = dadosSuficientes
    ? Math.round(ritmoDiario * diasRestantes * 100) / 100
    : 0

  // Lançamentos mensais que ainda vão cair neste mês
  let entradasPendentes = 0
  let saidasPendentes = 0

  for (const r of recorrentes) {
    if (r.proximoMes === mesAtual) {
      const centavos = Math.round(r.valor * 100)

      if (r.tipo === "entrada") {
        entradasPendentes += centavos
      } else {
        saidasPendentes += centavos
      }
    }
  }

  entradasPendentes /= 100
  saidasPendentes /= 100

  const saldoPrevisto =
    Math.round((saldoFimDoMes + entradasPendentes - saidasPendentes - gastoProjetado) * 100) / 100

  return {
    saldoHoje,
    saldoPrevisto,
    diasRestantes,
    ritmoDiario,
    gastoProjetado,
    entradasPendentes,
    saidasPendentes,
    dadosSuficientes
  }
}

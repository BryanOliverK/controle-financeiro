// Compra parcelada: o valor total é dividido em N lançamentos, um por mês.
//
// A divisão é feita em centavos; a sobra (ex.: 100,00 em 3x = 33,33 + 33,33 +
// 33,34) vai para a última parcela, então a soma bate sempre com o total.

import { novoId } from "./formatar"

export const MAX_PARCELAS = 48

// Soma meses mantendo o dia (dia 31 em fevereiro vira o último dia do mês)
function somarMeses(dataIso, meses) {
  const data = new Date(dataIso)
  const dia = data.getDate()
  const alvo = new Date(data.getFullYear(), data.getMonth() + meses, 1,
    data.getHours(), data.getMinutes(), data.getSeconds())
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate()

  alvo.setDate(Math.min(dia, ultimoDia))
  return alvo
}

// Valores de cada parcela, em reais: dividirEmParcelas(100, 3) -> [33.33, 33.33, 33.34]
export function dividirEmParcelas(total, quantidade) {
  const centavos = Math.round(total * 100)
  const base = Math.floor(centavos / quantidade)
  const valores = Array(quantidade).fill(base)

  valores[quantidade - 1] += centavos - base * quantidade

  return valores.map((c) => c / 100)
}

// Cria as transações de uma compra parcelada. A parcela 1 fica na data
// informada e as seguintes nos meses seguintes. "parcela" guarda a posição.
export function gerarParcelas({ descricao, valorTotal, tipo, categoria }, dataIso, quantidade) {
  const grupo = novoId()
  const valores = dividirEmParcelas(valorTotal, quantidade)

  return valores.map((valor, i) => ({
    id: `parc-${grupo}-${i + 1}`,
    descricao,
    valor,
    tipo,
    categoria,
    data: somarMeses(dataIso, i).toISOString(),
    parcela: { n: i + 1, total: quantidade, grupo }
  }))
}

// Aceita só parcela bem formada (vem de nuvem/backup)
export function limparParcela(p) {
  if (
    p && typeof p === "object" &&
    Number.isInteger(p.n) && Number.isInteger(p.total) &&
    p.n >= 1 && p.total >= 2 && p.total <= MAX_PARCELAS && p.n <= p.total &&
    typeof p.grupo === "string"
  ) {
    return { n: p.n, total: p.total, grupo: p.grupo }
  }

  return null
}

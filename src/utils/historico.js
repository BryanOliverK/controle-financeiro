// Limpeza do histórico por mês. Duas etapas, para ninguém perder dados sem querer:
//   1) Ocultar: a transação ganha "oculta: true". Some das listas e dos totais,
//      mas continua guardada e dá para restaurar.
//   2) Excluir de vez: só vale para o que já está oculto.
//
// Movimentações de caixinha ficam de fora por padrão: tirá-las do histórico
// bagunçaria o saldo, porque o valor guardado continua dentro da caixinha.

import { chaveMes } from "./formatar"

function entra(t, { ocultas, incluirCaixinha }) {
  if (Boolean(t.oculta) !== ocultas) {
    return false
  }

  return incluirCaixinha || t.categoria !== "caixinha"
}

// [{ mes: "2026-11", ano: "2026", quantidade }], do mês mais novo para o mais antigo
export function resumirPorMes(transacoes, opcoes) {
  const contagem = new Map()

  for (const t of transacoes) {
    if (entra(t, opcoes)) {
      const mes = chaveMes(t.data)
      contagem.set(mes, (contagem.get(mes) || 0) + 1)
    }
  }

  return [...contagem.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([mes, quantidade]) => ({ mes, ano: mes.slice(0, 4), quantidade }))
}

// Ids das transações dos meses escolhidos
export function idsDosMeses(transacoes, meses, opcoes) {
  const escolhidos = new Set(meses)

  return transacoes
    .filter((t) => entra(t, opcoes) && escolhidos.has(chaveMes(t.data)))
    .map((t) => t.id)
}

// Quantas movimentações de caixinha ficam de fora nos meses escolhidos
export function contarCaixinhas(transacoes, meses) {
  const escolhidos = new Set(meses)

  return transacoes.filter(
    (t) => !t.oculta && t.categoria === "caixinha" && escolhidos.has(chaveMes(t.data))
  ).length
}

// Cópia da transação sem a marca de oculta (usada ao restaurar)
export function semOculta(t) {
  const copia = { ...t }
  delete copia.oculta
  return copia
}

// Meses com as transações de cada um (mais novas primeiro):
// [{ mes: "2026-11", ano: "2026", itens: [transação, ...] }]
export function agruparPorMes(transacoes, opcoes) {
  const grupos = new Map()

  for (const t of transacoes) {
    if (entra(t, opcoes)) {
      const mes = chaveMes(t.data)

      if (!grupos.has(mes)) {
        grupos.set(mes, [])
      }

      grupos.get(mes).push(t)
    }
  }

  return [...grupos.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([mes, itens]) => ({
      mes,
      ano: mes.slice(0, 4),
      itens: itens.sort((a, b) => new Date(b.data) - new Date(a.data))
    }))
}

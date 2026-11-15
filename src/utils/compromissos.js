// Compromissos futuros: tudo que ainda vai ser cobrado (ou recebido) nos
// próximos meses, em ordem de data.
//
// Fontes: faturas de cartão ainda não pagas, parcelas e lançamentos com data
// futura (fora do cartão, para não contar duas vezes) e lançamentos mensais.

import { agruparFaturas, chaveFatura, inicioDoDia } from "./cartoes"
import { chaveMes } from "./formatar"

export const MESES_A_FRENTE = 6

function dataDoMes(chave, dia) {
  const [ano, mes] = chave.split("-").map(Number)
  const ultimo = new Date(ano, mes, 0).getDate()
  return new Date(ano, mes - 1, Math.min(dia, ultimo), 12)
}

function somarMes(chave) {
  const [ano, mes] = chave.split("-").map(Number)
  return mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, "0")}`
}

// [{ id, data, titulo, detalhe, valor, tipo, origem, atrasada }]
// origem: "fatura" | "parcela" | "lancamento" | "recorrente"
export function listarCompromissos({ transacoes, recorrentes, cartoes, faturasPagas }, hoje = new Date(), meses = MESES_A_FRENTE) {
  const dia = inicioDoDia(hoje)
  const limite = new Date(hoje.getFullYear(), hoje.getMonth() + meses + 1, 0, 23, 59, 59)
  const fimDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999)
  const pagas = new Set(faturasPagas)
  const itens = []

  // Faturas ainda não pagas
  for (const cartao of cartoes) {
    for (const f of agruparFaturas(cartao, transacoes)) {
      if (f.total <= 0 || pagas.has(chaveFatura(cartao.id, f.chave)) || f.vence > limite) {
        continue
      }

      itens.push({
        id: `fatura-${cartao.id}-${f.chave}`,
        data: f.vence,
        titulo: `Fatura ${cartao.nome}`,
        detalhe: `${f.itens.length} ${f.itens.length === 1 ? "compra" : "compras"}`,
        valor: f.total,
        tipo: "saida",
        origem: "fatura",
        atrasada: f.vence < dia,
        cartaoId: cartao.id,
        chaveFatura: f.chave
      })
    }
  }

  // Parcelas e lançamentos com data futura (fora do cartão)
  for (const t of transacoes) {
    const data = new Date(t.data)

    if (t.oculta || t.cartaoId || t.categoria === "caixinha" || data <= fimDeHoje || data > limite) {
      continue
    }

    itens.push({
      id: `futuro-${t.id}`,
      data,
      titulo: t.descricao,
      detalhe: t.parcela ? `Parcela ${t.parcela.n}/${t.parcela.total}` : "",
      valor: t.valor,
      tipo: t.tipo,
      origem: t.parcela ? "parcela" : "lancamento",
      atrasada: false
    })
  }

  // Lançamentos mensais que ainda vão cair
  for (const r of recorrentes) {
    let mes = r.proximoMes

    for (let i = 0; i < 120; i++) {
      const data = dataDoMes(mes, r.dia)

      if (data > limite) {
        break
      }

      if (data >= dia) {
        itens.push({
          id: `rec-${r.id}-${mes}`,
          data,
          titulo: r.descricao,
          detalhe: "Todo mês",
          valor: r.valor,
          tipo: r.tipo,
          origem: "recorrente",
          atrasada: false
        })
      }

      mes = somarMes(mes)
    }
  }

  return itens.sort((a, b) => a.data - b.data)
}

// [{ mes: "2026-12", itens, saidas, entradas }]
export function agruparCompromissosPorMes(itens) {
  const grupos = new Map()

  for (const item of itens) {
    const mes = chaveMes(item.data)

    if (!grupos.has(mes)) {
      grupos.set(mes, { mes, itens: [], saidas: 0, entradas: 0 })
    }

    const g = grupos.get(mes)
    g.itens.push(item)

    if (item.tipo === "entrada") {
      g.entradas += Math.round(item.valor * 100) / 100
    } else {
      g.saidas += Math.round(item.valor * 100) / 100
    }
  }

  return [...grupos.values()]
}

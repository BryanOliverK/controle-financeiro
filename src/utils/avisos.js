// Avisos da aba "Avisos". São calculados na hora a partir dos seus dados
// (nada é guardado, a não ser quais você já marcou como lido).
//
// Cada aviso tem um id que muda quando a situação muda (ex.: "vence em 3 dias"
// vira "vence amanhã"), então um aviso lido volta a aparecer quando fica mais urgente.

import { agruparFaturas, chaveFatura, diasAte, statusFatura } from "./cartoes"
import { listarCompromissos } from "./compromissos"
import { brl, chaveMes } from "./formatar"
import { nomeCategoria } from "./categorias"
import { gastoDaCategoria, statusOrcamento } from "./orcamentos"
import { NOVIDADES } from "../novidades"

const DIAS_DE_ANTECEDENCIA = 3
const MAX_LIDOS = 300

const RANK = { urgente: 0, alerta: 1, info: 2 }

export function quando(dias) {
  if (dias === 0) return "hoje"
  if (dias === 1) return "amanhã"
  return `em ${dias} dias`
}

const dataCurta = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })

// Aceita só ids de texto (vem da nuvem)
export function limparAvisosLidos(bruto) {
  if (!Array.isArray(bruto)) {
    return []
  }

  const validos = bruto.filter((x) => typeof x === "string" && x !== "" && x.length <= 120)
  return [...new Set(validos)].slice(-MAX_LIDOS)
}

// [{ id, nivel: "urgente"|"alerta"|"info", tipo, titulo, texto, destino, ordem }]
export function gerarAvisos({ transacoes, recorrentes, cartoes, faturasPagas, orcamentos, previsao }, hoje = new Date()) {

  const avisos = []
  const pagas = new Set(faturasPagas)
  const mes = chaveMes(hoje)

  // ----- Faturas de cartão -----
  for (const cartao of cartoes) {
    for (const f of agruparFaturas(cartao, transacoes)) {
      if (f.total <= 0 || pagas.has(chaveFatura(cartao.id, f.chave))) {
        continue
      }

      const base = `${cartao.id}-${f.chave}`
      const diasVence = diasAte(f.vence, hoje)
      const diasFecha = diasAte(f.fecha, hoje)

      if (diasVence < 0) {
        const atraso = -diasVence

        avisos.push({
          id: `fatura-vencida-${base}`,
          nivel: "urgente",
          tipo: "fatura",
          titulo: `Fatura ${cartao.nome} vencida`,
          texto: `Venceu em ${dataCurta(f.vence)} (há ${atraso} ${atraso === 1 ? "dia" : "dias"}). Valor: ${brl(f.total)}. Se já pagou, marque como paga em Planejar.`,
          destino: "planejar",
          ordem: diasVence
        })
      } else if (diasVence <= DIAS_DE_ANTECEDENCIA) {
        avisos.push({
          id: `fatura-vence-${base}-${diasVence}`,
          nivel: diasVence <= 1 ? "urgente" : "alerta",
          tipo: "fatura",
          titulo: `Fatura ${cartao.nome} vence ${quando(diasVence)}`,
          texto: `${brl(f.total)} · vencimento dia ${dataCurta(f.vence)}. Depois de pagar, marque como paga em Planejar.`,
          destino: "planejar",
          ordem: diasVence
        })
      } else if (statusFatura(f, false, hoje) === "aberta" && diasFecha >= 0 && diasFecha <= 2) {
        avisos.push({
          id: `fatura-fecha-${base}-${diasFecha}`,
          nivel: "info",
          tipo: "fatura",
          titulo: `Fatura ${cartao.nome} fecha ${quando(diasFecha)}`,
          texto: `Até agora: ${brl(f.total)}. Compras feitas depois do fechamento entram na fatura seguinte.`,
          destino: "planejar",
          ordem: 100 + diasFecha
        })
      }
    }
  }

  // ----- Parcelas e lançamentos mensais dos próximos dias (faturas já têm aviso próprio) -----
  const proximos = listarCompromissos({ transacoes, recorrentes, cartoes, faturasPagas }, hoje, 1)

  for (const item of proximos) {
    if (item.origem === "fatura") {
      continue
    }

    const dias = diasAte(item.data, hoje)

    if (dias < 0 || dias > DIAS_DE_ANTECEDENCIA) {
      continue
    }

    avisos.push({
      id: `comp-${item.id}-${dias}`,
      nivel: dias <= 1 ? "alerta" : "info",
      tipo: "compromisso",
      titulo: `${item.titulo} ${item.tipo === "entrada" ? "entra" : "vence"} ${quando(dias)}`,
      texto: `${item.tipo === "entrada" ? "+" : "-"}${brl(item.valor)} · dia ${dataCurta(item.data)}${item.detalhe ? ` · ${item.detalhe}` : ""}`,
      destino: "planejar",
      ordem: 50 + dias
    })
  }

  // ----- Orçamentos do mês -----
  for (const [categoria, limite] of Object.entries(orcamentos)) {
    const gasto = gastoDaCategoria(transacoes, categoria, mes)
    const status = statusOrcamento(gasto, limite)

    if (!status || status.nivel === "ok") {
      continue
    }

    const nome = nomeCategoria(categoria)

    avisos.push(
      status.nivel === "estourado"
        ? {
            id: `orcamento-${categoria}-${mes}-estourado`,
            nivel: "urgente",
            tipo: "orcamento",
            titulo: `Orçamento de ${nome} estourado`,
            texto: `Você gastou ${brl(gasto)} de ${brl(limite)} neste mês.`,
            destino: "graficos",
            ordem: 10
          }
        : {
            id: `orcamento-${categoria}-${mes}-alerta`,
            nivel: "alerta",
            tipo: "orcamento",
            titulo: `${nome}: ${Math.floor(status.porcentagem)}% do orçamento`,
            texto: `Restam ${brl(status.restante)} neste mês.`,
            destino: "graficos",
            ordem: 20
          }
    )
  }

  // ----- Previsão no vermelho -----
  if (previsao && previsao.saldoPrevisto < 0) {
    avisos.push({
      id: `previsao-${mes}`,
      nivel: "alerta",
      tipo: "previsao",
      titulo: "O mês deve terminar no vermelho",
      texto: `No ritmo atual, a previsão para o fim do mês é de ${brl(previsao.saldoPrevisto)}.`,
      destino: "inicio",
      ordem: 30
    })
  }

  // ----- Novidades do app -----
  NOVIDADES.slice(0, 3).forEach((n, i) => {
    avisos.push({
      id: `novidade-${n.versao}`,
      nivel: "info",
      tipo: "novidade",
      titulo: `Novidades: ${n.titulo} (v${n.versao})`,
      texto: n.itens.join(" • "),
      destino: null,
      ordem: 1000 + i
    })
  })

  return avisos.sort((a, b) => RANK[a.nivel] - RANK[b.nivel] || a.ordem - b.ordem)
}

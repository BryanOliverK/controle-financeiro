// Dívidas e empréstimos.
//
// Cada item é uma dívida entre você e uma pessoa:
//   tipo "devo"  = você deve para a pessoa
//   tipo "devem" = a pessoa deve para você (você emprestou)
//
// O valor é o total combinado. Cada pagamento (parcial ou total) abate do saldo.
// Tudo é calculado em centavos para não ter erro de ponto flutuante.
// Nada além do que o usuário digitou é guardado: saldo e status são calculados.

import { arredondar } from "./formatar"
import { diasAte } from "./cartoes"

export const LIMITE_PESSOA = 30
export const LIMITE_DESCRICAO_DIVIDA = 40
export const MAX_DIVIDAS = 200
export const MAX_PAGAMENTOS = 200

const TIPOS = ["devo", "devem"]
const centavos = (v) => Math.round((Number(v) + Number.EPSILON) * 100)
const reais = (c) => c / 100

const dataIsoValida = (x) => typeof x === "string" && x.length <= 40 && !Number.isNaN(new Date(x).getTime())
const diaValido = (x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(new Date(x + "T12:00:00").getTime())

function limparPagamentos(bruto) {
  if (!Array.isArray(bruto)) {
    return []
  }

  const vistos = new Set()
  const limpos = []

  for (const p of bruto) {
    if (
      p && typeof p === "object" &&
      typeof p.id === "string" && p.id !== "" && p.id.length <= 64 &&
      !vistos.has(p.id) &&
      Number.isFinite(p.valor) && p.valor > 0 &&
      dataIsoValida(p.data)
    ) {
      vistos.add(p.id)

      limpos.push({
        id: p.id,
        valor: arredondar(p.valor),
        data: p.data,
        ...(typeof p.transacaoId === "string" && p.transacaoId !== "" && p.transacaoId.length <= 64
          ? { transacaoId: p.transacaoId }
          : {})
      })
    }
  }

  return limpos.slice(0, MAX_PAGAMENTOS)
}

// Aceita só dívidas bem formadas (vale também para nuvem e backup)
export function limparDividas(bruto) {
  if (!Array.isArray(bruto)) {
    return []
  }

  const vistos = new Set()
  const limpas = []

  for (const d of bruto) {
    if (
      d && typeof d === "object" &&
      typeof d.id === "string" && d.id !== "" && d.id.length <= 64 &&
      !vistos.has(d.id) &&
      TIPOS.includes(d.tipo) &&
      typeof d.pessoa === "string" && d.pessoa.trim() !== "" &&
      Number.isFinite(d.valor) && d.valor > 0 &&
      dataIsoValida(d.criadaEm)
    ) {
      vistos.add(d.id)

      limpas.push({
        id: d.id,
        tipo: d.tipo,
        pessoa: d.pessoa.trim().slice(0, LIMITE_PESSOA),
        descricao: typeof d.descricao === "string" ? d.descricao.trim().slice(0, LIMITE_DESCRICAO_DIVIDA) : "",
        valor: arredondar(d.valor),
        criadaEm: d.criadaEm,
        vencimento: diaValido(d.vencimento) ? d.vencimento : "",
        pagamentos: limparPagamentos(d.pagamentos)
      })
    }
  }

  return limpas.slice(0, MAX_DIVIDAS)
}

// ----- Saldo e status -----

export function totalPago(divida) {
  return reais(divida.pagamentos.reduce((soma, p) => soma + centavos(p.valor), 0))
}

// Nunca negativo (se o total for editado para menos que o já pago, fica 0)
export function saldoDivida(divida) {
  return reais(Math.max(0, centavos(divida.valor) - centavos(totalPago(divida))))
}

export function estaQuitada(divida) {
  return saldoDivida(divida) === 0
}

// "quitada" | "vencida" | "aberta"
export function statusDivida(divida, hoje = new Date()) {
  if (estaQuitada(divida)) {
    return "quitada"
  }

  if (divida.vencimento && diasAte(new Date(divida.vencimento + "T12:00:00"), hoje) < 0) {
    return "vencida"
  }

  return "aberta"
}

// Dias até o vencimento (negativo = atrasada), ou null se não tem vencimento
export function diasParaVencer(divida, hoje = new Date()) {
  if (!divida.vencimento) {
    return null
  }

  return diasAte(new Date(divida.vencimento + "T12:00:00"), hoje)
}

// Quanto você deve e quanto te devem (só o que falta pagar)
export function resumoDividas(dividas) {
  let devo = 0
  let devem = 0

  for (const d of dividas) {
    const falta = centavos(saldoDivida(d))

    if (d.tipo === "devo") {
      devo += falta
    } else {
      devem += falta
    }
  }

  return { devo: reais(devo), devem: reais(devem), saldo: reais(devem - devo) }
}

// Em aberto primeiro (as que vencem antes no topo, sem data por último), quitadas no fim
export function ordenarDividas(dividas) {
  const ordem = (d) => (estaQuitada(d) ? 1 : 0)

  return dividas.slice().sort((a, b) => {
    if (ordem(a) !== ordem(b)) {
      return ordem(a) - ordem(b)
    }

    if (estaQuitada(a)) {
      return new Date(b.criadaEm) - new Date(a.criadaEm)
    }

    const va = a.vencimento || "9999-99-99"
    const vb = b.vencimento || "9999-99-99"

    return va < vb ? -1 : va > vb ? 1 : new Date(a.criadaEm) - new Date(b.criadaEm)
  })
}

// ----- Validação -----

export function validarDivida({ pessoa, valor, vencimento }) {
  if (String(pessoa ?? "").trim() === "") {
    return "Diga com quem é a dívida."
  }

  const numero = Number(valor)

  if (valor === "" || !Number.isFinite(numero) || numero <= 0) {
    return "Informe um valor maior que zero."
  }

  if (centavos(numero) > 100000000000) {
    return "Esse valor é grande demais."
  }

  if (vencimento && !diaValido(vencimento)) {
    return "A data de vencimento não é válida."
  }

  return ""
}

// Mensagem de erro, ou "" se o pagamento pode ser registrado
export function validarPagamento(divida, valor) {
  const numero = Number(valor)

  if (valor === "" || !Number.isFinite(numero) || numero <= 0) {
    return "Informe um valor maior que zero."
  }

  if (centavos(numero) > centavos(saldoDivida(divida))) {
    return "O pagamento é maior que o que falta."
  }

  return ""
}

// ----- Alterações (devolvem uma dívida nova, sem mexer na original) -----

export function comPagamento(divida, pagamento) {
  return {
    ...divida,
    pagamentos: [...divida.pagamentos, { ...pagamento, valor: arredondar(pagamento.valor) }]
  }
}

export function semPagamento(divida, idPagamento) {
  return { ...divida, pagamentos: divida.pagamentos.filter((p) => p.id !== idPagamento) }
}

// Transação que representa o pagamento: se você deve, sai dinheiro; se te devem, entra.
export function transacaoDoPagamento(divida, { valor, data }, transacaoId) {
  const pagou = divida.tipo === "devo"

  return {
    id: transacaoId,
    descricao: ((pagou ? "Pagamento: " : "Recebido de ") + divida.pessoa).slice(0, 40),
    valor: arredondar(valor),
    tipo: pagou ? "saida" : "entrada",
    categoria: "outros",
    data
  }
}

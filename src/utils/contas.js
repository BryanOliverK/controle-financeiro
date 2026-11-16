// Contas (carteira, banco, poupança...) e transferências entre elas.
//
// Uma transação pode ter uma conta (campo "contaId"); as antigas ficam "sem conta".
// O saldo de uma conta é: saldo inicial + entradas - saídas + transferências recebidas
// - transferências enviadas. Transferência NÃO é entrada nem saída: ela só move
// dinheiro de uma conta para outra, então não entra nos gráficos nem no resumo do mês.
// Tudo é calculado em centavos para não ter erro de ponto flutuante.

import { arredondar } from "./formatar"

export const LIMITE_NOME_CONTA = 20
export const LIMITE_NOTA = 40
export const MAX_CONTAS = 30
export const MAX_TRANSFERENCIAS = 2000

export const TIPOS_CONTA = [
  { valor: "carteira", nome: "Carteira" },
  { valor: "banco", nome: "Conta bancária" },
  { valor: "poupanca", nome: "Poupança" },
  { valor: "investimento", nome: "Investimentos" }
]

export const CORES_CONTA = [
  "#3b82f6", "#22c55e", "#8b5cf6", "#f97316",
  "#ec4899", "#14b8a6", "#ef4444", "#64748b"
]

const centavos = (v) => Math.round((Number(v) + Number.EPSILON) * 100)
const reais = (c) => c / 100
const dataIsoValida = (x) => typeof x === "string" && x.length <= 40 && !Number.isNaN(new Date(x).getTime())

// ----- Cadastro -----

// Aceita só contas bem formadas (vale também para nuvem e backup)
export function limparContas(bruto) {
  if (!Array.isArray(bruto)) {
    return []
  }

  const vistos = new Set()
  const limpas = []

  for (const c of bruto) {
    if (
      c && typeof c === "object" &&
      typeof c.id === "string" && c.id !== "" && c.id.length <= 64 &&
      !vistos.has(c.id) &&
      typeof c.nome === "string" && c.nome.trim() !== ""
    ) {
      vistos.add(c.id)

      limpas.push({
        id: c.id,
        nome: c.nome.trim().slice(0, LIMITE_NOME_CONTA),
        tipo: TIPOS_CONTA.some((t) => t.valor === c.tipo) ? c.tipo : "banco",
        saldoInicial: Number.isFinite(c.saldoInicial) ? arredondar(c.saldoInicial) : 0,
        cor: typeof c.cor === "string" && /^#[0-9a-fA-F]{6}$/.test(c.cor) ? c.cor : CORES_CONTA[0]
      })
    }
  }

  return limpas.slice(0, MAX_CONTAS)
}

export function limparTransferencias(bruto) {
  if (!Array.isArray(bruto)) {
    return []
  }

  const vistos = new Set()
  const limpas = []

  for (const t of bruto) {
    if (
      t && typeof t === "object" &&
      typeof t.id === "string" && t.id !== "" && t.id.length <= 64 &&
      !vistos.has(t.id) &&
      typeof t.de === "string" && t.de !== "" && t.de.length <= 64 &&
      typeof t.para === "string" && t.para !== "" && t.para.length <= 64 &&
      t.de !== t.para &&
      Number.isFinite(t.valor) && t.valor > 0 &&
      dataIsoValida(t.data)
    ) {
      vistos.add(t.id)

      limpas.push({
        id: t.id,
        de: t.de,
        para: t.para,
        valor: arredondar(t.valor),
        data: t.data,
        nota: typeof t.nota === "string" ? t.nota.trim().slice(0, LIMITE_NOTA) : ""
      })
    }
  }

  return limpas.slice(0, MAX_TRANSFERENCIAS)
}

// Para mostrar o nome da conta em qualquer lugar (como cartões e categorias)
let registradas = {}

export function registrarContas(lista) {
  registradas = {}

  for (const c of limparContas(lista)) {
    registradas[c.id] = c
  }
}

export function infoConta(id) {
  return registradas[id] || null
}

// Cópia sem o vínculo com conta (usada quando a conta é excluída)
export function semConta(item) {
  const copia = { ...item }
  delete copia.contaId
  return copia
}

// ----- Saldos -----

// Soma (em centavos) do que as transações da conta movimentaram
function movimentoDeTransacoes(transacoes, filtro) {
  let soma = 0

  for (const t of transacoes) {
    if (t.oculta || !filtro(t)) {
      continue
    }

    soma += (t.tipo === "entrada" ? 1 : -1) * centavos(t.valor)
  }

  return soma
}

export function saldoConta(conta, transacoes, transferencias = []) {
  let total = centavos(conta.saldoInicial)

  total += movimentoDeTransacoes(transacoes, (t) => t.contaId === conta.id)

  for (const tr of transferencias) {
    if (tr.para === conta.id) total += centavos(tr.valor)
    if (tr.de === conta.id) total -= centavos(tr.valor)
  }

  return reais(total)
}

// Movimento das transações que não têm conta (as antigas)
export function saldoSemConta(transacoes, contas) {
  const ids = new Set(contas.map((c) => c.id))

  return reais(movimentoDeTransacoes(transacoes, (t) => !t.contaId || !ids.has(t.contaId)))
}

export function contarSemConta(transacoes, contas) {
  const ids = new Set(contas.map((c) => c.id))

  return transacoes.filter((t) => !t.oculta && t.categoria !== "caixinha" && (!t.contaId || !ids.has(t.contaId))).length
}

// Soma dos saldos de todas as contas
export function totalContas(contas, transacoes, transferencias = []) {
  return reais(contas.reduce((s, c) => s + centavos(saldoConta(c, transacoes, transferencias)), 0))
}

// ----- Validação -----

// Mensagem de erro ou "" se está tudo certo. "idAtual" é a conta sendo editada.
export function validarConta({ nome, saldoInicial }, contas, idAtual = null) {
  const limpo = String(nome ?? "").trim()

  if (limpo === "") {
    return "Dê um nome para a conta."
  }

  if (contas.some((c) => c.id !== idAtual && c.nome.toLowerCase() === limpo.toLowerCase())) {
    return "Já existe uma conta com esse nome."
  }

  if (saldoInicial !== "" && saldoInicial != null) {
    const n = Number(saldoInicial)

    if (!Number.isFinite(n) || Math.abs(n) > 1e9) {
      return "O saldo inicial não é válido."
    }
  }

  if (idAtual === null && contas.length >= MAX_CONTAS) {
    return `Você pode ter até ${MAX_CONTAS} contas.`
  }

  return ""
}

export function validarTransferencia({ de, para, valor }, contas) {
  const ids = new Set(contas.map((c) => c.id))

  if (!ids.has(de) || !ids.has(para)) {
    return "Escolha as duas contas."
  }

  if (de === para) {
    return "Escolha contas diferentes."
  }

  const n = Number(valor)

  if (valor === "" || !Number.isFinite(n) || n <= 0) {
    return "Informe um valor maior que zero."
  }

  if (centavos(n) > 100000000000) {
    return "Esse valor é grande demais."
  }

  return ""
}

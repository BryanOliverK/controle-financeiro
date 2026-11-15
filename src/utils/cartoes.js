// Cartões de crédito e faturas.
//
// Uma compra no cartão entra na fatura que ainda está aberta no dia da compra:
// se o cartão fecha dia 10, compras até o dia 10 vão para a fatura que fecha
// neste mês; compras do dia 11 em diante vão para a do mês seguinte. A fatura
// vence no primeiro "dia de vencimento" depois do fechamento.
//
// A compra continua contando como gasto no dia em que foi feita (é assim que
// o resto do app já funcionava); a fatura serve para saber quanto e quando pagar.

export const LIMITE_NOME_CARTAO = 20

export const CORES_CARTAO = [
  "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#22c55e", "#14b8a6", "#3b82f6", "#64748b"
]

// ----- Cadastro -----

const diaValido = (n) => Number.isInteger(n) && n >= 1 && n <= 31

// Aceita só cartões bem formados (vale também para nuvem e backup)
export function limparCartoes(bruto) {
  if (!Array.isArray(bruto)) {
    return []
  }

  const vistos = new Set()
  const limpos = []

  for (const c of bruto) {
    if (
      c && typeof c === "object" &&
      typeof c.id === "string" && c.id !== "" && c.id.length <= 64 &&
      !vistos.has(c.id) &&
      typeof c.nome === "string" && c.nome.trim() !== "" &&
      diaValido(c.fechamento) && diaValido(c.vencimento)
    ) {
      vistos.add(c.id)
      limpos.push({
        id: c.id,
        nome: c.nome.trim().slice(0, LIMITE_NOME_CARTAO),
        fechamento: c.fechamento,
        vencimento: c.vencimento,
        cor: typeof c.cor === "string" && /^#[0-9a-fA-F]{6}$/.test(c.cor) ? c.cor : CORES_CARTAO[0]
      })
    }
  }

  return limpos
}

// Faturas marcadas como pagas: ["<id do cartão>|AAAA-MM", ...]
export function limparFaturasPagas(bruto) {
  if (!Array.isArray(bruto)) {
    return []
  }

  const validas = bruto.filter(
    (x) => typeof x === "string" && x.length <= 80 && /^.+\|\d{4}-\d{2}$/.test(x)
  )

  return [...new Set(validas)].slice(-600)
}

// Para mostrar o nome do cartão em qualquer lugar (como as categorias)
let registrados = {}

export function registrarCartoes(lista) {
  registrados = {}

  for (const c of limparCartoes(lista)) {
    registrados[c.id] = c
  }
}

export function infoCartao(id) {
  return registrados[id] || null
}

// ----- Datas (sempre ao meio-dia, para o horário de verão não atrapalhar) -----

function diaDoMes(ano, mes0, dia) {
  const ultimo = new Date(ano, mes0 + 1, 0).getDate()
  return new Date(ano, mes0, Math.min(dia, ultimo), 12)
}

export function inicioDoDia(data) {
  const d = new Date(data)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12)
}

export function diasAte(data, hoje = new Date()) {
  return Math.round((inicioDoDia(data) - inicioDoDia(hoje)) / 86400000)
}

function mesMais(ano, mes0, n) {
  const total = ano * 12 + mes0 + n
  return [Math.floor(total / 12), total % 12]
}

// ----- Faturas -----

// Em qual fatura cai uma compra: { chave: "AAAA-MM" (mês do fechamento), fecha, vence }
export function faturaDaCompra(cartao, dataCompra) {
  const compra = inicioDoDia(dataCompra)
  const ano = compra.getFullYear()
  const mes = compra.getMonth()

  const jaFechouEsteMes = compra > diaDoMes(ano, mes, cartao.fechamento)
  const [anoF, mesF] = mesMais(ano, mes, jaFechouEsteMes ? 1 : 0)

  // Vence no mesmo mês do fechamento só se o dia de vencimento vier depois dele
  const [anoV, mesV] = mesMais(anoF, mesF, cartao.vencimento > cartao.fechamento ? 0 : 1)

  return {
    chave: `${anoF}-${String(mesF + 1).padStart(2, "0")}`,
    fecha: diaDoMes(anoF, mesF, cartao.fechamento),
    vence: diaDoMes(anoV, mesV, cartao.vencimento)
  }
}

export const chaveFatura = (cartaoId, chave) => `${cartaoId}|${chave}`

// Faturas do cartão (da que vence antes para a que vence depois):
// [{ chave, fecha, vence, total, itens }]. Ignora transações ocultas.
export function agruparFaturas(cartao, transacoes) {
  const grupos = new Map()

  for (const t of transacoes) {
    if (t.cartaoId !== cartao.id || t.oculta || t.tipo !== "saida") {
      continue
    }

    const f = faturaDaCompra(cartao, t.data)

    if (!grupos.has(f.chave)) {
      grupos.set(f.chave, { ...f, centavos: 0, itens: [] })
    }

    const grupo = grupos.get(f.chave)
    grupo.centavos += Math.round(t.valor * 100)
    grupo.itens.push(t)
  }

  return [...grupos.values()]
    .sort((a, b) => a.vence - b.vence)
    .map(({ centavos, ...resto }) => ({
      ...resto,
      total: centavos / 100,
      itens: resto.itens.sort((a, b) => new Date(b.data) - new Date(a.data))
    }))
}

// "paga" | "aberta" (ainda aceita compras) | "fechada" (esperando vencer) | "vencida"
export function statusFatura(fatura, paga, hoje = new Date()) {
  if (paga) {
    return "paga"
  }

  const dia = inicioDoDia(hoje)

  if (dia <= fatura.fecha) {
    return "aberta"
  }

  return dia <= fatura.vence ? "fechada" : "vencida"
}

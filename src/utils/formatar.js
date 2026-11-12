// Funções pequenas de formatação e datas, usadas em vários lugares do app.

export function brl(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
}

// Evita erros de ponto flutuante (0.1 + 0.2 = 0.30000000000000004)
export function arredondar(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

// UUID quando o navegador tem; senão cai num id aleatório
export function novoId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// ----- Meses -----

export function chaveMes(data) {
  const d = new Date(data)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function nomeMes(chave) {
  const [ano, mes] = chave.split("-")
  const nome = new Date(Number(ano), Number(mes) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

// ----- Datas -----

function mesmoDia(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

// Título dos grupos da lista: HOJE, ONTEM ou a data por extenso
export function rotuloData(data) {
  const dataTransacao = new Date(data)
  const hoje = new Date()

  if (mesmoDia(dataTransacao, hoje)) {
    return "HOJE"
  }

  const ontem = new Date()
  ontem.setDate(hoje.getDate() - 1)

  if (mesmoDia(dataTransacao, ontem)) {
    return "ONTEM"
  }

  return dataTransacao.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).toUpperCase()
}

function doisDigitos(n) {
  return String(n).padStart(2, "0")
}

// "AAAA-MM-DD" no fuso local (é o formato do <input type="date">)
export function paraInputData(data) {
  const d = new Date(data)
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`
}

export function hojeLocal() {
  return paraInputData(new Date())
}

// Converte o valor do <input type="date"> em ISO para guardar.
// - vazio ou hoje: usa o instante atual (mantém a hora para ordenar)
// - dia que já era o da transação: mantém a data original
// - outro dia: meio-dia daquele dia (evita virar o dia por causa do fuso)
export function dataParaIso(valorInput, isoOriginal) {
  if (!valorInput || valorInput === hojeLocal()) {
    if (isoOriginal && paraInputData(isoOriginal) === hojeLocal()) {
      return isoOriginal
    }

    return new Date().toISOString()
  }

  if (isoOriginal && paraInputData(isoOriginal) === valorInput) {
    return isoOriginal
  }

  const [ano, mes, dia] = valorInput.split("-").map(Number)
  return new Date(ano, mes - 1, dia, 12, 0, 0).toISOString()
}

// ----- CSV -----

// Aspas duplas viram "" e textos que começam com = + - @ ganham um ' na
// frente, para o Excel não executar como fórmula.
export function celulaCSV(texto) {
  let valor = String(texto ?? "")

  if (/^[=+\-@\t\r]/.test(valor)) {
    valor = "'" + valor
  }

  return `"${valor.replace(/"/g, '""')}"`
}

// contar(1, "transação", "transações") -> "1 transação"
export function contar(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`
}

import { hojeLocal } from "./formatar"

const VERSAO = 1
const TAMANHO_MAXIMO = 5 * 1024 * 1024 // 5 MB: um backup de verdade é bem menor

// Baixa um arquivo .json com todos os dados do app
export function baixarBackup({ transacoes, caixinhas, cdi, pctCdi }) {
  const conteudo = JSON.stringify(
    {
      app: "controle-financeiro",
      versao: VERSAO,
      exportadoEm: new Date().toISOString(),
      transacoes,
      caixinhas,
      cdi,
      pctCdi
    },
    null,
    2
  )

  const blob = new Blob([conteudo], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = `backup-controle-financeiro-${hojeLocal()}.json`
  link.click()

  URL.revokeObjectURL(url)
}

function dataValida(data) {
  return !Number.isNaN(new Date(data).getTime())
}

function transacaoValida(t) {
  return (
    t !== null &&
    typeof t === "object" &&
    t.id !== undefined &&
    t.id !== null &&
    typeof t.descricao === "string" &&
    Number.isFinite(t.valor) &&
    (t.tipo === "entrada" || t.tipo === "saida") &&
    dataValida(t.data)
  )
}

function caixinhaValida(c) {
  return (
    c !== null &&
    typeof c === "object" &&
    c.id !== undefined &&
    c.id !== null &&
    typeof c.nome === "string" &&
    Number.isFinite(c.saldo)
  )
}

// Fica só com os campos que o app conhece (nada de campo estranho vindo do arquivo)
function limparTransacao(t) {
  return {
    id: t.id,
    descricao: t.descricao,
    valor: t.valor,
    tipo: t.tipo,
    categoria: typeof t.categoria === "string" ? t.categoria : "",
    data: t.data
  }
}

function limparCaixinha(c) {
  return {
    id: c.id,
    nome: c.nome,
    emoji: typeof c.emoji === "string" ? c.emoji : "🐷",
    saldo: c.saldo,
    meta: c.meta && Number.isFinite(c.meta.valor) && typeof c.meta.data === "string"
      ? { valor: c.meta.valor, data: c.meta.data }
      : null,
    historico: Array.isArray(c.historico)
      ? c.historico.filter((h) => h !== null && typeof h === "object")
      : []
  }
}

// Lê e confere o arquivo escolhido. Joga um Error com mensagem amigável se
// não for um backup válido.
export async function lerBackup(arquivo) {
  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new Error("Esse arquivo é grande demais para ser um backup.")
  }

  let dados

  try {
    dados = JSON.parse(await arquivo.text())
  } catch {
    throw new Error("Esse arquivo não é um backup válido.")
  }

  if (
    !dados ||
    !Array.isArray(dados.transacoes) ||
    !Array.isArray(dados.caixinhas)
  ) {
    throw new Error("Esse arquivo não parece ser um backup do app.")
  }

  if (
    !dados.transacoes.every(transacaoValida) ||
    !dados.caixinhas.every(caixinhaValida)
  ) {
    throw new Error("O backup tem dados em um formato inesperado.")
  }

  return {
    transacoes: dados.transacoes.map(limparTransacao),
    caixinhas: dados.caixinhas.map(limparCaixinha)
  }
}

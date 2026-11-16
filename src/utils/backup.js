import { hojeLocal } from "./formatar"
import { limparCartoes, limparFaturasPagas } from "./cartoes"
import { limparCategoriasExtras } from "./categorias"
import { limparContas, limparTransferencias } from "./contas"
import { limparDividas } from "./dividas"
import { limparOrcamentos } from "./orcamentos"
import { limparParcela } from "./parcelas"

const VERSAO = 1
const TAMANHO_MAXIMO = 5 * 1024 * 1024 // 5 MB: um backup de verdade é bem menor

// Baixa um arquivo .json com todos os dados do app
export function baixarBackup({ transacoes, caixinhas, cdi, pctCdi, orcamentos, recorrentes, categoriasExtras, cartoes, faturasPagas, dividas = [], contas = [], transferencias = [] }) {
  const conteudo = JSON.stringify(
    {
      app: "controle-financeiro",
      versao: VERSAO,
      exportadoEm: new Date().toISOString(),
      transacoes,
      caixinhas,
      cdi,
      pctCdi,
      orcamentos,
      recorrentes,
      categoriasExtras,
      cartoes,
      faturasPagas,
      dividas,
      contas,
      transferencias
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

function recorrenteValida(r) {
  return (
    r !== null &&
    typeof r === "object" &&
    r.id !== undefined &&
    r.id !== null &&
    typeof r.descricao === "string" &&
    Number.isFinite(r.valor) &&
    (r.tipo === "entrada" || r.tipo === "saida") &&
    Number.isInteger(r.dia) && r.dia >= 1 && r.dia <= 31 &&
    typeof r.proximoMes === "string" && /^\d{4}-\d{2}$/.test(r.proximoMes)
  )
}

// Fica só com os campos que o app conhece (nada de campo estranho vindo do arquivo)
function limparTransacao(t) {
  const limpa = {
    id: t.id,
    descricao: t.descricao,
    valor: t.valor,
    tipo: t.tipo,
    categoria: typeof t.categoria === "string" ? t.categoria : "",
    data: t.data
  }

  const parcela = limparParcela(t.parcela)

  if (parcela) {
    limpa.parcela = parcela
  }

  if (t.oculta === true) {
    limpa.oculta = true
  }

  if (typeof t.cartaoId === "string" && t.cartaoId !== "") {
    limpa.cartaoId = t.cartaoId
  }

  if (typeof t.contaId === "string" && t.contaId !== "") {
    limpa.contaId = t.contaId
  }

  return limpa
}

function limparRecorrente(r) {
  return {
    ...(typeof r.cartaoId === "string" && r.cartaoId !== "" ? { cartaoId: r.cartaoId } : {}),
    ...(typeof r.contaId === "string" && r.contaId !== "" ? { contaId: r.contaId } : {}),
    id: r.id,
    descricao: r.descricao,
    valor: r.valor,
    tipo: r.tipo,
    categoria: typeof r.categoria === "string" ? r.categoria : "",
    dia: r.dia,
    proximoMes: r.proximoMes
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

  // Orçamentos e lançamentos mensais são opcionais (backups antigos não têm)
  const recorrentes = Array.isArray(dados.recorrentes)
    ? dados.recorrentes.filter(recorrenteValida).map(limparRecorrente)
    : []

  return {
    transacoes: dados.transacoes.map(limparTransacao),
    caixinhas: dados.caixinhas.map(limparCaixinha),
    orcamentos: limparOrcamentos(dados.orcamentos),
    recorrentes,
    categoriasExtras: limparCategoriasExtras(dados.categoriasExtras),
    cartoes: limparCartoes(dados.cartoes),
    faturasPagas: limparFaturasPagas(dados.faturasPagas),
    dividas: limparDividas(dados.dividas),
    contas: limparContas(dados.contas),
    transferencias: limparTransferencias(dados.transferencias)
  }
}

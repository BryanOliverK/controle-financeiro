// Importação de extrato bancário (CSV ou OFX).
//
// Fluxo: o arquivo vira uma lista de linhas {data, descricao, valor} (valor COM
// sinal: positivo entra, negativo sai), depois "prepararLinhas" decide tipo,
// categoria sugerida e marca as que parecem repetidas de transações que você
// já tem. Nada é gravado aqui: quem confirma é a tela de conferência.

import { categoriaCompativel } from "./categorias"
import { arredondar } from "./formatar"
import { LIMITE_DESCRICAO } from "./validacao"

export const TAMANHO_MAXIMO_EXTRATO = 2 * 1024 * 1024 // 2 MB
export const MAX_LINHAS_EXTRATO = 1500

const centavos = (v) => Math.round((Number(v) + Number.EPSILON) * 100)

// minúsculas, sem acento, só letras/números/espaço
export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

// ----- Números e datas -----

// Aceita "1.234,56", "-1234.56", "R$ 10,00", "(25,90)", "25,90-", "+5"
// Ponto sozinho é tratado como decimal ("1234.56"); vários pontos, como milhar.
export function lerValor(bruto) {
  let t = String(bruto ?? "").trim()

  if (t === "") {
    return null
  }

  let negativo = false

  if (/^\(.*\)$/.test(t)) {
    negativo = true
    t = t.slice(1, -1)
  }

  t = t.replace(/−/g, "-").replace(/R\$|\s/gi, "")

  if (t.endsWith("-")) {
    negativo = true
    t = t.slice(0, -1)
  }

  if (t.startsWith("-")) {
    negativo = !negativo
    t = t.slice(1)
  } else if (t.startsWith("+")) {
    t = t.slice(1)
  }

  if (!/^[\d.,]+$/.test(t) || !/\d/.test(t)) {
    return null
  }

  const ultimaVirgula = t.lastIndexOf(",")
  const ultimoPonto = t.lastIndexOf(".")

  if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
    // o último separador é o decimal
    if (ultimaVirgula > ultimoPonto) {
      t = t.replace(/\./g, "").replace(",", ".")
    } else {
      t = t.replace(/,/g, "")
    }
  } else if (ultimaVirgula >= 0) {
    if ((t.match(/,/g) || []).length > 1) {
      t = t.replace(/,/g, "")
    } else {
      t = t.replace(",", ".")
    }
  } else if ((t.match(/\./g) || []).length > 1) {
    t = t.replace(/\./g, "")
  }

  const numero = Number(t)

  if (!Number.isFinite(numero)) {
    return null
  }

  return negativo ? -numero : numero
}

// Devolve ISO (meio-dia local) ou null. Dia vem antes do mês (padrão brasileiro).
export function lerData(bruto) {
  const t = String(bruto ?? "").trim()

  let dia, mes, ano
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\D|$)/)

  if (m) {
    ano = Number(m[1]); mes = Number(m[2]); dia = Number(m[3])
  } else if ((m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})(?:\D|$)/))) {
    dia = Number(m[1]); mes = Number(m[2]); ano = Number(m[3])
    if (m[3].length === 2) ano += 2000
  } else if ((m = t.match(/^(\d{4})(\d{2})(\d{2})/))) {
    ano = Number(m[1]); mes = Number(m[2]); dia = Number(m[3])
  } else {
    return null
  }

  const data = new Date(ano, mes - 1, dia, 12, 0, 0)

  if (
    data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia ||
    ano < 1990 || ano > 2100
  ) {
    return null
  }

  return data.toISOString()
}

function limparDescricao(texto) {
  const t = String(texto ?? "").replace(/\s+/g, " ").trim().slice(0, LIMITE_DESCRICAO).trim()
  return t === "" ? "Sem descrição" : t
}

// ----- CSV -----

function dividirCSV(texto) {
  const linhasBrutas = texto.replace(/^﻿/, "").split(/\r\n|\n|\r/).filter((l) => l.trim() !== "")

  if (linhasBrutas.length === 0) {
    return []
  }

  const amostra = linhasBrutas.slice(0, 5).join("\n")
  const conta = (c) => (amostra.match(new RegExp(c === "\t" ? "\t" : `\\${c}`, "g")) || []).length
  const separador = [";", "\t", ","].sort((a, b) => conta(b) - conta(a))[0]

  return linhasBrutas.map((linha) => {
    const celulas = []
    let atual = ""
    let aspas = false

    for (let i = 0; i < linha.length; i++) {
      const c = linha[i]

      if (aspas) {
        if (c === '"' && linha[i + 1] === '"') { atual += '"'; i++ }
        else if (c === '"') aspas = false
        else atual += c
      } else if (c === '"') {
        aspas = true
      } else if (c === separador) {
        celulas.push(atual.trim())
        atual = ""
      } else {
        atual += c
      }
    }

    celulas.push(atual.trim())
    return celulas
  })
}

function acharColunas(cabecalho) {
  const cols = { data: -1, descricao: -1, valor: -1, credito: -1, debito: -1 }
  const nomes = cabecalho.map(normalizar)

  nomes.forEach((n, i) => {
    if (cols.data < 0 && /^(data|date|dt)\b/.test(n)) cols.data = i
  })

  nomes.forEach((n, i) => {
    if (i === cols.data) return

    if (cols.credito < 0 && /\b(credito|entrada|receita)\b/.test(n)) cols.credito = i
    else if (cols.debito < 0 && /\b(debito|saida|despesa)\b/.test(n)) cols.debito = i
    else if (cols.valor < 0 && /^(valor|amount|montante|quantia)\b/.test(n)) cols.valor = i
    else if (cols.descricao < 0 && /(descri|hist|lanc|memo|title|titulo|estabelec|nome|detalhe|name)/.test(n)) cols.descricao = i
  })

  return cols
}

function interpretarCSV(texto) {
  const linhas = dividirCSV(texto)

  // procura o cabeçalho nas primeiras linhas
  let inicio = -1
  let cols = null

  for (let i = 0; i < Math.min(linhas.length, 15); i++) {
    const c = acharColunas(linhas[i])
    const temValor = c.valor >= 0 || c.credito >= 0 || c.debito >= 0

    if (c.data >= 0 && temValor) {
      inicio = i + 1
      cols = c
      break
    }
  }

  if (!cols) {
    // sem cabeçalho reconhecível: adivinha pelas primeiras linhas de dados
    const exemplo = linhas.find((l) => l.some((c) => lerData(c)) && l.some((c) => lerValor(c) !== null && !lerData(c)))

    if (!exemplo) {
      throw new Error("Não consegui encontrar data e valor nesse arquivo. Confira se é um extrato em CSV ou OFX.")
    }

    const data = exemplo.findIndex((c) => lerData(c))
    const valor = exemplo.findIndex((c, i) => i !== data && lerValor(c) !== null && !lerData(c) && /[,.]/.test(c))
    const descricao = exemplo
      .map((c, i) => ({ c, i }))
      .filter(({ i }) => i !== data && i !== valor)
      .sort((a, b) => b.c.length - a.c.length)[0]?.i ?? -1

    if (valor < 0) {
      throw new Error("Não consegui identificar a coluna de valores nesse arquivo.")
    }

    cols = { data, descricao, valor, credito: -1, debito: -1 }
    inicio = 0
  }

  const itens = []
  let ignoradas = 0

  for (const l of linhas.slice(inicio)) {
    const data = lerData(l[cols.data])

    let valor = null

    if (cols.valor >= 0) {
      valor = lerValor(l[cols.valor])
    } else {
      const cred = lerValor(l[cols.credito])
      const deb = lerValor(l[cols.debito])

      if (cred) valor = Math.abs(cred)
      else if (deb) valor = -Math.abs(deb)
    }

    if (!data || valor === null || valor === 0 || Math.abs(valor) > 1e9) {
      ignoradas++
      continue
    }

    itens.push({
      data,
      descricao: limparDescricao(cols.descricao >= 0 ? l[cols.descricao] : ""),
      valor: arredondar(valor)
    })
  }

  return { itens, ignoradas }
}

// ----- OFX -----

function interpretarOFX(texto) {
  const blocos = texto.split(/<STMTTRN>/i).slice(1)
  const itens = []
  let ignoradas = 0

  const campo = (bloco, tag) => {
    const m = bloco.match(new RegExp(`<${tag}>([^<\\r\\n]*)`, "i"))
    return m ? m[1].trim() : ""
  }

  for (const b of blocos) {
    const data = lerData(campo(b, "DTPOSTED"))
    const valor = lerValor(campo(b, "TRNAMT"))

    if (!data || valor === null || valor === 0 || Math.abs(valor) > 1e9) {
      ignoradas++
      continue
    }

    itens.push({
      data,
      descricao: limparDescricao(campo(b, "MEMO") || campo(b, "NAME")),
      valor: arredondar(valor)
    })
  }

  return { itens, ignoradas }
}

// Lê o texto do arquivo. Devolve { linhas, ignoradas } ou joga Error amigável.
export function interpretarExtrato(texto) {
  if (typeof texto !== "string" || texto.trim() === "") {
    throw new Error("O arquivo está vazio.")
  }

  const resultado = /<STMTTRN>/i.test(texto) ? interpretarOFX(texto) : interpretarCSV(texto)

  if (resultado.itens.length === 0) {
    throw new Error("Não encontrei nenhuma transação nesse arquivo.")
  }

  if (resultado.itens.length > MAX_LINHAS_EXTRATO) {
    throw new Error(`O arquivo tem transações demais (máximo ${MAX_LINHAS_EXTRATO}). Importe por períodos menores.`)
  }

  return { linhas: resultado.itens, ignoradas: resultado.ignoradas }
}

// Lê o arquivo escolhido (File). Bancos costumam exportar em Windows-1252.
export async function lerArquivoExtrato(arquivo) {
  if (arquivo.size > TAMANHO_MAXIMO_EXTRATO) {
    throw new Error("Esse arquivo é grande demais para ser um extrato (máximo 2 MB).")
  }

  const bytes = await arquivo.arrayBuffer()

  let texto

  try {
    texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    texto = new TextDecoder("windows-1252").decode(bytes)
  }

  return interpretarExtrato(texto)
}

// ----- Categoria sugerida -----

const PALAVRAS = [
  ["alimentacao", ["ifood", "rappi", "restaurante", "lanchonete", "padaria", "mercado", "supermercado", "atacadao", "assai", "carrefour", "pao de acucar", "burger", "mcdonald", "pizza", "pizzaria", "acougue", "hortifruti", "cafe", "sorveteria"]],
  ["transporte", ["uber", "99", "cabify", "posto", "combustivel", "shell", "ipiranga", "estacionamento", "pedagio", "sem parar", "metro", "bilhete unico", "gasolina"]],
  ["lazer", ["netflix", "spotify", "cinema", "steam", "playstation", "xbox", "disney", "hbo", "youtube", "ingresso", "prime video"]],
  ["casa", ["aluguel", "condominio", "energia", "enel", "cpfl", "sabesp", "internet", "vivo", "claro", "tim", "luz"]],
  ["educacao", ["escola", "faculdade", "curso", "udemy", "alura", "universidade"]],
  ["compras", ["amazon", "mercadolivre", "mercado livre", "magalu", "shopee", "aliexpress", "shein", "americanas"]]
]

const PALAVRAS_SALARIO = ["salario", "folha de pagamento", "pagamento de salario", "proventos"]

function temPalavra(descricaoNormalizada, palavra) {
  return (` ${descricaoNormalizada} `).includes(` ${palavra} `)
}

// Chave aprendida do histórico: as duas primeiras palavras da descrição
function chaveHistorico(descricao) {
  return normalizar(descricao).split(" ").filter((p) => p.length >= 3).slice(0, 2).join(" ")
}

// Mapa "descrição parecida" -> categoria mais usada nas suas transações
export function aprenderCategorias(transacoes) {
  const contagem = {}

  for (const t of transacoes) {
    if (t.oculta || !t.categoria || t.categoria === "caixinha") continue

    const chave = chaveHistorico(t.descricao)

    if (!chave) continue

    const k = `${t.tipo}|${chave}`
    contagem[k] = contagem[k] || {}
    contagem[k][t.categoria] = (contagem[k][t.categoria] || 0) + 1
  }

  const mapa = {}

  for (const [k, cats] of Object.entries(contagem)) {
    mapa[k] = Object.entries(cats).sort((a, b) => b[1] - a[1])[0][0]
  }

  return mapa
}

export function sugerirCategoria(descricao, tipo, aprendidas = {}) {
  const chave = chaveHistorico(descricao)
  const doHistorico = chave && aprendidas[`${tipo}|${chave}`]

  if (doHistorico && categoriaCompativel(doHistorico, tipo)) {
    return doHistorico
  }

  const n = normalizar(descricao)

  if (tipo === "entrada" && PALAVRAS_SALARIO.some((p) => temPalavra(n, p))) {
    return "salario"
  }

  for (const [categoria, palavras] of PALAVRAS) {
    if (palavras.some((p) => temPalavra(n, p)) && categoriaCompativel(categoria, tipo)) {
      return categoria
    }
  }

  return "outros"
}

// ----- Preparar para conferência -----

const diaLocal = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// linhas: [{ data, descricao, valor }] (valor com sinal).
// inverter: troca entrada/saída (alguns bancos exportam compras como positivas).
// Devolve [{ chave, data, descricao, valor, tipo, categoria, duplicada }]
export function prepararLinhas(linhas, { inverter = false, existentes = [], historico = [] } = {}) {

  const aprendidas = aprenderCategorias(historico)

  // O que já existe, contado por dia + valor + tipo (cada uma só "cobre" uma linha)
  const disponiveis = {}

  for (const t of existentes) {
    if (t.oculta) continue

    const k = `${diaLocal(t.data)}|${centavos(t.valor)}|${t.tipo}`
    disponiveis[k] = (disponiveis[k] || 0) + 1
  }

  return linhas.map((l, i) => {
    const sinal = inverter ? -l.valor : l.valor
    const tipo = sinal > 0 ? "entrada" : "saida"
    const valor = arredondar(Math.abs(sinal))

    const k = `${diaLocal(l.data)}|${centavos(valor)}|${tipo}`
    const duplicada = (disponiveis[k] || 0) > 0

    if (duplicada) {
      disponiveis[k]--
    }

    return {
      chave: `linha-${i}`,
      data: l.data,
      descricao: l.descricao,
      valor,
      tipo,
      categoria: sugerirCategoria(l.descricao, tipo, aprendidas),
      duplicada
    }
  })
}

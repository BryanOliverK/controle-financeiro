// Lançamento rápido: transforma um texto como "mercado 85" em uma transação,
// e sugere categoria/conta/valor a partir do que você já lançou antes.

import { categoriaCompativel, todasCategorias } from "./categorias"
import { arredondar } from "./formatar"
import { LIMITE_DESCRICAO } from "./validacao"

const VALOR_MAXIMO = 1000000000

export function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

// "1.200,50" / "85,5" / "85.5" / "1.200" / "85" -> número (ou null)
export function lerNumero(bruto) {
  const t = String(bruto)

  if (!/^\d[\d.,]*$/.test(t)) {
    return null
  }

  let limpo

  if (t.includes(".") && t.includes(",")) {
    limpo = t.replace(/\./g, "").replace(",", ".")
  } else if (t.includes(",")) {
    limpo = t.replace(",", ".")
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    limpo = t.replace(/\./g, "")
  } else {
    limpo = t
  }

  const n = Number(limpo)

  return Number.isFinite(n) ? n : null
}

const PALAVRAS_ENTRADA = [
  "salario", "recebi", "recebido", "recebimento", "freela", "freelance", "rendimento",
  "reembolso", "venda", "vendi", "bonus", "13o", "deposito", "mesada", "pagamento recebido"
]

const comecaComPalavra = (texto, palavra) => new RegExp(`(^| )${palavra}( |$)`).test(texto)

// Resultado: { ok: true, descricao, valor, tipo } ou { ok: false, motivo }
export function interpretarRapido(texto) {
  const original = String(texto ?? "").trim()

  if (original === "") {
    return { ok: false, motivo: "vazio" }
  }

  // Último trecho que parece número (aceita R$ na frente)
  const achados = [...original.matchAll(/(?:r\$\s*)?(\d[\d.,]*)/gi)]

  // Ignora trechos grudados em letras (ex.: "p2", "5g")
  const candidatos = achados.filter((m) => {
    const antes = original[m.index - 1]
    const depois = original[m.index + m[0].length]
    return !(antes && /[a-zà-ú]/i.test(antes)) && !(depois && /[a-zà-ú]/i.test(depois))
  })

  if (candidatos.length === 0) {
    return { ok: false, motivo: "sem-valor" }
  }

  const achado = candidatos[candidatos.length - 1]
  const numero = lerNumero(achado[1].replace(/[.,]+$/, ""))

  if (numero === null || numero <= 0 || numero > VALOR_MAXIMO) {
    return { ok: false, motivo: "valor-invalido" }
  }

  const resto = (original.slice(0, achado.index) + " " + original.slice(achado.index + achado[0].length))
  const temMais = /(^|\s)\+/.test(resto) || /\+\s*$/.test(original.slice(0, achado.index))
  const temMenos = /(^|\s)[-−]\s*(?=\S|$)/.test(resto) && !/\w-\w/.test(resto)

  const descricaoBruta = resto
    .replace(/(^|\s)[+\-−](?=\s|$|[a-zà-ú])/gi, " ")
    .replace(/\br\$/gi, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (descricaoBruta === "") {
    return { ok: false, motivo: "sem-descricao" }
  }

  const norm = normalizar(descricaoBruta)
  const parecidoComEntrada = PALAVRAS_ENTRADA.some((p) => comecaComPalavra(norm, p))

  const tipo = temMais ? "entrada" : temMenos ? "saida" : parecidoComEntrada ? "entrada" : "saida"

  const descricao = (descricaoBruta[0].toUpperCase() + descricaoBruta.slice(1)).slice(0, LIMITE_DESCRICAO)

  return { ok: true, descricao, valor: arredondar(numero), tipo }
}

// ----- Categoria -----

const PALAVRAS_CATEGORIA = {
  alimentacao: ["mercado", "supermercado", "padaria", "restaurante", "lanche", "ifood", "pizza", "cafe", "almoco", "jantar", "acougue", "hamburguer", "sorvete", "feira", "marmita", "comida"],
  transporte: ["uber", "99", "onibus", "gasolina", "combustivel", "estacionamento", "pedagio", "metro", "passagem", "taxi", "oficina"],
  casa: ["aluguel", "luz", "agua", "internet", "condominio", "energia", "gas", "iptu", "moveis", "reforma"],
  lazer: ["cinema", "netflix", "spotify", "bar", "show", "jogo", "viagem", "balada", "festa", "ingresso", "streaming"],
  educacao: ["curso", "faculdade", "livro", "escola", "mensalidade", "apostila"],
  compras: ["roupa", "shopping", "amazon", "shopee", "mercado livre", "tenis", "sapato", "presente", "magalu"],
  salario: ["salario", "pagamento", "13o", "freela", "freelance", "bonus"]
}

const existe = (chave, tipo) => todasCategorias().some(([c]) => c === chave) && categoriaCompativel(chave, tipo)

// Quantas vezes cada valor aparece; devolve o mais frequente (empate: o mais recente)
function maisComum(itens) {
  const cont = new Map()

  itens.forEach((valor, i) => {
    if (!valor) return
    const atual = cont.get(valor) || { n: 0, ultimo: 0 }
    cont.set(valor, { n: atual.n + 1, ultimo: i })
  })

  let melhor = null

  for (const [valor, { n, ultimo }] of cont) {
    if (!melhor || n > melhor.n || (n === melhor.n && ultimo > melhor.ultimo)) {
      melhor = { valor, n, ultimo }
    }
  }

  return melhor ? melhor.valor : ""
}

// historico: transações (qualquer ordem). Devolve { categoria, contaId }.
export function sugerirCategoria(descricao, tipo, historico = []) {
  const norm = normalizar(descricao)

  if (norm === "") {
    return { categoria: "", contaId: "" }
  }

  // 1) O que você já fez com essa mesma descrição
  const iguais = historico
    .filter((t) => t.categoria !== "caixinha" && normalizar(t.descricao) === norm && t.tipo === tipo)
    .sort((a, b) => new Date(a.data) - new Date(b.data))

  const daHistoria = maisComum(iguais.map((t) => t.categoria).filter((c) => existe(c, tipo)))

  if (daHistoria) {
    return { categoria: daHistoria, contaId: maisComum(iguais.map((t) => t.contaId)) }
  }

  // 2) O nome da categoria aparece no texto (inclui as que você criou)
  for (const [chave, info] of todasCategorias()) {
    const nome = normalizar(info.nome)

    if (nome.length >= 3 && comecaComPalavra(norm, nome) && existe(chave, tipo)) {
      return { categoria: chave, contaId: "" }
    }
  }

  // 3) Palavras comuns
  for (const [chave, palavras] of Object.entries(PALAVRAS_CATEGORIA)) {
    if (palavras.some((p) => comecaComPalavra(norm, p)) && existe(chave, tipo)) {
      return { categoria: chave, contaId: "" }
    }
  }

  return { categoria: existe("outros", tipo) ? "outros" : "", contaId: "" }
}

// ----- Sugestões ao digitar -----

// Descrições que você já usou e que combinam com o que está sendo digitado.
// Devolve até "limite" itens: { descricao, valor, tipo, categoria, contaId, cartaoId } (do lançamento mais recente).
export function sugestoesDescricao(digitado, historico = [], limite = 5) {
  const busca = normalizar(digitado)

  if (busca === "") {
    return []
  }

  const grupos = new Map()

  for (const t of historico) {
    if (!t || t.categoria === "caixinha" || typeof t.descricao !== "string") continue

    const chave = normalizar(t.descricao)

    if (!chave.includes(busca)) continue

    const g = grupos.get(chave) || { n: 0, recente: null }
    g.n += 1

    if (!g.recente || new Date(t.data) > new Date(g.recente.data)) {
      g.recente = t
    }

    grupos.set(chave, g)
  }

  return [...grupos.entries()]
    .sort(([ka, a], [kb, b]) => {
      const comeca = Number(kb.startsWith(busca)) - Number(ka.startsWith(busca))
      return comeca || b.n - a.n || new Date(b.recente.data) - new Date(a.recente.data)
    })
    .slice(0, limite)
    .map(([, { recente: t }]) => ({
      descricao: t.descricao,
      valor: t.valor,
      tipo: t.tipo,
      categoria: t.categoria,
      contaId: t.contaId || "",
      cartaoId: t.cartaoId || ""
    }))
}

// Etiquetas (tags) dos lançamentos: palavras curtas como "viagem" ou "presente"
// que atravessam as categorias. Ficam em transacao.etiquetas (lista de textos).
//
// Formato guardado: minúsculas, sem "#", sem espaços (viram "-"), até 20 letras.

export const MAX_ETIQUETAS = 5
export const LIMITE_ETIQUETA = 20

// "  #Viagem Rio " -> "viagem-rio". Devolve "" se não sobrar nada.
export function limparEtiqueta(bruta) {
  return String(bruta ?? "")
    .toLowerCase()
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITE_ETIQUETA)
    .replace(/-+$/g, "")
}

// Qualquer coisa vinda de fora (nuvem, backup) vira uma lista boa: sem repetidas, no máximo 5.
export function limparEtiquetas(lista) {
  if (!Array.isArray(lista)) {
    return []
  }

  const vistas = new Set()

  for (const item of lista) {
    const e = limparEtiqueta(item)

    if (e !== "" && !vistas.has(e)) {
      vistas.add(e)
    }

    if (vistas.size >= MAX_ETIQUETAS) {
      break
    }
  }

  return [...vistas]
}

// Devolve a lista com a nova etiqueta (a mesma lista se não deu para adicionar).
export function adicionarEtiqueta(lista, bruta) {
  const e = limparEtiqueta(bruta)

  if (e === "" || lista.includes(e) || lista.length >= MAX_ETIQUETAS) {
    return lista
  }

  return [...lista, e]
}

export function removerEtiqueta(lista, etiqueta) {
  return lista.filter((e) => e !== etiqueta)
}

// Tira os "#palavras" de um texto. "mercado 85 #casa #Festa" ->
// { texto: "mercado 85", etiquetas: ["casa", "festa"] }
export function extrairEtiquetas(texto) {
  const achadas = []

  const sem = String(texto ?? "").replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_, antes, nome) => {
    achadas.push(nome)
    return antes
  })

  return {
    texto: sem.replace(/\s+/g, " ").trim(),
    etiquetas: limparEtiquetas(achadas)
  }
}

// Todas as etiquetas em uso: [{ nome, qtd }], as mais usadas primeiro.
// Transações ocultas (histórico limpo) não contam.
export function contarEtiquetas(transacoes) {
  const cont = new Map()

  for (const t of transacoes) {
    if (!t || t.oculta) continue

    for (const e of limparEtiquetas(t.etiquetas)) {
      cont.set(e, (cont.get(e) || 0) + 1)
    }
  }

  return [...cont.entries()]
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd || a.nome.localeCompare(b.nome, "pt-BR"))
}

// Sugestões enquanto digita (ou as mais usadas, se ainda não digitou nada).
// "usadas" vem de contarEtiquetas; "atuais" são as já escolhidas e não se repetem.
export function sugestoesEtiqueta(usadas, atuais, digitado, limite = 6) {
  const busca = limparEtiqueta(digitado)

  return usadas
    .filter((u) => !atuais.includes(u.nome) && (busca === "" || u.nome.includes(busca)))
    .sort((a, b) => {
      const comeca = Number(b.nome.startsWith(busca)) - Number(a.nome.startsWith(busca))
      return comeca || b.qtd - a.qtd || a.nome.localeCompare(b.nome, "pt-BR")
    })
    .slice(0, limite)
    .map((u) => u.nome)
}

export function temEtiqueta(transacao, etiqueta) {
  return limparEtiquetas(transacao?.etiquetas).includes(etiqueta)
}

// Para a busca: o texto bate com alguma etiqueta? ("viag" ou "#viag" acham "viagem")
export function buscaBateEtiqueta(transacao, termo) {
  const e = limparEtiqueta(termo)

  if (e === "") {
    return false
  }

  return limparEtiquetas(transacao?.etiquetas).some((x) => x.includes(e))
}

// Pequenas regras da tela de Perfil (sem Firebase, para dar para testar).

export const LIMITE_NOME_PERFIL = 40
export const PALAVRA_EXCLUIR = "EXCLUIR"

// "Maria da Silva" -> "MS"; sem nome usa a primeira letra do e-mail
export function iniciais(nome, email) {
  const palavras = String(nome ?? "").trim().split(/\s+/).filter(Boolean)

  if (palavras.length >= 2) {
    return (palavras[0][0] + palavras[palavras.length - 1][0]).toUpperCase()
  }

  if (palavras.length === 1) {
    return palavras[0].slice(0, 2).toUpperCase()
  }

  const letra = String(email ?? "").trim()[0]
  return letra ? letra.toUpperCase() : "?"
}

// "google.com" | "password" | ... -> texto para mostrar
export function nomeDoProvedor(providerData) {
  const ids = (providerData ?? []).map((p) => p?.providerId)

  if (ids.includes("password")) return "E-mail e senha"
  if (ids.includes("google.com")) return "Google"
  return "Conta"
}

export function usaSenha(providerData) {
  return (providerData ?? []).some((p) => p?.providerId === "password")
}

// Mensagem de erro ou "" se o nome pode ser salvo
export function validarNomePerfil(nome) {
  const n = String(nome ?? "").trim()

  if (n === "") return "Digite um nome."
  if (n.length > LIMITE_NOME_PERFIL) return `O nome pode ter até ${LIMITE_NOME_PERFIL} letras.`
  return ""
}

// A exclusão só vale se a pessoa digitou a palavra de confirmação
export function confirmouExclusao(texto) {
  return String(texto ?? "").trim().toUpperCase() === PALAVRA_EXCLUIR
}

// "Membro desde novembro de 2026" (aceita data inválida ou vazia)
export function membroDesde(criadaEm) {
  const d = new Date(criadaEm)

  if (!criadaEm || Number.isNaN(d.getTime())) {
    return ""
  }

  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
}

// Números do "Resumo da conta"
export function resumoDaConta({ transacoes = [], caixinhas = [], contas = [], cartoes = [], dividas = [] }) {
  const guardado = caixinhas.reduce((s, c) => s + Math.round((Number(c.saldo) || 0) * 100), 0)

  const abertas = dividas.filter((d) => {
    const pago = (d.pagamentos || []).reduce((s, p) => s + Math.round(p.valor * 100), 0)
    return Math.round(d.valor * 100) - pago > 0
  }).length

  return {
    transacoes: transacoes.filter((t) => !t.oculta).length,
    caixinhas: caixinhas.length,
    guardado: guardado / 100,
    contas: contas.length,
    cartoes: cartoes.length,
    dividasAbertas: abertas
  }
}

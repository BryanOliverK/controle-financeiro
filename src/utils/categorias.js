// Única lista de categorias do app (formulário, lista e gráfico usam esta).
// "icone" é o nome do desenho em components/Icone.jsx.
// tipo: "ambos" aparece para entrada e saída; "entrada" só para entradas.

export const CATEGORIAS = {
  alimentacao: { nome: "Alimentação", icone: "alimentacao", cor: "#f59e0b", tipo: "ambos" },
  lazer: { nome: "Lazer", icone: "lazer", cor: "#8b5cf6", tipo: "ambos" },
  casa: { nome: "Casa", icone: "casa", cor: "#3b82f6", tipo: "ambos" },
  transporte: { nome: "Transporte", icone: "transporte", cor: "#06b6d4", tipo: "ambos" },
  salario: { nome: "Salário", icone: "salario", cor: "#22c55e", tipo: "entrada" },
  educacao: { nome: "Educação", icone: "educacao", cor: "#ec4899", tipo: "ambos" },
  compras: { nome: "Compras", icone: "compras", cor: "#f97316", tipo: "ambos" },
  outros: { nome: "Outros", icone: "outros", cor: "#94a3b8", tipo: "ambos" }
}

// "caixinha" é criada pelo próprio app, o usuário não escolhe no formulário
const CAIXINHA = { nome: "Caixinha", icone: "caixinha", cor: "#94a3b8" }

export const SEM_CATEGORIA = { nome: "Sem categoria", icone: "outros", cor: "#94a3b8" }

// Categorias criadas pelo usuário. Ficam guardadas aqui (e no App, que as salva
// na nuvem) para que lista, formulário e gráfico enxerguem as mesmas categorias.
let extras = {}

export const LIMITE_NOME_CATEGORIA = 20

// Ícones que o usuário pode escolher e cores da paleta
export const ICONES_ESCOLHA = [
  "alimentacao", "lazer", "casa", "transporte", "educacao", "compras",
  "saude", "pet", "cafe", "celular", "musica", "trabalho",
  "presente", "aviao", "moeda", "escudo", "formatura", "alvo"
]

export const CORES_ESCOLHA = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#64748b"
]

export function novaChaveCategoria() {
  return `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

// Aceita só categorias bem formadas (vale também para dados vindos da nuvem/backup)
export function limparCategoriasExtras(bruto) {
  if (!Array.isArray(bruto)) {
    return []
  }

  const vistos = new Set()
  const limpas = []

  for (const c of bruto) {
    if (
      c &&
      typeof c === "object" &&
      typeof c.id === "string" && /^c_[a-z0-9]+$/.test(c.id) &&
      !vistos.has(c.id) &&
      typeof c.nome === "string" && c.nome.trim() !== "" &&
      typeof c.cor === "string" && /^#[0-9a-fA-F]{6}$/.test(c.cor)
    ) {
      vistos.add(c.id)
      limpas.push({
        id: c.id,
        nome: c.nome.trim().slice(0, LIMITE_NOME_CATEGORIA),
        icone: ICONES_ESCOLHA.includes(c.icone) ? c.icone : "outros",
        cor: c.cor
      })
    }
  }

  return limpas
}

export function registrarCategorias(lista) {
  extras = {}

  for (const c of limparCategoriasExtras(lista)) {
    extras[c.id] = { nome: c.nome, icone: c.icone, cor: c.cor, tipo: "ambos", personalizada: true }
  }
}

// Todas as categorias (as do app + as do usuário): [[chave, info], ...]
export function todasCategorias() {
  return [...Object.entries(CATEGORIAS), ...Object.entries(extras)]
}

export function infoCategoria(chave) {
  if (chave === "caixinha") {
    return CAIXINHA
  }

  return CATEGORIAS[chave] || extras[chave] || null
}

export function nomeCategoria(chave) {
  return infoCategoria(chave)?.nome || chave
}

export function categoriaCompativel(chave, tipo) {
  const info = CATEGORIAS[chave] || extras[chave]

  if (!info) {
    return false
  }

  return !tipo || info.tipo === "ambos" || info.tipo === tipo
}

// Categorias que fazem sentido para o tipo escolhido: [[chave, info], ...]
export function categoriasPara(tipo) {
  return todasCategorias().filter(([chave]) =>
    categoriaCompativel(chave, tipo)
  )
}

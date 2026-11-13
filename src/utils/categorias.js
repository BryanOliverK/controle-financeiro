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

export function infoCategoria(chave) {
  if (chave === "caixinha") {
    return CAIXINHA
  }

  return CATEGORIAS[chave] || null
}

export function nomeCategoria(chave) {
  return infoCategoria(chave)?.nome || chave
}

export function categoriaCompativel(chave, tipo) {
  const info = CATEGORIAS[chave]

  if (!info) {
    return false
  }

  return !tipo || info.tipo === "ambos" || info.tipo === tipo
}

// Categorias que fazem sentido para o tipo escolhido: [[chave, info], ...]
export function categoriasPara(tipo) {
  return Object.entries(CATEGORIAS).filter(([chave]) =>
    categoriaCompativel(chave, tipo)
  )
}

import { categoriaCompativel } from "./categorias"

export const LIMITE_DESCRICAO = 40

// Devolve a mensagem de erro ou null se estiver tudo certo.
// Usada tanto para adicionar quanto para editar.
export function validarTransacao({ descricao, valor, tipo, categoria }) {
  if (descricao.trim() === "") {
    return "Adicione uma Descrição!"
  }

  if (valor === "" || valor === null || valor === undefined) {
    return "Adicione um valor!"
  }

  const numero = Number(valor)

  if (!Number.isFinite(numero) || numero <= 0) {
    return "Adicione um valor válido"
  }

  if (tipo === "") {
    return "Adicione um tipo"
  }

  if (categoria === "") {
    return "Selecione uma categoria"
  }

  if (!categoriaCompativel(categoria, tipo)) {
    return "Essa categoria não combina com o tipo escolhido"
  }

  return null
}

import { celulaCSV } from "./formatar"

// Monta o CSV (separador ";" e BOM para o Excel abrir com acentos) e baixa.
export function baixarCSV(transacoes, nomeArquivo) {
  const cabecalho = ["Data", "Descrição", "Tipo", "Categoria", "Valor"]

  const linhas = transacoes.map((t) => [
    new Date(t.data).toLocaleDateString("pt-BR"),
    celulaCSV(t.descricao),
    t.tipo === "entrada" ? "Entrada" : "Saída",
    t.categoria || "",
    t.valor.toFixed(2).replace(".", ",")
  ])

  const csv = "﻿" + [cabecalho, ...linhas]
    .map((linha) => linha.join(";"))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = nomeArquivo
  link.click()

  URL.revokeObjectURL(url)
}

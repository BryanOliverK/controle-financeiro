import { describe, it, expect } from "vitest"
import { escaparHtml, montarRelatorioHtml } from "./relatorio"

describe("escaparHtml", () => {
  it("escapa os caracteres perigosos", () => {
    expect(escaparHtml(`<img src=x onerror="a()"> & 'b'`))
      .toBe("&lt;img src=x onerror=&quot;a()&quot;&gt; &amp; &#39;b&#39;")
  })

  it("aceita nulo e números", () => {
    expect(escaparHtml(null)).toBe("")
    expect(escaparHtml(42)).toBe("42")
  })
})

describe("montarRelatorioHtml", () => {
  const dados = {
    titulo: "Novembro de 2026",
    geradoEm: "15/11/2026",
    resumo: { saldo: 100, entradas: 300, saidas: 200 },
    categorias: [{ nome: "Casa", valor: 200, porcentagem: 100 }],
    transacoes: [{ data: new Date(2026, 10, 5, 12).toISOString(), descricao: "Mercado", categoriaNome: "Casa", tipo: "saida", valor: 200 }]
  }

  it("monta uma página completa com o título e os dados", () => {
    const html = montarRelatorioHtml(dados)
    expect(html).toContain("<!doctype html>")
    expect(html).toContain("Novembro de 2026")
    expect(html).toContain("Mercado")
  })

  it("texto digitado pelo usuário nunca vira HTML (descrição, categoria, título)", () => {
    const html = montarRelatorioHtml({
      ...dados,
      titulo: "<script>alert(1)</script>",
      categorias: [{ nome: "<b>x</b>", valor: 1, porcentagem: 100 }],
      transacoes: [{ ...dados.transacoes[0], descricao: "<img src=x onerror=alert(1)>", categoriaNome: "<i>y</i>" }]
    })
    expect(html).not.toContain("<script>alert(1)")
    expect(html).not.toContain("<img src=x")
    expect(html).not.toContain("<b>x</b>")
    expect(html).not.toContain("<i>y</i>")
    expect(html).toContain("&lt;img src=x")
  })
})

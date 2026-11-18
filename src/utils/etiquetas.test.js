import { describe, expect, it } from "vitest"
import {
  LIMITE_ETIQUETA, MAX_ETIQUETAS,
  adicionarEtiqueta, buscaBateEtiqueta, contarEtiquetas, extrairEtiquetas,
  limparEtiqueta, limparEtiquetas, removerEtiqueta, sugestoesEtiqueta, temEtiqueta
} from "./etiquetas"
import { filtrar } from "./calculos"
import { interpretarRapido, sugestoesDescricao } from "./rapido"
import { gerarParcelas } from "./parcelas"
import { criarRecorrente, gerarPendentes } from "./recorrentes"
import { lerBackup } from "./backup"

describe("limparEtiqueta", () => {
  it("tira # e espaços, deixa minúscula", () => {
    expect(limparEtiqueta("  #Viagem  ")).toBe("viagem")
    expect(limparEtiqueta("Viagem Rio")).toBe("viagem-rio")
  })

  it("mantém acentos e números, remove símbolos", () => {
    expect(limparEtiqueta("Férias 2026!")).toBe("férias-2026")
    expect(limparEtiqueta("a@b$c")).toBe("abc")
  })

  it("corta no limite e não termina em traço", () => {
    const e = limparEtiqueta("a".repeat(10) + " " + "b".repeat(30))
    expect(e.length <= LIMITE_ETIQUETA).toBe(true)
    expect(e.endsWith("-")).toBe(false)
  })

  it("lixo vira texto vazio", () => {
    expect(limparEtiqueta("")).toBe("")
    expect(limparEtiqueta("###")).toBe("")
    expect(limparEtiqueta(null)).toBe("")
    expect(limparEtiqueta(undefined)).toBe("")
    expect(limparEtiqueta(42)).toBe("42")
  })
})

describe("limparEtiquetas", () => {
  it("aceita só lista, sem repetidas, no máximo 5", () => {
    expect(limparEtiquetas("viagem")).toEqual([])
    expect(limparEtiquetas(null)).toEqual([])
    expect(limparEtiquetas(["Viagem", "#viagem", "casa", "", "  "])).toEqual(["viagem", "casa"])
    expect(limparEtiquetas(["a", "b", "c", "d", "e", "f", "g"]).length).toBe(MAX_ETIQUETAS)
  })
})

describe("adicionar e remover", () => {
  it("adiciona limpando o texto", () => {
    expect(adicionarEtiqueta([], " #Casa ")).toEqual(["casa"])
  })

  it("ignora repetida, vazia e acima do limite", () => {
    const lista = ["casa"]
    expect(adicionarEtiqueta(lista, "CASA")).toBe(lista)
    expect(adicionarEtiqueta(lista, "  ")).toBe(lista)

    const cheia = ["a", "b", "c", "d", "e"]
    expect(adicionarEtiqueta(cheia, "f")).toBe(cheia)
  })

  it("remove uma etiqueta", () => {
    expect(removerEtiqueta(["a", "b"], "a")).toEqual(["b"])
  })
})

describe("extrairEtiquetas", () => {
  it("separa as #palavras do texto", () => {
    expect(extrairEtiquetas("mercado 85 #casa #Festa")).toEqual({ texto: "mercado 85", etiquetas: ["casa", "festa"] })
  })

  it("# no meio do texto também vale", () => {
    expect(extrairEtiquetas("mercado #casa 85")).toEqual({ texto: "mercado 85", etiquetas: ["casa"] })
  })

  it("não confunde # colado em outra palavra", () => {
    expect(extrairEtiquetas("item#3 10")).toEqual({ texto: "item#3 10", etiquetas: [] })
  })

  it("sem etiqueta, só limpa os espaços", () => {
    expect(extrairEtiquetas("  mercado   85 ")).toEqual({ texto: "mercado 85", etiquetas: [] })
  })
})

const lista = [
  { id: 1, descricao: "Hotel", valor: 300, tipo: "saida", categoria: "lazer", data: "2026-11-02T12:00:00", etiquetas: ["viagem", "rio"] },
  { id: 2, descricao: "Passagem", valor: 200, tipo: "saida", categoria: "transporte", data: "2026-11-03T12:00:00", etiquetas: ["viagem"] },
  { id: 3, descricao: "Mercado", valor: 80, tipo: "saida", categoria: "alimentacao", data: "2026-11-04T12:00:00" },
  { id: 4, descricao: "Antigo", valor: 10, tipo: "saida", categoria: "lazer", data: "2026-11-05T12:00:00", etiquetas: ["viagem"], oculta: true }
]

describe("contarEtiquetas", () => {
  it("conta por uso, mais usadas primeiro, sem as ocultas", () => {
    expect(contarEtiquetas(lista)).toEqual([{ nome: "viagem", qtd: 2 }, { nome: "rio", qtd: 1 }])
  })

  it("lista vazia ou sem etiquetas", () => {
    expect(contarEtiquetas([])).toEqual([])
    expect(contarEtiquetas([lista[2]])).toEqual([])
  })
})

describe("sugestoesEtiqueta", () => {
  const usadas = [{ nome: "viagem", qtd: 5 }, { nome: "vizinho", qtd: 1 }, { nome: "casa", qtd: 3 }]

  it("sem digitar, as mais usadas que ainda não foram escolhidas", () => {
    expect(sugestoesEtiqueta(usadas, ["viagem"], "")).toEqual(["casa", "vizinho"])
  })

  it("filtra pelo que foi digitado, começando por ele primeiro", () => {
    expect(sugestoesEtiqueta(usadas, [], "vi")).toEqual(["viagem", "vizinho"])
    expect(sugestoesEtiqueta(usadas, [], "#asa")).toEqual(["casa"])
  })

  it("respeita o limite", () => {
    expect(sugestoesEtiqueta(usadas, [], "", 1)).toEqual(["viagem"])
  })
})

describe("busca e filtro por etiqueta", () => {
  it("temEtiqueta", () => {
    expect(temEtiqueta(lista[0], "rio")).toBe(true)
    expect(temEtiqueta(lista[2], "rio")).toBe(false)
  })

  it("buscaBateEtiqueta aceita pedaço e #", () => {
    expect(buscaBateEtiqueta(lista[0], "#viag")).toBe(true)
    expect(buscaBateEtiqueta(lista[0], "")).toBe(false)
    expect(buscaBateEtiqueta(lista[2], "viagem")).toBe(false)
  })

  it("filtrar acha pela etiqueta na busca", () => {
    const ids = filtrar(lista, { busca: "viagem", filtroTipo: "todos" }).map((t) => t.id)
    expect(ids).toEqual([1, 2, 4])
  })

  it("filtrar por etiqueta exata combina com o tipo", () => {
    expect(filtrar(lista, { busca: "", filtroTipo: "todos", filtroEtiqueta: "rio" }).map((t) => t.id)).toEqual([1])
    expect(filtrar(lista, { busca: "", filtroTipo: "entrada", filtroEtiqueta: "rio" })).toEqual([])
  })

  it("sem filtro de etiqueta, tudo como antes", () => {
    expect(filtrar(lista, { busca: "", filtroTipo: "todos" }).length).toBe(4)
  })
})

describe("lançamento rápido com #etiqueta", () => {
  it("devolve as etiquetas e não atrapalha o valor", () => {
    expect(interpretarRapido("mercado 85 #casa")).toEqual({ ok: true, descricao: "Mercado", valor: 85, tipo: "saida", etiquetas: ["casa"] })
  })

  it("etiqueta com número não vira valor", () => {
    const r = interpretarRapido("hotel 300 #rio2026")
    expect(r.valor).toBe(300)
    expect(r.etiquetas).toEqual(["rio2026"])
  })

  it("sem #, o resultado não ganha o campo", () => {
    expect("etiquetas" in interpretarRapido("mercado 85")).toBe(false)
  })

  it("só a etiqueta não é lançamento", () => {
    expect(interpretarRapido("#casa").ok).toBe(false)
  })
})

describe("etiquetas seguem junto", () => {
  it("sugestão de descrição traz as etiquetas do último lançamento", () => {
    const s = sugestoesDescricao("hotel", lista)
    expect(s[0].etiquetas).toEqual(["viagem", "rio"])
    expect("etiquetas" in sugestoesDescricao("mercado", lista)[0]).toBe(false)
  })

  it("parcelas herdam as etiquetas", () => {
    const p = gerarParcelas({ descricao: "TV", valorTotal: 300, tipo: "saida", categoria: "compras", etiquetas: ["casa"] }, "2026-11-10T12:00:00", 3)
    expect(p.every((x) => x.etiquetas.length === 1 && x.etiquetas[0] === "casa")).toBe(true)
    const q = gerarParcelas({ descricao: "TV", valorTotal: 300, tipo: "saida", categoria: "compras" }, "2026-11-10T12:00:00", 3)
    expect("etiquetas" in q[0]).toBe(false)
  })

  it("repetição mensal guarda e repassa as etiquetas", () => {
    const base = { descricao: "Aluguel", valor: 1000, tipo: "saida", categoria: "casa", etiquetas: ["moradia"] }
    const rec = criarRecorrente(base, "2026-09-05T12:00:00")
    expect(rec.etiquetas).toEqual(["moradia"])

    const r = gerarPendentes([{ ...rec, proximoMes: "2026-10" }], new Date(2026, 10, 20))
    expect(r.transacoes.length >= 1).toBe(true)
    expect(r.transacoes.every((t) => t.etiquetas[0] === "moradia")).toBe(true)
  })
})

describe("backup com etiquetas", () => {
  const arquivo = (obj) => {
    const texto = JSON.stringify(obj)
    return { size: texto.length, text: async () => texto }
  }

  const base = { id: "a", descricao: "x", valor: 1, tipo: "saida", categoria: "casa", data: "2026-11-01T12:00:00" }

  it("mantém as etiquetas boas e limpa as ruins", async () => {
    const r = await lerBackup(arquivo({
      caixinhas: [],
      transacoes: [
        { ...base, etiquetas: ["#Viagem", "viagem", "", 5] },
        { ...base, id: "b", etiquetas: "texto" }
      ]
    }))

    expect(r.transacoes[0].etiquetas).toEqual(["viagem", "5"])
    expect("etiquetas" in r.transacoes[1]).toBe(false)
  })

  it("repetição mensal também guarda", async () => {
    const r = await lerBackup(arquivo({
      transacoes: [],
      caixinhas: [],
      recorrentes: [{ id: "r", descricao: "Aluguel", valor: 1, tipo: "saida", categoria: "casa", dia: 5, proximoMes: "2026-12", etiquetas: ["Moradia"] }]
    }))

    expect(r.recorrentes[0].etiquetas).toEqual(["moradia"])
  })
})

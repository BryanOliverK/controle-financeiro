import { describe, it, expect } from "vitest"
import {
  aprenderCategorias, interpretarExtrato, lerData, lerValor, normalizar,
  prepararLinhas, sugerirCategoria
} from "./extrato"

const dia = (iso) => { const d = new Date(iso); return [d.getFullYear(), d.getMonth() + 1, d.getDate()] }

describe("lerValor", () => {
  it("formatos brasileiros e internacionais", () => {
    expect(lerValor("1.234,56")).toBe(1234.56)
    expect(lerValor("-1.234,56")).toBe(-1234.56)
    expect(lerValor("R$ 10,00")).toBe(10)
    expect(lerValor("-R$ 10,50")).toBe(-10.5)
    expect(lerValor("1234.56")).toBe(1234.56)
    expect(lerValor("-1,234.56")).toBe(-1234.56)
    expect(lerValor("1.234.567,89")).toBe(1234567.89)
    expect(lerValor("25,90")).toBe(25.9)
    expect(lerValor("+5")).toBe(5)
  })

  it("negativos com parênteses, sinal no fim e sinal unicode", () => {
    expect(lerValor("(25,90)")).toBe(-25.9)
    expect(lerValor("25,90-")).toBe(-25.9)
    expect(lerValor("−10,00")).toBe(-10)
  })

  it("lixo vira null", () => {
    expect(lerValor("")).toBe(null)
    expect(lerValor(undefined)).toBe(null)
    expect(lerValor("abc")).toBe(null)
    expect(lerValor("--")).toBe(null)
    expect(lerValor("1,2,3a")).toBe(null)
    expect(lerValor("12/03/2026")).toBe(null)
  })
})

describe("lerData", () => {
  it("formatos comuns (dia antes do mês)", () => {
    expect(dia(lerData("05/11/2026"))).toEqual([2026, 11, 5])
    expect(dia(lerData("5/1/26"))).toEqual([2026, 1, 5])
    expect(dia(lerData("2026-11-05"))).toEqual([2026, 11, 5])
    expect(dia(lerData("2026-11-05 14:30:00"))).toEqual([2026, 11, 5])
    expect(dia(lerData("05-11-2026"))).toEqual([2026, 11, 5])
    expect(dia(lerData("20261105120000[-3:BRT]"))).toEqual([2026, 11, 5])
  })

  it("datas impossíveis ou lixo", () => {
    expect(lerData("31/02/2026")).toBe(null)
    expect(lerData("32/01/2026")).toBe(null)
    expect(lerData("00/01/2026")).toBe(null)
    expect(lerData("abc")).toBe(null)
    expect(lerData("")).toBe(null)
    expect(lerData("1850-01-01")).toBe(null)
  })
})

describe("CSV", () => {
  it("separado por ponto e vírgula, com cabeçalho e valores brasileiros", () => {
    const csv = "Data;Histórico;Valor\n05/11/2026;PIX RECEBIDO JOAO;1.500,00\n06/11/2026;UBER *TRIP;-23,90\n"
    const { linhas } = interpretarExtrato(csv)
    expect(linhas).toHaveLength(2)
    expect(linhas[0].valor).toBe(1500)
    expect(linhas[1].valor).toBe(-23.9)
    expect(linhas[1].descricao).toBe("UBER *TRIP")
  })

  it("separado por vírgula, com aspas e vírgula dentro do texto", () => {
    const csv = 'date,title,amount\n2026-11-05,"Mercado, Centro",-50.25\n2026-11-06,"Pagamento ""especial""",10\n'
    const { linhas } = interpretarExtrato(csv)
    expect(linhas[0].descricao).toBe("Mercado, Centro")
    expect(linhas[0].valor).toBe(-50.25)
    expect(linhas[1].descricao).toBe('Pagamento "especial"')
  })

  it("colunas de crédito e débito separadas", () => {
    const csv = "Data;Descrição;Crédito;Débito\n05/11/2026;Salário;3000,00;\n06/11/2026;Aluguel;;1200,00\n"
    const { linhas } = interpretarExtrato(csv)
    expect(linhas.map((l) => l.valor)).toEqual([3000, -1200])
  })

  it("cabeçalho depois de linhas de informação e BOM", () => {
    const csv = "﻿Extrato da conta\nPeríodo: nov/2026\n\nData;Lançamento;Valor\n05/11/2026;Padaria;-12,00\n"
    const { linhas } = interpretarExtrato(csv)
    expect(linhas).toHaveLength(1)
    expect(linhas[0].descricao).toBe("Padaria")
  })

  it("'Data Lançamento' é data, não descrição", () => {
    const csv = "Data Lançamento;Descrição;Valor\n05/11/2026;Cinema;-40,00\n"
    expect(interpretarExtrato(csv).linhas[0].descricao).toBe("Cinema")
  })

  it("sem cabeçalho: adivinha pelo conteúdo", () => {
    const csv = "05/11/2026;Supermercado Bom Preço;-150,00\n06/11/2026;Depósito;200,00\n"
    const { linhas } = interpretarExtrato(csv)
    expect(linhas).toHaveLength(2)
    expect(linhas[0].descricao).toBe("Supermercado Bom Preço")
    expect(linhas[1].valor).toBe(200)
  })

  it("ignora linhas ruins e conta quantas", () => {
    const csv = "Data;Descrição;Valor\n05/11/2026;Ok;-10,00\nSALDO FINAL;;\n32/13/2026;Data ruim;-5,00\n07/11/2026;Zero;0,00\n"
    const r = interpretarExtrato(csv)
    expect(r.linhas).toHaveLength(1)
    expect(r.ignoradas).toBe(3)
  })

  it("descrição vazia e muito longa", () => {
    const csv = `Data;Descrição;Valor\n05/11/2026;;-10,00\n05/11/2026;${"x".repeat(100)};-10,00\n`
    const { linhas } = interpretarExtrato(csv)
    expect(linhas[0].descricao).toBe("Sem descrição")
    expect(linhas[1].descricao.length).toBe(40)
  })

  it("arquivo sem nada útil dá erro amigável", () => {
    expect(() => interpretarExtrato("")).toThrow("vazio")
    expect(() => interpretarExtrato("isso não é extrato\nnada aqui")).toThrow()
    expect(() => interpretarExtrato("Data;Descrição;Valor\n")).toThrow("nenhuma transação")
  })

  it("limita a quantidade de linhas", () => {
    const linhas = Array.from({ length: 1501 }, (_, i) => `05/11/2026;Item ${i};-1,00`).join("\n")
    expect(() => interpretarExtrato("Data;Descrição;Valor\n" + linhas)).toThrow("demais")
  })
})

describe("OFX", () => {
  const ofx = `OFXHEADER:100
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261105120000[-3:BRT]
<TRNAMT>-23.90
<FITID>abc1
<MEMO>UBER *TRIP
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20261106
<TRNAMT>1500.00
<FITID>abc2
<NAME>PIX RECEBIDO
</STMTTRN>
<STMTTRN>
<DTPOSTED>lixo
<TRNAMT>5.00
</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`

  it("lê transações, usando MEMO ou NAME", () => {
    const r = interpretarExtrato(ofx)
    expect(r.linhas.map((l) => [l.descricao, l.valor])).toEqual([["UBER *TRIP", -23.9], ["PIX RECEBIDO", 1500]])
    expect(r.ignoradas).toBe(1)
    expect(dia(r.linhas[0].data)).toEqual([2026, 11, 5])
  })

  it("OFX em uma linha só (sem quebras)", () => {
    const um = "<OFX><STMTTRN><DTPOSTED>20261105<TRNAMT>-5.00<MEMO>Café</STMTTRN></OFX>"
    expect(interpretarExtrato(um).linhas[0].descricao).toBe("Café")
  })
})

describe("sugerirCategoria", () => {
  it("palavras conhecidas", () => {
    expect(sugerirCategoria("UBER *TRIP", "saida")).toBe("transporte")
    expect(sugerirCategoria("IFOOD  PEDIDO", "saida")).toBe("alimentacao")
    expect(sugerirCategoria("Netflix.com", "saida")).toBe("lazer")
    expect(sugerirCategoria("Salário empresa X", "entrada")).toBe("salario")
    expect(sugerirCategoria("Coisa desconhecida", "saida")).toBe("outros")
  })

  it("salário só para entrada", () => {
    expect(sugerirCategoria("Salário", "saida")).toBe("outros")
  })

  it("palavra curta só casa inteira ('99' não pega '1999')", () => {
    expect(sugerirCategoria("Compra 1999", "saida")).toBe("outros")
    expect(sugerirCategoria("99 pop viagem", "saida")).toBe("transporte")
  })

  it("aprende com o histórico, que vence as palavras-chave", () => {
    const historico = [
      { descricao: "Uber Eats lanche", tipo: "saida", categoria: "alimentacao" },
      { descricao: "Uber Eats janta", tipo: "saida", categoria: "alimentacao" },
      { descricao: "Uber Eats pedido", tipo: "saida", categoria: "lazer" }
    ]
    const aprendidas = aprenderCategorias(historico)
    expect(sugerirCategoria("UBER EATS 123", "saida", aprendidas)).toBe("alimentacao")
  })

  it("ignora ocultas e caixinha no aprendizado", () => {
    const a = aprenderCategorias([
      { descricao: "Padaria Pão", tipo: "saida", categoria: "casa", oculta: true },
      { descricao: "Padaria Pão", tipo: "saida", categoria: "caixinha" }
    ])
    expect(a).toEqual({})
  })

  it("normalizar", () => {
    expect(normalizar("  Pão de Açúcar!! ")).toBe("pao de acucar")
  })
})

describe("prepararLinhas", () => {
  const iso = (d) => new Date(2026, 10, d, 12).toISOString()
  const linhas = [
    { data: iso(5), descricao: "Mercado", valor: -100 },
    { data: iso(5), descricao: "Mercado", valor: -100 },
    { data: iso(6), descricao: "Salário", valor: 3000 }
  ]

  it("define tipo e valor absoluto pelo sinal", () => {
    const r = prepararLinhas(linhas)
    expect(r.map((x) => [x.tipo, x.valor])).toEqual([["saida", 100], ["saida", 100], ["entrada", 3000]])
    expect(r[2].categoria).toBe("salario")
  })

  it("inverter troca entrada e saída", () => {
    const r = prepararLinhas(linhas, { inverter: true })
    expect(r.map((x) => x.tipo)).toEqual(["entrada", "entrada", "saida"])
  })

  it("marca duplicadas, uma a uma (duas iguais no arquivo e uma já existente = só a primeira repete)", () => {
    const existentes = [{ id: "1", descricao: "Mercado X", valor: 100, tipo: "saida", data: iso(5) }]
    const r = prepararLinhas(linhas, { existentes })
    expect(r.map((x) => x.duplicada)).toEqual([true, false, false])
  })

  it("ignora ocultas ao detectar duplicata e não confunde dia/valor/tipo", () => {
    const existentes = [
      { id: "1", valor: 100, tipo: "saida", data: iso(5), oculta: true },
      { id: "2", valor: 100, tipo: "entrada", data: iso(5) },
      { id: "3", valor: 100, tipo: "saida", data: iso(7) }
    ]
    expect(prepararLinhas(linhas, { existentes }).some((x) => x.duplicada)).toBe(false)
  })

  it("chaves únicas e valores sem erro de ponto flutuante", () => {
    const r = prepararLinhas([{ data: iso(5), descricao: "a", valor: -0.1 - 0.2 }, { data: iso(5), descricao: "b", valor: 1 }])
    expect(r[0].valor).toBe(0.3)
    expect(new Set(r.map((x) => x.chave)).size).toBe(2)
  })
})

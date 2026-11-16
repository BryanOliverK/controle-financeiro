import { useEffect, useMemo, useState } from "react"
import Icone from "./Icone"
import { categoriaCompativel, categoriasPara } from "../utils/categorias"
import { lerArquivoExtrato, prepararLinhas } from "../utils/extrato"
import { arredondar, brl } from "../utils/formatar"
import { LIMITE_DESCRICAO } from "../utils/validacao"

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`
const dataCurta = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })

// Importa um extrato (CSV ou OFX) em duas etapas: escolher o arquivo e conferir.
// Nada entra no app até você confirmar; possíveis repetidas vêm desmarcadas.
function ImportarExtrato({ transacoes, contas, onImportar, onFechar }) {

  const [linhas, setLinhas] = useState(null)
  const [ignoradas, setIgnoradas] = useState(0)
  const [nomeArquivo, setNomeArquivo] = useState("")
  const [erro, setErro] = useState("")
  const [lendo, setLendo] = useState(false)

  const [inverter, setInverter] = useState(false)
  const [contaId, setContaId] = useState("")

  // Mudanças do usuário sobre a sugestão: linhas desmarcadas, duplicadas marcadas e edições
  const [desmarcadas, setDesmarcadas] = useState(new Set())
  const [duplicadasMarcadas, setDuplicadasMarcadas] = useState(new Set())
  const [edicoes, setEdicoes] = useState({})

  useEffect(() => {
    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        onFechar()
      }
    }

    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [onFechar])

  const itens = useMemo(
    () => (linhas ? prepararLinhas(linhas, { inverter, existentes: transacoes, historico: transacoes }) : []),
    [linhas, inverter, transacoes]
  )

  async function escolherArquivo(evento) {
    const arquivo = evento.target.files?.[0]

    if (!arquivo) {
      return
    }

    setErro("")
    setLendo(true)

    try {
      const resultado = await lerArquivoExtrato(arquivo)
      setLinhas(resultado.linhas)
      setIgnoradas(resultado.ignoradas)
      setNomeArquivo(arquivo.name)
      setDesmarcadas(new Set())
      setDuplicadasMarcadas(new Set())
      setEdicoes({})
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler esse arquivo.")
    } finally {
      setLendo(false)
      evento.target.value = ""
    }
  }

  const marcada = (item) => (item.duplicada ? duplicadasMarcadas.has(item.chave) : !desmarcadas.has(item.chave))

  function alternar(item) {
    const alterar = (atual) => {
      const novo = new Set(atual)
      novo.has(item.chave) ? novo.delete(item.chave) : novo.add(item.chave)
      return novo
    }

    if (item.duplicada) {
      setDuplicadasMarcadas(alterar)
    } else {
      setDesmarcadas(alterar)
    }
  }

  function marcarTodas(marcar) {
    setDesmarcadas(marcar ? new Set() : new Set(itens.filter((i) => !i.duplicada).map((i) => i.chave)))
    setDuplicadasMarcadas(marcar ? new Set(itens.filter((i) => i.duplicada).map((i) => i.chave)) : new Set())
  }

  function editar(chave, campo, valor) {
    setEdicoes((atual) => ({ ...atual, [chave]: { ...atual[chave], [campo]: valor } }))
  }

  // Descrição e categoria já com as edições do usuário (categoria ruim para o tipo volta à sugestão)
  const final = itens.map((item) => {
    const e = edicoes[item.chave] || {}
    const categoria = e.categoria && categoriaCompativel(e.categoria, item.tipo) ? e.categoria : item.categoria

    return { ...item, descricao: e.descricao ?? item.descricao, categoria }
  })

  const selecionadas = final.filter(marcada)
  const duplicadas = final.filter((i) => i.duplicada).length
  const somar = (tipo) => arredondar(selecionadas.filter((i) => i.tipo === tipo).reduce((s, i) => s + i.valor, 0))

  function confirmar() {
    onImportar(
      selecionadas.map((i) => ({
        descricao: i.descricao.trim() === "" ? "Sem descrição" : i.descricao.trim().slice(0, LIMITE_DESCRICAO),
        valor: i.valor,
        tipo: i.tipo,
        categoria: i.categoria,
        data: i.data
      })),
      contaId
    )
  }

  return (
    <div className="ajuda-fundo" onClick={onFechar}>
      <div
        className="ajuda-janela imp-janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby="imp-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >

        <div className="limpar-topo">
          <h2 id="imp-titulo">Importar extrato</h2>

          <button type="button" className="limpar-fechar" onClick={onFechar} aria-label="Fechar" title="Fechar">
            <Icone nome="adicionar" tamanho={20} className="limpar-x" />
          </button>
        </div>

        {!linhas && (
          <div className="imp-corpo">
            <p className="lh-ajuda">
              Baixe o extrato no app ou site do seu banco (formato <strong>CSV</strong> ou{" "}
              <strong>OFX</strong>) e escolha o arquivo aqui. Você confere tudo antes de
              importar, e o arquivo não sai do seu aparelho.
            </p>

            <label className="imp-arquivo">
              <input type="file" accept=".csv,.ofx,.qfx,.txt,text/csv" onChange={escolherArquivo} disabled={lendo} />
              {lendo ? "Lendo..." : "Escolher arquivo"}
            </label>

            {erro && <p className="gc-erro" role="alert">{erro}</p>}
          </div>
        )}

        {linhas && (
          <>
            <div className="imp-opcoes">
              <p className="lh-ajuda">
                <strong>{nomeArquivo}</strong>: {plural(linhas.length, "transação encontrada", "transações encontradas")}
                {ignoradas > 0 && ` (${plural(ignoradas, "linha ignorada", "linhas ignoradas")})`}.
                {duplicadas > 0 && ` ${plural(duplicadas, "parece repetida", "parecem repetidas")} de transações que você já tem e começou desmarcada.`}
              </p>

              {contas.length > 0 && (
                <label className="imp-campo">
                  Conta
                  <select value={contaId} onChange={(e) => setContaId(e.target.value)}>
                    <option value="">Sem conta</option>
                    {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </label>
              )}

              <label className="imp-inverter">
                <input type="checkbox" checked={inverter} onChange={(e) => setInverter(e.target.checked)} />
                Inverter entradas e saídas (use se as compras apareceram como entrada)
              </label>

              <div className="imp-marcar">
                <button type="button" className="divida-desfazer" onClick={() => marcarTodas(true)}>Marcar todas</button>
                <button type="button" className="divida-desfazer" onClick={() => marcarTodas(false)}>Desmarcar todas</button>
              </div>
            </div>

            <ul className="imp-lista">
              {final.map((item) => (
                <li key={item.chave} className={`imp-item ${item.tipo}${marcada(item) ? "" : " desmarcada"}`}>

                  <input
                    type="checkbox"
                    checked={marcada(item)}
                    onChange={() => alternar(item)}
                    aria-label={`Importar ${item.descricao}`}
                  />

                  <div className="imp-item-meio">
                    <input
                      type="text"
                      value={item.descricao}
                      maxLength={LIMITE_DESCRICAO}
                      aria-label="Descrição"
                      onChange={(e) => editar(item.chave, "descricao", e.target.value.slice(0, LIMITE_DESCRICAO))}
                    />

                    <div className="imp-item-baixo">
                      <small>{dataCurta(item.data)}</small>

                      <select
                        value={item.categoria}
                        aria-label="Categoria"
                        onChange={(e) => editar(item.chave, "categoria", e.target.value)}
                      >
                        {categoriasPara(item.tipo).map(([chave, info]) => (
                          <option key={chave} value={chave}>{info.nome}</option>
                        ))}
                      </select>

                      {item.duplicada && <span className="imp-dup" title="Já existe uma transação igual neste dia">Repetida?</span>}
                    </div>
                  </div>

                  <span className="imp-valor">
                    {item.tipo === "entrada" ? "+" : "-"}{brl(item.valor)}
                  </span>

                </li>
              ))}
            </ul>

            <div className="imp-rodape">
              <p>
                <strong>{plural(selecionadas.length, "selecionada", "selecionadas")}</strong>
                {selecionadas.length > 0 && (
                  <> · <span className="imp-entra">+{brl(somar("entrada"))}</span> · <span className="imp-sai">-{brl(somar("saida"))}</span></>
                )}
              </p>

              <div className="form-acoes">
                <button type="button" className="btn-salvar" disabled={selecionadas.length === 0} onClick={confirmar}>
                  Importar {selecionadas.length > 0 && selecionadas.length}
                </button>

                <button type="button" className="btn-cancelar" onClick={() => { setLinhas(null); setErro("") }}>
                  Outro arquivo
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

export default ImportarExtrato

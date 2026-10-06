import { useEffect, useState } from 'react'

import Header from './components/Header'
import Resumo from './components/Resumo'
import Transacao from './components/Transacao'
import Categorias from './components/Categorias'

import './App.css'
import './categorias.css'

function App() {

  // Estados

  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [ordenacao, setOrdenacao] = useState("recentes")

  const [aba, setAba] = useState("inicio")
  const [privado, setPrivado] = useState(true)

  const [saldo, setSaldo] = useState(() => {
    const saldoSalvo = localStorage.getItem("saldo")

    if (saldoSalvo) {
      return Number(saldoSalvo)
    }

    return 0
  })

  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [tipo, setTipo] = useState("")
  const [categoria, setCategoria] = useState("")

  const [transacaoEditando, setTransacaoEditando] = useState(null)

  const [entradas, setEntradas] = useState(() => {
    const entradasSalvas = localStorage.getItem("entradas")

    if (entradasSalvas) {
      return Number(entradasSalvas)
    }

    return 0
  })
  const [saidas, setSaidas] = useState(() => {
    const saidasSalvas = localStorage.getItem("saidas")

    if (saidasSalvas) {
      return Number(saidasSalvas)
    }

    return 0
  })

  const [modoEscuro, setModoEscuro] = useState(() => {
    const temaSalvo = localStorage.getItem("modoEscuro")

    if (temaSalvo) {
      return JSON.parse(temaSalvo)
    }

    return false
  })

  const [transacoes, setTransacoes] = useState(() => {
    const dadosSalvos = localStorage.getItem("transacoes")

    if (dadosSalvos) {
      return JSON.parse(dadosSalvos)
    }

    return[]
  })

  useEffect(() => {
    localStorage.setItem("transacoes", JSON.stringify(transacoes))
  },[transacoes])

  useEffect(() => {
    localStorage.setItem("saldo", saldo)
  }, [saldo])

  useEffect(() => {
    localStorage.setItem("entradas", entradas)
  }, [entradas])

  useEffect(() => {
    localStorage.setItem("saidas", saidas)
  }, [saidas])

  useEffect(() => {
    localStorage.setItem("modoEscuro", JSON.stringify(modoEscuro))
  }, [modoEscuro])

  // Funções

  function adicionarTransacao() {

    if (descricao === "") {
      alert("Adicione uma Descrição!")
      return
    }

    if (valor === "") {
      alert("Adicione um valor!")
      return
    }

    if (tipo === "") {
      alert("Adicione um tipo")
      return
    }

    if (categoria === "") {
      alert("Selecione uma categoria")
      return
    }

    const valorNumerico = Number(valor)

    if (valorNumerico <= 0) {
      alert("Adicione um valor válido")
      return
    }

    if (tipo === "entrada") {
      setSaldo(saldo + valorNumerico)
      setEntradas(entradas + valorNumerico)
    }

    if (tipo === "saida") {
      setSaldo(saldo - valorNumerico)
      setSaidas(saidas + valorNumerico)
    }

    setTransacoes([
      ...transacoes,
      {
        id: Date.now(),
        descricao: descricao,
        valor: valorNumerico,
        tipo,
        categoria,
        data: new Date().toISOString()
      }
    ])

    setDescricao("")
    setValor("")
    setTipo("")
    setCategoria("")
  }

  function editarTransacao(id) {

    const transacao = transacoes.find((transacao) => {
      return transacao.id === id
    })

    setDescricao(transacao.descricao)
    setValor(transacao.valor)
    setCategoria(transacao.categoria)
    setTipo(transacao.tipo)
    setTransacaoEditando(id)
  }

  function salvarFormulario() {

    if (transacaoEditando) {

      // Validações

      if (descricao === "") {
        alert("Adicione uma Descrição!")
        return
      }

      if (valor === "") {
        alert("Adicione um valor!")
        return
      }

      const novoValor = Number(valor)

      if (novoValor <= 0) {
        alert("Adicione um valor válido")
        return
      }

      if (tipo === "") {
        alert("Adicione um tipo")
        return
      }

      if (categoria === "") {
        alert("Selecione uma categoria")
        return
      }

      // Encontra a transação antiga

      const transacaoAntiga = transacoes.find((transacao) => {
        return transacao.id === transacaoEditando
      })

      // Desfaz o valor da transação antiga

      if (transacaoAntiga.tipo === "entrada") {
        setSaldo((saldoAtual) => saldoAtual - transacaoAntiga.valor)
        setEntradas((entradasAtuais) => entradasAtuais - transacaoAntiga.valor)
      }

      if (transacaoAntiga.tipo === "saida") {
        setSaldo((saldoAtual) => saldoAtual + transacaoAntiga.valor)
        setSaidas((saidasAtuais) => saidasAtuais - transacaoAntiga.valor)
      }

      // Atualiza a transação

      const novasTransacoes = transacoes.map((transacao) => {

        if (transacao.id === transacaoEditando) {

          return {
            ...transacao,
            descricao: descricao,
            valor: novoValor,        
            tipo: tipo,
            categoria: categoria
          }

        }

        return transacao
      })

      // Aplica o novo valor

      if (tipo === "entrada") {
        setSaldo((saldoAtual) => saldoAtual + novoValor)
        setEntradas((entradasAtuais) => entradasAtuais + novoValor)
      }

      if (tipo === "saida") {
        setSaldo((saldoAtual) => saldoAtual - novoValor)
        setSaidas((saidasAtuais) => saidasAtuais + novoValor)
      }

      setTransacoes(novasTransacoes)

      // Sai do modo de edição

      setTransacaoEditando(null)
      setDescricao("")
      setValor("")
      setCategoria("")
      setTipo("")

    } else {

      adicionarTransacao()

    }
  }

  function excluirTransacao(id) {

    const transacao = transacoes.find((transacao) => {
      return transacao.id === id
    })

    if (transacao.tipo === "entrada") {
      setSaldo(saldo - transacao.valor)
      setEntradas(entradas - transacao.valor)
    }

    if (transacao.tipo === "saida") {
      setSaldo(saldo + transacao.valor)
      setSaidas(saidas - transacao.valor)
    }

    const novastransacoes = transacoes.filter((transacao) => {
      return transacao.id !== id
    })

    setTransacoes(novastransacoes)
  }

  // Filtra as transações pela busca

  function formatarData(data) {

    const dataTransacao = new Date(data)
    const hoje = new Date()

    const mesmaData =
      dataTransacao.getDate() === hoje.getDate() &&
      dataTransacao.getMonth() === hoje.getMonth() &&
      dataTransacao.getFullYear() === hoje.getFullYear()

    if (mesmaData) {
      return "HOJE"
    }

    const ontem = new Date()
    ontem.setDate(hoje.getDate() - 1)

    const foiOntem =
      dataTransacao.getDate() === ontem.getDate() &&
      dataTransacao.getMonth() === ontem.getMonth() &&
      dataTransacao.getFullYear() === ontem.getFullYear()

    if (foiOntem) {
      return "ONTEM"
    }

    return dataTransacao.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).toUpperCase()
  }

  const transacoesFiltradas = transacoes.filter((transacao) => {
    return (
      transacao.descricao
        .toLowerCase()
        .includes(busca.toLowerCase().trim())
      &&
      (filtroTipo === "todos" || transacao.tipo === filtroTipo)
    )
  })

  const transacoesOrdenadas = [...transacoesFiltradas].sort((a,b) => {

    if (ordenacao === "recentes") {
      return b.id - a.id
    }

    if (ordenacao === "antigas") {
      return a.id - b.id
    }

    if (ordenacao === "maiorValor") {
      return b.valor - a.valor
    }

    if (ordenacao === "menorValor") {
      return a.valor - b.valor
    }

    return 0
  })
  
  const transacoesPorData = transacoesOrdenadas.reduce((grupos, transacao) => {
    const data = formatarData(transacao.data)
    
    if (!grupos[data]) {
      grupos[data] = []
    }

    grupos[data].push(transacao)

    return grupos
  }, {})
  
  const gastosPorCategoria = transacoes.reduce((grupos, transacao) => {
    if (transacao.tipo === "saida") {
      if (!grupos[transacao.categoria]) {
        grupos[transacao.categoria] = 0
      }

      grupos[transacao.categoria] += transacao.valor
    }

    return grupos
  }, {})

  const totalGastos = Object.values(gastosPorCategoria).reduce(
    (total, valor) => total + valor,
    0
  )

  // Navegação

  const abas = [
    { id: "inicio", icone: "📊", nome: "Início" },
    { id: "transacoes", icone: "💳", nome: "Transações" },
    { id: "graficos", icone: "📈", nome: "Gráficos" },
    { id: "nova", icone: "➕", nome: "Adicionar" }
  ]

  const ultimasTransacoes = [...transacoes]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3)

  function iniciarEdicao(id) {
    editarTransacao(id)
    setAba("nova")
  }

  const classesApp = ["app", modoEscuro && "modo-escuro", privado && "privado"]
    .filter(Boolean)
    .join(" ")

  // O que aparece na tela

  return (
    <div className={classesApp}>

      <aside className="sidebar">
        <nav>
          {abas.map((item) => (
            <button
              key={item.id}
              className={aba === item.id ? "sidebar-item ativo" : "sidebar-item"}
              onClick={() => setAba(item.id)}
              aria-current={aba === item.id ? "page" : undefined}
            >
              <span className="sidebar-icone">{item.icone}</span>
              <span className="sidebar-nome">{item.nome}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="conteudo">

        <Header>
          <div className="header-acoes">
            <button
              className="btn-olho"
              onClick={() => setPrivado(!privado)}
              aria-label={privado ? "Mostrar valores" : "Ocultar valores"}
              title={privado ? "Mostrar valores" : "Ocultar valores"}
            >
              {privado ? "🙈" : "👁️"}
            </button>

            <button
              className="btn-tema"
              role="switch"
              aria-checked={modoEscuro}
              aria-label="Alternar modo escuro"
              onClick={() => setModoEscuro(!modoEscuro)}
            >
              <span className="btn-tema-bolinha" />
            </button>
          </div>
        </Header>

        <div className="aba" key={aba}>

          {aba === "inicio" && (
            <>
              <Resumo
                saldo={saldo}
                entradas={entradas}
                saidas={saidas}
              />

              <div className="secao-topo">
                <h2 className="titulo-secao">Últimas transações</h2>
                <button
                  className="link-ver-todas"
                  onClick={() => setAba("transacoes")}
                >
                  Ver todas →
                </button>
              </div>

              <div className="transacoes">
                {ultimasTransacoes.length === 0 && (
                  <p className="vazio">Nenhuma transação ainda.</p>
                )}

                {ultimasTransacoes.map((transacao) => (
                  <div className="transacao" key={transacao.id}>
                    <Transacao
                      descricao={transacao.descricao}
                      valor={transacao.valor}
                      tipo={transacao.tipo}
                      categoria={transacao.categoria}
                      data={transacao.data}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {aba === "transacoes" && (
            <>
              <div className="filtros">
                <input
                  type="text"
                  placeholder="Pesquisar transação"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />

                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}>
                  <option value="todos">Todos</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                </select>

                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value)}>
                  <option value="recentes">Mais recentes</option>
                  <option value="antigas">Mais antigas</option>
                  <option value="maiorValor">Maior valor</option>
                  <option value="menorValor">Menor valor</option>
                </select>
              </div>
            
              <div className="transacoes">
                {transacoesOrdenadas.length === 0 && (
                  <p className="vazio">Nenhuma transação encontrada.</p>
                )}

                {Object.entries(transacoesPorData).map(([data, transacoes]) => (
                  <div className="grupo-data" key={data}>

                    <h3 className="titulo-data">
                      {data}
                    </h3>

                    {transacoes.map((transacao) => (
                      <div className="transacao" key={transacao.id}>

                        <Transacao
                          descricao={transacao.descricao}
                          valor={transacao.valor}
                          tipo={transacao.tipo}
                          categoria={transacao.categoria}
                          data={transacao.data}
                        />

                        <div className="acoes">

                          <button
                            className="btn-editar"
                            onClick={() => iniciarEdicao(transacao.id)}
                          >
                            Editar
                          </button>

                          <button
                            className="btn-excluir"
                            onClick={() => excluirTransacao(transacao.id)}
                          >
                            Excluir
                          </button>

                        </div>

                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

          {aba === "graficos" && (
            <>
              <h2 className="titulo-secao">Gastos por categoria</h2>

              <Categorias
                gastosPorCategoria={gastosPorCategoria}
                totalGastos={totalGastos}
              />
            </>
          )}

          {aba === "nova" && (
            <>
              <h2 className="titulo-secao">
                {transacaoEditando ? "Editar transação" : "Nova transação"}
              </h2>

              <div className="formulario">

                <input
                  type="text"
                  placeholder="Descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Valor"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />

                <select
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value)}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>

                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="">Selecione a Categoria</option>
                  <option value="alimentacao">🍔 Alimentação</option>
                  <option value="lazer">🎮 Lazer</option>
                  <option value="casa">🏠 Casa</option>
                  <option value="transporte">🚗 Transporte</option>
                  <option value="salario">💰 Salario</option>
                  <option value="educacao">📚 Educação</option>
                  <option value="compras">🛒 Compras</option>
                  <option value="outros">📦 Outros</option>
                </select>

                <button onClick={salvarFormulario}>
                  {transacaoEditando
                    ? "Salvar Alteração"
                    : "Adicionar Transação"}
                </button>

              </div>
            </>
          )}

        </div>

      </main>

    </div>
  )
}

export default App

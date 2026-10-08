import { useEffect, useRef, useState } from 'react'

import Header from './components/Header'
import Resumo from './components/Resumo'
import Transacao from './components/Transacao'
import Categorias from './components/Categorias'
import Caixinhas from './components/Caixinhas'
import Login from './components/Login'
import { auth, db, provider } from './firebase'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

import './App.css'
import './categorias.css'
import './menu-mobile.css'
import './extras.css'
import './caixinhas.css'
import './login.css'

const LIMITE_DESCRICAO = 40

// Fica fora do componente para o React não reclamar de função "impura" no render
function novoId() {
  return Date.now()
}

// Junta duas listas pelo id (usado só no primeiro acesso de um aparelho)
function unirPorId(remotas, locais) {
  const ids = new Set(remotas.map((item) => item.id))
  return [...remotas, ...locais.filter((item) => !ids.has(item.id))]
}

function chaveMes(data) {
  const d = new Date(data)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function nomeMes(chave) {
  const [ano, mes] = chave.split("-")
  const nome = new Date(Number(ano), Number(mes) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

function App() {

  // Estados

  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [ordenacao, setOrdenacao] = useState("recentes")

  const [aba, setAba] = useState("inicio")
  const [privado, setPrivado] = useState(true)
  const [menuAberto, setMenuAberto] = useState(false)
  const [mes, setMes] = useState("todos")
  const [aviso, setAviso] = useState(null)
  const avisoTimer = useRef(null)

  const [caixinhas, setCaixinhas] = useState(() => {
    const salvas = localStorage.getItem("caixinhas")

    if (salvas) {
      return JSON.parse(salvas)
    }

    return []
  })

  const [cdi, setCdi] = useState(() => localStorage.getItem("cdi") || "14.5")
  const [pctCdi, setPctCdi] = useState(() => localStorage.getItem("pctCdi") || "100")

  const [usuario, setUsuario] = useState(null)
  const [verificandoLogin, setVerificandoLogin] = useState(true)
  const [sincronizado, setSincronizado] = useState(false)
  const [erroLogin, setErroLogin] = useState("")
  const ultimoRemoto = useRef("")

  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [tipo, setTipo] = useState("")
  const [categoria, setCategoria] = useState("")

  const [transacaoEditando, setTransacaoEditando] = useState(null)

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
    localStorage.setItem("caixinhas", JSON.stringify(caixinhas))
  }, [caixinhas])

  useEffect(() => {
    localStorage.setItem("cdi", cdi)
  }, [cdi])

  useEffect(() => {
    localStorage.setItem("pctCdi", pctCdi)
  }, [pctCdi])

  // Login

  useEffect(() => {
    return onAuthStateChanged(auth, (pessoa) => {
      setUsuario(pessoa)
      setVerificandoLogin(false)

      if (!pessoa) {
        setSincronizado(false)
      }
    })
  }, [])

  // Recebe os dados da nuvem em tempo real

  useEffect(() => {
  if (!usuario) {
    return
  }

  const referencia = doc(db, "usuarios", usuario.uid)

  return onSnapshot(referencia, (snap) => {
    // Eco das nossas próprias gravações: ignora
    if (snap.metadata.hasPendingWrites) {
      return
    }

    const chaveMigracao = "migrado_" + usuario.uid
    const primeiraVez = !localStorage.getItem(chaveMigracao)

    if (!snap.exists()) {
      // Conta nova: o que já existe neste aparelho sobe para a nuvem
      localStorage.setItem(chaveMigracao, "1")
      setSincronizado(true)
      return
    }

    const dados = snap.data()

    const remotasT = dados.transacoes || []
    const remotasC = dados.caixinhas || []
    const cdiRemoto = dados.cdi ?? "14.5"
    const pctRemoto = dados.pctCdi ?? "100"

    const chave = JSON.stringify({
      transacoes: remotasT,
      caixinhas: remotasC,
      cdi: cdiRemoto,
      pctCdi: pctRemoto
    })

    if (chave !== ultimoRemoto.current) {
      ultimoRemoto.current = chave

      setTransacoes((locais) =>
        primeiraVez ? unirPorId(remotasT, locais) : remotasT
      )

      setCaixinhas((locais) =>
        primeiraVez ? unirPorId(remotasC, locais) : remotasC
      )

      setCdi(cdiRemoto)
      setPctCdi(pctRemoto)
    }

    localStorage.setItem(chaveMigracao, "1")
    setSincronizado(true)
    })
  }, [usuario])
  // Envia as mudanças para a nuvem

  useEffect(() => {
    if (!usuario || !sincronizado) {
      return
    }

    const dados = JSON.parse(JSON.stringify({
      transacoes,
      caixinhas,
      cdi,
      pctCdi
    }))

    const chave = JSON.stringify(dados)

    if (chave === ultimoRemoto.current) {
      return
    }

    ultimoRemoto.current = chave

    setDoc(doc(db, "usuarios", usuario.uid), dados, { merge: true })
      .catch(() => mostrarAviso("Não foi possível sincronizar", "erro"))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, sincronizado, transacoes, caixinhas, cdi, pctCdi])

  useEffect(() => {
    localStorage.setItem("modoEscuro", JSON.stringify(modoEscuro))
  }, [modoEscuro])

  // Funções

  function mostrarAviso(texto, tipo = "info", acao = null) {
    clearTimeout(avisoTimer.current)
    setAviso({ id: novoId(), texto, tipo, acao })
    avisoTimer.current = setTimeout(() => setAviso(null), acao ? 5000 : 3000)
  }

  function entrarComGoogle() {
    setErroLogin("")

    signInWithPopup(auth, provider).catch((erro) => {

      if (
        erro.code === "auth/popup-closed-by-user" ||
        erro.code === "auth/cancelled-popup-request"
      ) {
        return
      }

      if (erro.code === "auth/popup-blocked") {
        signInWithRedirect(auth, provider)
        return
      }

      setErroLogin("Não foi possível entrar. Tente novamente.")
    })
  }

  function sair() {
    signOut(auth).then(() => {

      // Limpa a cópia local para ninguém ver seus dados neste aparelho
      ["transacoes", "caixinhas", "saldo", "entradas", "saidas", "cdi", "pctCdi"]
        .forEach((chave) => localStorage.removeItem(chave))

      window.location.reload()
    })
  }

  function criarCaixinha({ nome, emoji, metaValor, metaData }) {

    if (nome.trim() === "") {
      mostrarAviso("Dê um nome para a caixinha", "erro")
      return false
    }

    const temMeta = metaValor !== ""

    if (temMeta && (Number(metaValor) <= 0 || metaData === "")) {
      mostrarAviso("Informe o valor e a data da meta", "erro")
      return false
    }

    setCaixinhas((atuais) => [
      ...atuais,
      {
        id: novoId(),
        nome: nome.trim().slice(0, 30),
        emoji,
        saldo: 0,
        meta: temMeta ? { valor: Number(metaValor), data: metaData } : null,
        historico: []
      }
    ])

    mostrarAviso("Caixinha criada")
    return true
  }

  function movimentarCaixinha(id, tipoMov, valorMov) {

    const caixinha = caixinhas.find((c) => c.id === id)

    if (!caixinha) {
      return
    }

    if (!(valorMov > 0)) {
      mostrarAviso("Digite um valor válido", "erro")
      return
    }

    if (tipoMov === "retirar" && valorMov > caixinha.saldo) {
      mostrarAviso("Saldo insuficiente na caixinha", "erro")
      return
    }

    const guardando = tipoMov === "guardar"
    const data = new Date().toISOString()

    setCaixinhas((atuais) => atuais.map((c) => {
      if (c.id !== id) {
        return c
      }

      return {
        ...c,
        saldo: guardando ? c.saldo + valorMov : c.saldo - valorMov,
        historico: [
          { id: novoId(), tipo: tipoMov, valor: valorMov, data },
          ...c.historico
        ]
      }
    }))

    // O dinheiro sai (ou volta) do saldo principal
    setTransacoes((atuais) => [
      ...atuais,
      {
        id: novoId(),
        descricao: `${guardando ? "Guardado em" : "Retirado de"} ${caixinha.nome}`,
        valor: valorMov,
        tipo: guardando ? "saida" : "entrada",
        categoria: "caixinha",
        data
      }
    ])

    mostrarAviso(guardando ? "Dinheiro guardado" : "Dinheiro retirado")
  }

  function excluirCaixinha(id) {

    const caixinha = caixinhas.find((c) => c.id === id)

    if (!caixinha) {
      return
    }

    // O que estava guardado volta para o saldo principal
    if (caixinha.saldo > 0) {
      setTransacoes((atuais) => [
        ...atuais,
        {
          id: novoId(),
          descricao: `Resgate de ${caixinha.nome}`,
          valor: caixinha.saldo,
          tipo: "entrada",
          categoria: "caixinha",
          data: new Date().toISOString()
        }
      ])
    }

    setCaixinhas((atuais) => atuais.filter((c) => c.id !== id))

    mostrarAviso(
      caixinha.saldo > 0
        ? "Caixinha excluída e valor devolvido ao saldo"
        : "Caixinha excluída"
    )
  }

  function adicionarTransacao() {

    if (descricao.trim() === "") {
      mostrarAviso("Adicione uma Descrição!", "erro")
      return
    }

    if (valor === "") {
      mostrarAviso("Adicione um valor!", "erro")
      return
    }

    if (tipo === "") {
      mostrarAviso("Adicione um tipo", "erro")
      return
    }

    if (categoria === "") {
      mostrarAviso("Selecione uma categoria", "erro")
      return
    }

    const valorNumerico = Number(valor)

    if (valorNumerico <= 0) {
      mostrarAviso("Adicione um valor válido", "erro")
      return
    }

    setTransacoes([
      ...transacoes,
      {
        id: novoId(),
        descricao: descricao.trim(),
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
    mostrarAviso("Transação adicionada")
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

      if (descricao.trim() === "") {
        mostrarAviso("Adicione uma Descrição!", "erro")
        return
      }

      if (valor === "") {
        mostrarAviso("Adicione um valor!", "erro")
        return
      }

      const novoValor = Number(valor)

      if (novoValor <= 0) {
        mostrarAviso("Adicione um valor válido", "erro")
        return
      }

      if (tipo === "") {
        mostrarAviso("Adicione um tipo", "erro")
        return
      }

      if (categoria === "") {
        mostrarAviso("Selecione uma categoria", "erro")
        return
      }

      // Atualiza a transação

      const novasTransacoes = transacoes.map((transacao) => {

        if (transacao.id === transacaoEditando) {

          return {
            ...transacao,
            descricao: descricao.trim(),
            valor: novoValor,        
            tipo: tipo,
            categoria: categoria
          }

        }

        return transacao
      })

      setTransacoes(novasTransacoes)

      // Sai do modo de edição

      setTransacaoEditando(null)
      mostrarAviso("Transação atualizada")
      setDescricao("")
      setValor("")
      setCategoria("")
      setTipo("")

    } else {

      adicionarTransacao()

    }
  }

  function excluirTransacao(id) {

    const indice = transacoes.findIndex((transacao) => transacao.id === id)
    const removida = transacoes[indice]

    setTransacoes(transacoes.filter((transacao) => transacao.id !== id))

    mostrarAviso("Transação excluída", "info", () => {
      setTransacoes((atuais) => {
        const copia = [...atuais]
        copia.splice(Math.min(indice, copia.length), 0, removida)
        return copia
      })
      setAviso(null)
    })
  }

  function exportarCSV() {

    const cabecalho = ["Data", "Descrição", "Tipo", "Categoria", "Valor"]

    const linhas = transacoesOrdenadas.map((transacao) => [
      new Date(transacao.data).toLocaleDateString("pt-BR"),
      `"${transacao.descricao.replace(/"/g, '""')}"`,
      transacao.tipo === "entrada" ? "Entrada" : "Saída",
      transacao.categoria || "",
      transacao.valor.toFixed(2).replace(".", ",")
    ])

    const csv = "\ufeff" + [cabecalho, ...linhas]
      .map((linha) => linha.join(";"))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "transacoes.csv"
    link.click()

    URL.revokeObjectURL(url)
    mostrarAviso("Arquivo exportado")
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

  const mesesDisponiveis = [...new Set(transacoes.map((t) => chaveMes(t.data)))]
    .sort()
    .reverse()

  const mesAtivo =
    mes === "todos" || mesesDisponiveis.includes(mes) ? mes : "todos"

  const transacoesDoMes = mesAtivo === "todos"
    ? transacoes
    : transacoes.filter((t) => chaveMes(t.data) === mesAtivo)

  const entradas = transacoesDoMes
    .filter((t) => t.tipo === "entrada" && t.categoria !== "caixinha")
    .reduce((total, t) => total + t.valor, 0)

  const saidas = transacoesDoMes
    .filter((t) => t.tipo === "saida" && t.categoria !== "caixinha")
    .reduce((total, t) => total + t.valor, 0)

  const guardadoNasCaixinhas = transacoesDoMes
    .filter((t) => t.categoria === "caixinha")
    .reduce((total, t) => total + (t.tipo === "saida" ? t.valor : -t.valor), 0)

  const saldo = entradas - saidas - guardadoNasCaixinhas

  const transacoesFiltradas = transacoesDoMes.filter((transacao) => {
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
  
  const gastosPorCategoria = transacoesDoMes.reduce((grupos, transacao) => {
    if (transacao.tipo === "saida" && transacao.categoria !== "caixinha") {
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
    { id: "caixinhas", icone: "🐷", nome: "Caixinhas" },
    { id: "nova", icone: "➕", nome: "Adicionar" }
  ]

  const ultimasTransacoes = [...transacoesDoMes]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3)

  const abaAtual = abas.find((item) => item.id === aba)

  function iniciarEdicao(id) {
    editarTransacao(id)
    setAba("nova")
  }

  const classesApp = ["app", modoEscuro && "modo-escuro", privado && "privado"]
    .filter(Boolean)
    .join(" ")

  if (verificandoLogin) {
    return <div className="tela-carregando">Carregando...</div>
  }

  if (!usuario) {
    return <Login onEntrar={entrarComGoogle} erro={erroLogin} />
  }

  if (!sincronizado) {
    return <div className="tela-carregando">Sincronizando seus dados...</div>
  }

  // O que aparece na tela

  return (
    <div className={classesApp}>

      <aside className={menuAberto ? "sidebar aberto" : "sidebar"}>

        <div
          className="menu-fundo"
          onClick={() => setMenuAberto(false)}
        />

        <button
          className="menu-toggle"
          onClick={() => setMenuAberto(!menuAberto)}
          aria-expanded={menuAberto}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        >
          <span className="sidebar-icone" key={aba}>{abaAtual.icone}</span>
          <span className="menu-seta">⌄</span>
        </button>

        <nav className="menu-lista">
          <div className="menu-lista-interno">
            {abas.map((item) => (
              <button
                key={item.id}
                className={aba === item.id ? "sidebar-item ativo" : "sidebar-item"}
                onClick={() => {
                  setAba(item.id)
                  setMenuAberto(false)
                }}
                aria-current={aba === item.id ? "page" : undefined}
              >
                <span className="sidebar-icone">{item.icone}</span>
                <span className="sidebar-nome">{item.nome}</span>
              </button>
            ))}
          </div>
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

            <button className="btn-sair" onClick={sair} title={usuario.email}>
              Sair
            </button>
          </div>
        </Header>

        {aba !== "nova" && aba !== "caixinhas" && mesesDisponiveis.length > 0 && (
          <div className="barra-mes">
            <select
              value={mesAtivo}
              onChange={(e) => setMes(e.target.value)}
              aria-label="Filtrar por mês"
            >
              <option value="todos">Todos os meses</option>
              {mesesDisponiveis.map((m) => (
                <option key={m} value={m}>{nomeMes(m)}</option>
              ))}
            </select>
          </div>
        )}

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

                <button className="btn-exportar" onClick={exportarCSV}>
                  Exportar CSV
                </button>
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

                        {transacao.categoria !== "caixinha" && (
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
                        )}

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

          {aba === "caixinhas" && (
            <>
              <h2 className="titulo-secao">Caixinhas</h2>

              <Caixinhas
                caixinhas={caixinhas}
                cdi={cdi}
                pctCdi={pctCdi}
                onCdi={setCdi}
                onPctCdi={setPctCdi}
                onCriar={criarCaixinha}
                onMovimentar={movimentarCaixinha}
                onExcluir={excluirCaixinha}
              />
            </>
          )}

          {aba === "nova" && (
            <>
              <h2 className="titulo-secao">
                {transacaoEditando ? "Editar transação" : "Nova transação"}
              </h2>

              <div className="formulario">

                <div className="campo-descricao">
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={descricao}
                    maxLength={LIMITE_DESCRICAO}
                    onChange={(e) =>
                      setDescricao(e.target.value.slice(0, LIMITE_DESCRICAO))
                    }
                  />

                  <span
                    className={
                      descricao.length >= LIMITE_DESCRICAO
                        ? "contador cheio"
                        : "contador"
                    }
                  >
                    {descricao.length}/{LIMITE_DESCRICAO}
                  </span>
                </div>

                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
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

      {aviso && (
        <div className={"aviso " + aviso.tipo} key={aviso.id} role="status">
          <span>{aviso.texto}</span>

          {aviso.acao && (
            <button onClick={aviso.acao}>Desfazer</button>
          )}
        </div>
      )}

    </div>
  )
}

export default App

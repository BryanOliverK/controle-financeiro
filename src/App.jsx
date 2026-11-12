import { useEffect, useMemo, useRef, useState } from 'react'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Resumo from './components/Resumo'
import Transacao from './components/Transacao'
import FormularioTransacao from './components/FormularioTransacao'
import Categorias from './components/Categorias'
import Caixinhas from './components/Caixinhas'
import Backup from './components/Backup'
import Login from './components/Login'
import TelaCarregando from './components/TelaCarregando'
import { auth, db, provider } from './firebase'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'firebase/auth'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

import { useAviso } from './hooks/useAviso'
import { useLocalStorage } from './hooks/useLocalStorage'

import { categoriaCompativel } from './utils/categorias'
import {
  agruparPorData,
  calcularResumo,
  filtrar,
  gastosPorCategoria,
  listarMeses,
  ordenar
} from './utils/calculos'
import { baixarBackup, lerBackup } from './utils/backup'
import { baixarCSV } from './utils/exportar'
import {
  arredondar,
  chaveMes,
  contar,
  dataParaIso,
  nomeMes,
  novoId,
  paraInputData
} from './utils/formatar'
import { unirPorId } from './utils/listas'
import { validarTransacao } from './utils/validacao'

import './App.css'
import './categorias.css'
import './menu-mobile.css'
import './extras.css'
import './caixinhas.css'
import './login.css'
import './carregando.css'

// data vazia = hoje (o formulário mostra a data de hoje e resolve ao salvar)
const FORM_VAZIO = { descricao: "", valor: "", tipo: "", categoria: "", data: "" }

const ABAS = [
  { id: "inicio", icone: "📊", nome: "Início" },
  { id: "transacoes", icone: "💳", nome: "Transações" },
  { id: "graficos", icone: "📈", nome: "Gráficos" },
  { id: "caixinhas", icone: "🐷", nome: "Caixinhas" },
  { id: "nova", icone: "➕", nome: "Adicionar" }
]

function App() {

  // Estados da tela

  const [aba, setAba] = useState("inicio")
  const [privado, setPrivado] = useState(true)
  const [mes, setMes] = useState("todos")

  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [ordenacao, setOrdenacao] = useState("recentes")

  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)

  // Dados (guardados no aparelho; a sincronização com a nuvem vem mais abaixo)

  const [transacoes, setTransacoes] = useLocalStorage("transacoes", [])
  const [caixinhas, setCaixinhas] = useLocalStorage("caixinhas", [])
  const [cdi, setCdi] = useLocalStorage("cdi", "14.5", { texto: true })
  const [pctCdi, setPctCdi] = useLocalStorage("pctCdi", "100", { texto: true })
  const [modoEscuro, setModoEscuro] = useLocalStorage("modoEscuro", false)

  const { aviso, mostrarAviso, fecharAviso } = useAviso()

  // ===== Firebase: login e sincronização (código original, sem alterações) =====

  const [usuario, setUsuario] = useState(null)
  const [verificandoLogin, setVerificandoLogin] = useState(true)
  const [sincronizado, setSincronizado] = useState(false)
  const [erroLogin, setErroLogin] = useState("")
  const ultimoRemoto = useRef("")

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

  // ===== Fim do código do Firebase =====

  // Valores calculados

  const mesesDisponiveis = useMemo(() => listarMeses(transacoes), [transacoes])

  const mesAtivo =
    mes === "todos" || mesesDisponiveis.includes(mes) ? mes : "todos"

  const transacoesDoMes = useMemo(
    () => mesAtivo === "todos"
      ? transacoes
      : transacoes.filter((t) => chaveMes(t.data) === mesAtivo),
    [transacoes, mesAtivo]
  )

  const { saldo, entradas, saidas } = useMemo(
    () => calcularResumo(transacoesDoMes),
    [transacoesDoMes]
  )

  const { gastos, totalGastos } = useMemo(
    () => gastosPorCategoria(transacoesDoMes),
    [transacoesDoMes]
  )

  const transacoesOrdenadas = useMemo(
    () => ordenar(filtrar(transacoesDoMes, { busca, filtroTipo }), ordenacao),
    [transacoesDoMes, busca, filtroTipo, ordenacao]
  )

  const transacoesPorData = useMemo(
    () => agruparPorData(transacoesOrdenadas),
    [transacoesOrdenadas]
  )

  const ultimasTransacoes = useMemo(
    () => ordenar(transacoesDoMes, "recentes").slice(0, 3),
    [transacoesDoMes]
  )

  // Navegação

  function mudarAba(id) {
    // Saiu da tela de adicionar no meio de uma edição: cancela a edição
    if (id !== "nova" && editandoId) {
      setEditandoId(null)
      setForm(FORM_VAZIO)
    }

    setAba(id)
  }

  // Transações

  function alterarCampo(campo, valor) {
    setForm((atual) => {
      const novo = { ...atual, [campo]: valor }

      // Trocou o tipo e a categoria escolhida não combina mais: limpa
      if (
        campo === "tipo" &&
        novo.categoria !== "" &&
        !categoriaCompativel(novo.categoria, valor)
      ) {
        novo.categoria = ""
      }

      return novo
    })
  }

  function salvarTransacao() {

    const erro = validarTransacao(form)

    if (erro) {
      mostrarAviso(erro, "erro")
      return
    }

    const valorNumerico = arredondar(Number(form.valor))

    if (editandoId) {

      setTransacoes((atuais) => atuais.map((t) => {
        if (t.id !== editandoId) {
          return t
        }

        return {
          ...t,
          descricao: form.descricao.trim(),
          valor: valorNumerico,
          tipo: form.tipo,
          categoria: form.categoria,
          data: dataParaIso(form.data, t.data)
        }
      }))

      setEditandoId(null)
      mostrarAviso("Transação atualizada")

    } else {

      setTransacoes((atuais) => [
        ...atuais,
        {
          id: novoId(),
          descricao: form.descricao.trim(),
          valor: valorNumerico,
          tipo: form.tipo,
          categoria: form.categoria,
          data: dataParaIso(form.data)
        }
      ])

      mostrarAviso("Transação adicionada")
    }

    setForm(FORM_VAZIO)
  }

  function iniciarEdicao(id) {

    const transacao = transacoes.find((t) => t.id === id)

    if (!transacao) {
      return
    }

    setForm({
      descricao: transacao.descricao,
      valor: String(transacao.valor),
      tipo: transacao.tipo,
      // Transação antiga com categoria que não combina com o tipo: pede de novo
      categoria: categoriaCompativel(transacao.categoria, transacao.tipo)
        ? transacao.categoria
        : "",
      data: paraInputData(transacao.data)
    })

    setEditandoId(id)
    setAba("nova")
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setForm(FORM_VAZIO)
  }

  function excluirTransacao(id) {

    const indice = transacoes.findIndex((t) => t.id === id)

    if (indice === -1) {
      return
    }

    const removida = transacoes[indice]

    setTransacoes((atuais) => atuais.filter((t) => t.id !== id))

    mostrarAviso("Transação excluída", "info", () => {
      setTransacoes((atuais) => {
        if (atuais.some((t) => t.id === removida.id)) {
          return atuais
        }

        const copia = [...atuais]
        copia.splice(Math.min(indice, copia.length), 0, removida)
        return copia
      })

      fecharAviso()
    })
  }

  function exportarCSV() {
    baixarCSV(transacoesOrdenadas, `transacoes-${mesAtivo}.csv`)
    mostrarAviso("Arquivo exportado")
  }

  // Backup

  function exportarBackup() {
    baixarBackup({ transacoes, caixinhas, cdi, pctCdi })
    mostrarAviso("Backup exportado")
  }

  async function importarBackup(arquivo) {

    try {
      const backup = await lerBackup(arquivo)

      const idsTransacoes = new Set(transacoes.map((t) => t.id))
      const idsCaixinhas = new Set(caixinhas.map((c) => c.id))

      const novasTransacoes = backup.transacoes
        .filter((t) => !idsTransacoes.has(t.id)).length

      const novasCaixinhas = backup.caixinhas
        .filter((c) => !idsCaixinhas.has(c.id)).length

      if (novasTransacoes === 0 && novasCaixinhas === 0) {
        mostrarAviso("Nada novo no backup: seus dados já estão aqui")
        return
      }

      // Só entra o que falta; o que já existe fica como está
      setTransacoes((atuais) => unirPorId(atuais, backup.transacoes))
      setCaixinhas((atuais) => unirPorId(atuais, backup.caixinhas))

      mostrarAviso(
        "Backup importado: " +
        contar(novasTransacoes, "transação", "transações") + " e " +
        contar(novasCaixinhas, "caixinha", "caixinhas")
      )

    } catch (erro) {
      mostrarAviso(
        erro instanceof Error ? erro.message : "Não foi possível importar o backup",
        "erro"
      )
    }
  }

  // Caixinhas

  function criarCaixinha({ nome, emoji, metaValor, metaData }) {

    if (nome.trim() === "") {
      mostrarAviso("Dê um nome para a caixinha", "erro")
      return false
    }

    const temMeta = metaValor !== ""

    if (temMeta && (!(Number(metaValor) > 0) || metaData === "")) {
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

    valorMov = arredondar(valorMov)

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
        saldo: arredondar(guardando ? c.saldo + valorMov : c.saldo - valorMov),
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

    const indice = caixinhas.findIndex((c) => c.id === id)

    if (indice === -1) {
      return
    }

    const caixinha = caixinhas[indice]

    // O que estava guardado volta para o saldo principal
    const resgate = caixinha.saldo > 0
      ? {
          id: novoId(),
          descricao: `Resgate de ${caixinha.nome}`,
          valor: caixinha.saldo,
          tipo: "entrada",
          categoria: "caixinha",
          data: new Date().toISOString()
        }
      : null

    if (resgate) {
      setTransacoes((atuais) => [...atuais, resgate])
    }

    setCaixinhas((atuais) => atuais.filter((c) => c.id !== id))

    mostrarAviso(
      resgate
        ? "Caixinha excluída e valor devolvido ao saldo"
        : "Caixinha excluída",
      "info",
      () => {
        // Desfazer: a caixinha volta e o resgate some
        setCaixinhas((atuais) => {
          if (atuais.some((c) => c.id === caixinha.id)) {
            return atuais
          }

          const copia = [...atuais]
          copia.splice(Math.min(indice, copia.length), 0, caixinha)
          return copia
        })

        if (resgate) {
          setTransacoes((atuais) => atuais.filter((t) => t.id !== resgate.id))
        }

        fecharAviso()
      }
    )
  }

  // Firebase: entrar e sair (código original, sem alterações)

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

  // Telas de espera (login, sincronização)

  if (verificandoLogin) {
    return <TelaCarregando etapa={0} modoEscuro={modoEscuro} />
  }

  if (!usuario) {
    return <Login onEntrar={entrarComGoogle} erro={erroLogin} modoEscuro={modoEscuro} />
  }

  if (!sincronizado) {
    return <TelaCarregando etapa={1} modoEscuro={modoEscuro} />
  }

  // O que aparece na tela

  const classesApp = ["app", modoEscuro && "modo-escuro", privado && "privado"]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classesApp}>

      <Sidebar abas={ABAS} aba={aba} onMudar={mudarAba} />

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
                  onClick={() => mudarAba("transacoes")}
                >
                  Ver todas →
                </button>
              </div>

              <div className="transacoes">
                {ultimasTransacoes.length === 0 && (
                  <p className="vazio">Nenhuma transação ainda.</p>
                )}

                {ultimasTransacoes.map((transacao) => (
                  <Transacao key={transacao.id} transacao={transacao} />
                ))}
              </div>

              <Backup onExportar={exportarBackup} onImportar={importarBackup} />
            </>
          )}

          {aba === "transacoes" && (
            <>
              <div className="filtros">
                <input
                  type="text"
                  placeholder="Pesquisar transação"
                  aria-label="Pesquisar transação"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />

                <select
                  aria-label="Filtrar por tipo"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}>
                  <option value="todos">Todos</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                </select>

                <select
                  aria-label="Ordenar"
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

                {transacoesPorData.map(([data, grupo]) => (
                  <div className="grupo-data" key={data}>

                    <h3 className="titulo-data">
                      {data}
                    </h3>

                    {grupo.map((transacao) => (
                      <Transacao
                        key={transacao.id}
                        transacao={transacao}
                        onEditar={iniciarEdicao}
                        onExcluir={excluirTransacao}
                      />
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
                gastosPorCategoria={gastos}
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
            <FormularioTransacao
              form={form}
              editando={editandoId !== null}
              onAlterar={alterarCampo}
              onSalvar={salvarTransacao}
              onCancelar={cancelarEdicao}
            />
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

import { useEffect, useMemo, useState } from 'react'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Resumo from './components/Resumo'
import Transacao from './components/Transacao'
import FormularioTransacao from './components/FormularioTransacao'
import Avisos from './components/Avisos'
import Cartoes from './components/Cartoes'
import Dividas from './components/Dividas'
import Compromissos from './components/Compromissos'
import GerenciarCategorias from './components/GerenciarCategorias'
import Previsao from './components/Previsao'
import LimparHistorico from './components/LimparHistorico'
import Categorias from './components/Categorias'
import Caixinhas from './components/Caixinhas'
import AjudaAtalhos from './components/AjudaAtalhos'
import Backup from './components/Backup'
import BoasVindas from './components/BoasVindas'
import ComparacaoMeses from './components/ComparacaoMeses'
import Orcamentos from './components/Orcamentos'
import Recorrentes from './components/Recorrentes'
import Icone from './components/Icone'
import Vazio from './components/Vazio'
import Login from './components/Login'
import TelaCarregando from './components/TelaCarregando'

import { useAviso } from './hooks/useAviso'
import { useAtalhos } from './hooks/useAtalhos'
import { useAtualizacao } from './hooks/useAtualizacao'
import { useInstalar } from './hooks/useInstalar'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useLogin } from './hooks/useLogin'
import { useSincronizacao } from './hooks/useSincronizacao'

import {
  categoriaCompativel,
  nomeCategoria,
  novaChaveCategoria,
  registrarCategorias,
  todasCategorias
} from './utils/categorias'
import { semCartao, semOculta } from './utils/historico'
import { chaveFatura, infoCartao, limparFaturasPagas, registrarCartoes } from './utils/cartoes'
import { listarCompromissos } from './utils/compromissos'
import { comPagamento, limparDividas, semPagamento, transacaoDoPagamento, validarPagamento } from './utils/dividas'
import { MAX_PARCELAS, gerarParcelas } from './utils/parcelas'
import { gerarAvisos, limparAvisosLidos } from './utils/avisos'
import { calcularPrevisao } from './utils/previsao'
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
import { gastoDaCategoria, mensagemAlerta } from './utils/orcamentos'
import { criarRecorrente, gerarPendentes } from './utils/recorrentes'
import { imprimirRelatorio, montarRelatorioHtml } from './utils/relatorio'
import { validarTransacao } from './utils/validacao'

import './App.css'
import './categorias.css'
import './menu-mobile.css'
import './extras.css'
import './caixinhas.css'
import './login.css'
import './carregando.css'
import './recursos.css'

// data vazia = hoje (o formulário mostra a data de hoje e resolve ao salvar)
const FORM_VAZIO = {
  descricao: "", valor: "", tipo: "", categoria: "", data: "",
  repetir: false, parcelar: false, parcelas: "2", cartaoId: ""
}

const ABAS = [
  { id: "inicio", icone: "inicio", nome: "Início" },
  { id: "transacoes", icone: "transacoes", nome: "Transações" },
  { id: "graficos", icone: "graficos", nome: "Gráficos" },
  { id: "caixinhas", icone: "caixinha", nome: "Caixinhas" },
  { id: "planejar", icone: "calendario", nome: "Planejar" },
  { id: "avisos", icone: "sino", nome: "Avisos" },
  { id: "nova", icone: "adicionar", nome: "Adicionar" }
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
  const [limparAberto, setLimparAberto] = useState(false)
  const [ajudaAberta, setAjudaAberta] = useState(false)

  // Dados (guardados no aparelho; a sincronização com a nuvem vem mais abaixo)

  const [transacoes, setTransacoes] = useLocalStorage("transacoes", [])
  const [caixinhas, setCaixinhas] = useLocalStorage("caixinhas", [])
  const [cdi, setCdi] = useLocalStorage("cdi", "14.5", { texto: true })
  const [pctCdi, setPctCdi] = useLocalStorage("pctCdi", "100", { texto: true })
  const [orcamentos, setOrcamentos] = useLocalStorage("orcamentos", {})
  const [recorrentes, setRecorrentes] = useLocalStorage("recorrentes", [])
  const [categoriasExtras, setCategoriasExtras] = useLocalStorage("categoriasExtras", [])
  const [cartoes, setCartoes] = useLocalStorage("cartoes", [])
  const [faturasPagas, setFaturasPagas] = useLocalStorage("faturasPagas", [])
  const [avisosLidos, setAvisosLidos] = useLocalStorage("avisosLidos", [])
  const [dividas, setDividas] = useLocalStorage("dividas", [])
  const [modoEscuro, setModoEscuro] = useLocalStorage("modoEscuro", false)
  const [boasVindasVistas, setBoasVindasVistas] = useLocalStorage("boasVindasVistas", false)

  // As categorias do usuário precisam estar registradas antes de a tela desenhar
  registrarCategorias(categoriasExtras)
  registrarCartoes(cartoes)

  const { aviso, mostrarAviso, fecharAviso } = useAviso()
  const { podeInstalar, instalar } = useInstalar()
  const { atualizacaoDisponivel, atualizar } = useAtualizacao()

  // Login e sincronização com a nuvem (veja hooks/useLogin e hooks/useSincronizacao)

  const {
    usuario, verificandoLogin, erroLogin,
    entrarComGoogle, entrarComEmail, criarContaComEmail, recuperarSenha, sair
  } = useLogin()

  const { sincronizado, erroSincronia } = useSincronizacao({
    usuario,
    mostrarAviso,
    dados: { transacoes, caixinhas, cdi, pctCdi, orcamentos, recorrentes, categoriasExtras, cartoes, faturasPagas, avisosLidos, dividas },
    alterar: { setTransacoes, setCaixinhas, setCdi, setPctCdi, setOrcamentos, setRecorrentes, setCategoriasExtras, setCartoes, setFaturasPagas, setAvisosLidos, setDividas }
  })


  // Lançamentos mensais: lança os meses que já chegaram (só depois de sincronizar)

  useEffect(() => {
    if (!usuario || !sincronizado) {
      return
    }

    const pendentes = gerarPendentes(recorrentes)

    if (!pendentes) {
      return
    }

    setRecorrentes(pendentes.recorrentes)

    setTransacoes((atuais) => {
      const ids = new Set(atuais.map((t) => t.id))
      const novas = pendentes.transacoes.filter((t) => !ids.has(t.id))

      return novas.length > 0 ? [...atuais, ...novas] : atuais
    })

    mostrarAviso(
      "Lançado automaticamente: " +
      contar(pendentes.transacoes.length, "transação mensal", "transações mensais")
    )
  }, [usuario, sincronizado, recorrentes, setRecorrentes, setTransacoes, mostrarAviso])

  // Valores calculados

  // Transações ocultas (limpar histórico) ficam guardadas, mas fora de listas e totais
  const visiveis = useMemo(() => transacoes.filter((t) => !t.oculta), [transacoes])

  const mesesDisponiveis = useMemo(() => listarMeses(visiveis), [visiveis])

  // Previsão do mês e compromissos futuros
  const previsao = useMemo(
    () => calcularPrevisao(visiveis, recorrentes),
    [visiveis, recorrentes]
  )

  const compromissos = useMemo(
    () => listarCompromissos({ transacoes: visiveis, recorrentes, cartoes, faturasPagas }),
    [visiveis, recorrentes, cartoes, faturasPagas]
  )

  // Avisos (vencimentos, lembretes, orçamento, novidades) e quantos faltam ler
  const avisos = useMemo(
    () => gerarAvisos({ transacoes: visiveis, recorrentes, cartoes, faturasPagas, orcamentos, previsao, dividas }),
    [visiveis, recorrentes, cartoes, faturasPagas, orcamentos, previsao, dividas]
  )

  const lidosSet = useMemo(() => new Set(avisosLidos), [avisosLidos])

  const naoLidos = avisos.filter((a) => !lidosSet.has(a.id)).length + (atualizacaoDisponivel ? 1 : 0)

  const abasComSelo = ABAS.map((a) => (a.id === "avisos" ? { ...a, selo: naoLidos } : a))

  const mesAtivo =
    mes === "todos" || mesesDisponiveis.includes(mes) ? mes : "todos"

  const transacoesDoMes = useMemo(
    () => mesAtivo === "todos"
      ? visiveis
      : visiveis.filter((t) => chaveMes(t.data) === mesAtivo),
    [visiveis, mesAtivo]
  )

  // O orçamento é mensal: usa o mês escolhido no filtro ou, em "todos", o mês atual
  const mesOrcamento = mesAtivo === "todos" ? chaveMes(new Date()) : mesAtivo

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

      // Entrada não é paga com cartão
      if (campo === "tipo" && valor === "entrada") {
        novo.cartaoId = ""
        novo.parcelar = false
      }

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

    const parcelando = !editandoId && form.parcelar && form.tipo === "saida"
    const quantidade = Math.floor(Number(form.parcelas))

    if (parcelando && !(quantidade >= 2 && quantidade <= MAX_PARCELAS)) {
      mostrarAviso(`Informe de 2 a ${MAX_PARCELAS} parcelas`, "erro")
      return
    }

    if (editandoId) {

      setTransacoes((atuais) => atuais.map((t) => {
        if (t.id !== editandoId) {
          return t
        }

        const atualizada = {
          ...t,
          descricao: form.descricao.trim(),
          valor: valorNumerico,
          tipo: form.tipo,
          categoria: form.categoria,
          data: dataParaIso(form.data, t.data)
        }

        if (form.tipo === "saida" && form.cartaoId) {
          atualizada.cartaoId = form.cartaoId
        } else {
          delete atualizada.cartaoId
        }

        return atualizada
      }))

      setEditandoId(null)
      mostrarAviso("Transação atualizada")

    } else {

      const base = {
        id: novoId(),
        descricao: form.descricao.trim(),
        valor: valorNumerico,
        tipo: form.tipo,
        categoria: form.categoria,
        ...(form.tipo === "saida" && form.cartaoId ? { cartaoId: form.cartaoId } : {}),
        data: dataParaIso(form.data)
      }

      // Compra parcelada vira uma transação por mês; a primeira é a "nova"
      const lancamentos = parcelando
        ? gerarParcelas({ ...base, valorTotal: valorNumerico }, base.data, quantidade)
        : [base]

      const nova = lancamentos[0]

      setTransacoes((atuais) => [...atuais, ...lancamentos])

      // "Repetir todo mês": a próxima já cai no mês seguinte
      if (form.repetir) {
        setRecorrentes((atuais) => [...atuais, criarRecorrente(nova, nova.data)])
      }

      // Saída que chegou perto (ou passou) do orçamento da categoria
      const limite = orcamentos[nova.categoria]
      const mesNova = chaveMes(nova.data)

      const gastoAntes = gastoDaCategoria(visiveis, nova.categoria, mesNova)

      const alerta = nova.tipo === "saida" && limite
        ? mensagemAlerta(nova.categoria, gastoAntes, arredondar(gastoAntes + nova.valor), limite)
        : null

      const mensagem = parcelando
        ? `Compra parcelada em ${quantidade}x adicionada`
        : form.repetir ? "Transação adicionada e repetida todo mês" : "Transação adicionada"

      mostrarAviso(
        alerta ? `${mensagem}. ${alerta}` : mensagem,
        alerta && alerta.includes("estourado") ? "erro" : "info"
      )
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
      data: paraInputData(transacao.data),
      repetir: false,
      parcelar: false,
      parcelas: "2",
      cartaoId: transacao.cartaoId && infoCartao(transacao.cartaoId) ? transacao.cartaoId : ""
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

  function exportarPDF() {

    if (transacoesDoMes.length === 0) {
      mostrarAviso("Não há transações para o relatório", "erro")
      return
    }

    const html = montarRelatorioHtml({
      titulo: mesAtivo === "todos" ? "Todos os meses" : nomeMes(mesAtivo),
      geradoEm: new Date().toLocaleString("pt-BR"),
      resumo: { saldo, entradas, saidas },
      categorias: Object.entries(gastos)
        .sort((a, b) => b[1] - a[1])
        .map(([chave, valor]) => ({
          nome: chave === "sem-categoria" ? "Sem categoria" : nomeCategoria(chave),
          valor,
          porcentagem: totalGastos > 0 ? (valor / totalGastos) * 100 : 0
        })),
      transacoes: ordenar(transacoesDoMes, "antigas").map((t) => ({
        data: t.data,
        descricao: t.descricao,
        categoriaNome: t.categoria ? nomeCategoria(t.categoria) : "",
        tipo: t.tipo,
        valor: t.valor
      }))
    })

    imprimirRelatorio(html)
    mostrarAviso('Na janela que abrir, escolha "Salvar como PDF"')
  }

  // Orçamentos e lançamentos mensais

  function definirOrcamento(categoria, valor) {
    setOrcamentos((atuais) => {
      const novo = { ...atuais }

      if (valor === null) {
        delete novo[categoria]
      } else {
        novo[categoria] = arredondar(valor)
      }

      return novo
    })

    mostrarAviso(valor === null ? "Limite removido" : "Limite salvo")
  }

  function excluirRecorrente(id) {

    const indice = recorrentes.findIndex((r) => r.id === id)

    if (indice === -1) {
      return
    }

    const removida = recorrentes[indice]

    setRecorrentes((atuais) => atuais.filter((r) => r.id !== id))

    // As transações já lançadas ficam; só deixa de lançar as próximas
    mostrarAviso("Lançamento mensal removido", "info", () => {
      setRecorrentes((atuais) => {
        if (atuais.some((r) => r.id === removida.id)) {
          return atuais
        }

        const copia = [...atuais]
        copia.splice(Math.min(indice, copia.length), 0, removida)
        return copia
      })
    })
  }

  // Limpar histórico: ocultar, restaurar e excluir transações escolhidas (por id)

  function ocultarTransacoes(listaIds) {

    const ids = new Set(listaIds)

    if (ids.size === 0) {
      return
    }

    setTransacoes((atuais) => atuais.map((t) => (ids.has(t.id) ? { ...t, oculta: true } : t)))

    mostrarAviso(contar(ids.size, "transação ocultada", "transações ocultadas"), "info", () => {
      setTransacoes((atuais) => atuais.map((t) => {
        if (!ids.has(t.id)) {
          return t
        }

        return semOculta(t)
      }))

      fecharAviso()
    })
  }

  function restaurarTransacoes(listaIds) {

    const ids = new Set(listaIds)

    if (ids.size === 0) {
      return
    }

    setTransacoes((atuais) => atuais.map((t) => {
      if (!ids.has(t.id)) {
        return t
      }

      return semOculta(t)
    }))

    mostrarAviso(contar(ids.size, "transação restaurada", "transações restauradas"))
  }

  function excluirTransacoesDeVez(listaIds) {

    // Só apaga de vez o que já está oculto
    const ids = new Set(listaIds)
    const removidas = transacoes.filter((t) => ids.has(t.id) && t.oculta)

    if (removidas.length === 0) {
      return
    }

    const idsRemovidas = new Set(removidas.map((t) => t.id))

    setTransacoes((atuais) => atuais.filter((t) => !idsRemovidas.has(t.id)))

    mostrarAviso(contar(removidas.length, "transação excluída", "transações excluídas"), "info", () => {
      setTransacoes((atuais) => unirPorId(atuais, removidas))
      fecharAviso()
    })
  }

  // Avisos

  function marcarAvisosLidos(ids) {
    setAvisosLidos((atuais) => limparAvisosLidos([...atuais, ...ids]))
  }

  // Dívidas e empréstimos

  function salvarDivida({ id, tipo, pessoa, valor, descricao, vencimento }) {

    const dados = {
      tipo,
      pessoa: pessoa.trim(),
      valor: arredondar(valor),
      descricao: descricao.trim(),
      vencimento
    }

    if (id) {
      setDividas((atuais) => atuais.map((d) => (d.id === id ? { ...d, ...dados } : d)))
      mostrarAviso("Dívida atualizada")
      return
    }

    setDividas((atuais) => [
      ...atuais,
      { id: novoId(), ...dados, criadaEm: new Date().toISOString(), pagamentos: [] }
    ])

    mostrarAviso("Dívida adicionada")
  }

  function excluirDivida(id) {
    setDividas((atuais) => atuais.filter((d) => d.id !== id))
    mostrarAviso("Dívida excluída")
  }

  function pagarDivida(id, valor, lancar) {

    const divida = dividas.find((d) => d.id === id)

    if (!divida) {
      return
    }

    const erro = validarPagamento(divida, valor)

    if (erro) {
      mostrarAviso(erro, "erro")
      return
    }

    const pagamento = {
      id: novoId(),
      valor: arredondar(Number(valor)),
      data: new Date().toISOString()
    }

    if (lancar) {
      const transacao = transacaoDoPagamento(divida, pagamento, novoId())
      pagamento.transacaoId = transacao.id
      setTransacoes((atuais) => [...atuais, transacao])
    }

    const atualizada = comPagamento(divida, pagamento)
    const quitou = arredondar(atualizada.pagamentos.reduce((s, p) => s + p.valor, 0)) >= divida.valor

    setDividas((atuais) => atuais.map((d) => (d.id === id ? comPagamento(d, pagamento) : d)))

    mostrarAviso(quitou ? "Dívida quitada!" : "Pagamento registrado")
  }

  function desfazerPagamentoDivida(id, idPagamento) {

    const divida = dividas.find((d) => d.id === id)
    const pagamento = divida?.pagamentos.find((p) => p.id === idPagamento)

    if (!pagamento) {
      return
    }

    // Se o pagamento tinha virado uma transação, ela some junto
    if (pagamento.transacaoId) {
      setTransacoes((atuais) => atuais.filter((t) => t.id !== pagamento.transacaoId))
    }

    setDividas((atuais) => atuais.map((d) => (d.id === id ? semPagamento(d, idPagamento) : d)))
    mostrarAviso("Pagamento desfeito")
  }

  // Cartões e faturas

  function salvarCartao({ id, nome, fechamento, vencimento, cor }) {

    if (id) {
      setCartoes((atuais) =>
        atuais.map((c) => (c.id === id ? { ...c, nome, fechamento, vencimento, cor } : c))
      )
      mostrarAviso("Cartão atualizado")
      return
    }

    setCartoes((atuais) => [...atuais, { id: novoId(), nome, fechamento, vencimento, cor }])
    mostrarAviso("Cartão criado")
  }

  function excluirCartao(id) {

    // As compras ficam no histórico, só deixam de pertencer ao cartão
    setTransacoes((atuais) => atuais.map((t) => (t.cartaoId === id ? semCartao(t) : t)))
    setRecorrentes((atuais) => atuais.map((r) => (r.cartaoId === id ? semCartao(r) : r)))
    setFaturasPagas((atuais) => atuais.filter((x) => !x.startsWith(`${id}|`)))
    setForm((atual) => (atual.cartaoId === id ? { ...atual, cartaoId: "" } : atual))
    setCartoes((atuais) => atuais.filter((c) => c.id !== id))

    mostrarAviso("Cartão excluído")
  }

  function alternarFaturaPaga(cartaoId, chave) {

    const marca = chaveFatura(cartaoId, chave)
    const estavaPaga = faturasPagas.includes(marca)

    setFaturasPagas((atuais) =>
      estavaPaga ? atuais.filter((x) => x !== marca) : [...atuais, marca]
    )

    mostrarAviso(estavaPaga ? "Pagamento desfeito" : "Fatura marcada como paga")
  }

  // Categorias personalizadas

  function salvarCategoria({ id, nome, icone, cor }) {

    if (id) {
      setCategoriasExtras((atuais) =>
        atuais.map((c) => (c.id === id ? { ...c, nome, icone, cor } : c))
      )
      mostrarAviso("Categoria atualizada")
      return
    }

    setCategoriasExtras((atuais) => [
      ...atuais,
      { id: novaChaveCategoria(), nome, icone, cor }
    ])

    mostrarAviso("Categoria criada")
  }

  function excluirCategoria(id) {

    const nome = nomeCategoria(id)

    const usadas = transacoes.filter((t) => t.categoria === id).length

    const pergunta = usadas > 0
      ? `Excluir "${nome}"? As ${usadas} transações dela passam para "Outros".`
      : `Excluir "${nome}"?`

    if (!window.confirm(pergunta)) {
      return
    }

    // Nada fica sem categoria: o que usava ela vira "Outros"
    setTransacoes((atuais) =>
      atuais.map((t) => (t.categoria === id ? { ...t, categoria: "outros" } : t))
    )

    setRecorrentes((atuais) =>
      atuais.map((r) => (r.categoria === id ? { ...r, categoria: "outros" } : r))
    )

    setOrcamentos((atuais) =>
      Object.fromEntries(Object.entries(atuais).filter(([chave]) => chave !== id))
    )

    setForm((atual) => (atual.categoria === id ? { ...atual, categoria: "" } : atual))
    setCategoriasExtras((atuais) => atuais.filter((c) => c.id !== id))

    mostrarAviso("Categoria excluída")
  }

  // Backup

  function exportarBackup() {
    baixarBackup({ transacoes, caixinhas, cdi, pctCdi, orcamentos, recorrentes, categoriasExtras, cartoes, faturasPagas, dividas })
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

      const idsRecorrentes = new Set(recorrentes.map((r) => r.id))

      const novasRecorrentes = backup.recorrentes
        .filter((r) => !idsRecorrentes.has(r.id)).length

      // Limites só entram nas categorias que ainda não têm
      const novosLimites = Object.keys(backup.orcamentos)
        .filter((c) => !(c in orcamentos)).length

      const idsCategorias = new Set(categoriasExtras.map((c) => c.id))

      const novasCategorias = backup.categoriasExtras
        .filter((c) => !idsCategorias.has(c.id)).length

      const idsCartoes = new Set(cartoes.map((c) => c.id))

      const novosCartoes = backup.cartoes
        .filter((c) => !idsCartoes.has(c.id)).length

      const idsDividas = new Set(dividas.map((d) => d.id))

      const novasDividas = backup.dividas
        .filter((d) => !idsDividas.has(d.id)).length

      if (
        novasTransacoes === 0 && novasCaixinhas === 0 &&
        novasRecorrentes === 0 && novosLimites === 0 &&
        novasCategorias === 0 && novosCartoes === 0 && novasDividas === 0
      ) {
        mostrarAviso("Nada novo no backup: seus dados já estão aqui")
        return
      }

      // Só entra o que falta; o que já existe fica como está
      setTransacoes((atuais) => unirPorId(atuais, backup.transacoes))
      setCaixinhas((atuais) => unirPorId(atuais, backup.caixinhas))
      setRecorrentes((atuais) => unirPorId(atuais, backup.recorrentes))
      setOrcamentos((atuais) => ({ ...backup.orcamentos, ...atuais }))
      setCategoriasExtras((atuais) => unirPorId(atuais, backup.categoriasExtras))
      setCartoes((atuais) => unirPorId(atuais, backup.cartoes))
      setFaturasPagas((atuais) => limparFaturasPagas([...atuais, ...backup.faturasPagas]))
      setDividas((atuais) => limparDividas(unirPorId(atuais, backup.dividas)))

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

  // Atalhos de teclado (só com o app aberto, depois do login e da sincronização)

  function irParaCampo(seletor) {
    setTimeout(() => document.querySelector(seletor)?.focus(), 60)
  }

  useAtalhos(
    {
      n: () => { mudarAba("nova"); irParaCampo(".campo-descricao input") },
      "/": () => { mudarAba("transacoes"); irParaCampo('input[aria-label="Pesquisar transação"]') },
      i: () => mudarAba("inicio"),
      t: () => mudarAba("transacoes"),
      g: () => mudarAba("graficos"),
      c: () => mudarAba("caixinhas"),
      a: () => mudarAba("avisos"),
      p: () => setPrivado(!privado),
      d: () => setModoEscuro(!modoEscuro),
      "?": () => setAjudaAberta(true)
    },
    Boolean(usuario) && sincronizado && !ajudaAberta
  )

  // Telas de espera (login, sincronização)

  if (verificandoLogin) {
    return <TelaCarregando etapa={0} modoEscuro={modoEscuro} />
  }

  if (!usuario) {
    return (
      <Login
        onEntrar={entrarComGoogle}
        onEntrarEmail={entrarComEmail}
        onCriarConta={criarContaComEmail}
        onRecuperarSenha={recuperarSenha}
        erro={erroLogin}
        modoEscuro={modoEscuro}
      />
    )
  }

  if (!sincronizado) {
    return <TelaCarregando etapa={1} modoEscuro={modoEscuro} erro={erroSincronia} />
  }

  // O que aparece na tela

  const classesApp = ["app", modoEscuro && "modo-escuro", privado && "privado"]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classesApp}>

      <Sidebar abas={abasComSelo} aba={aba} onMudar={mudarAba} />

      <main className="conteudo">

        <Header>
          <div className="header-acoes">
            {podeInstalar && (
              <button className="btn-instalar" onClick={instalar}>
                <Icone nome="baixar" tamanho={16} />
                Instalar app
              </button>
            )}

            <button
              className="btn-olho btn-atalhos"
              onClick={() => setAjudaAberta(true)}
              aria-label="Atalhos de teclado"
              title="Atalhos de teclado (?)"
            >
              ?
            </button>

            <button
              className="btn-olho"
              onClick={() => setPrivado(!privado)}
              aria-label={privado ? "Mostrar valores" : "Ocultar valores"}
              title={privado ? "Mostrar valores" : "Ocultar valores"}
            >
              <Icone nome={privado ? "olhoOff" : "olho"} tamanho={18} />
            </button>

            <button
              className="btn-tema"
              role="switch"
              aria-checked={modoEscuro}
              aria-label="Alternar modo escuro"
              onClick={() => setModoEscuro(!modoEscuro)}
            >
              <span className="btn-tema-bolinha">
                <Icone nome={modoEscuro ? "lua" : "sol"} tamanho={15} />
              </span>
            </button>

            <button className="btn-sair" onClick={sair} title={usuario.email}>
              Sair
            </button>
          </div>
        </Header>

        {atualizacaoDisponivel && (
          <div className="banner-atualizacao" role="status">
            <span>Nova versão do app disponível.</span>
            <button type="button" onClick={atualizar}>Atualizar</button>
          </div>
        )}

        {!["nova", "caixinhas", "planejar", "avisos"].includes(aba) && mesesDisponiveis.length > 0 && (
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
              {!boasVindasVistas && visiveis.length === 0 && (
                <BoasVindas
                  onComecar={() => { setBoasVindasVistas(true); mudarAba("nova") }}
                  onDispensar={() => setBoasVindasVistas(true)}
                />
              )}

              <Resumo
                saldo={saldo}
                entradas={entradas}
                saidas={saidas}
              />

              {visiveis.length > 0 && <Previsao previsao={previsao} />}

              <div className="secao-topo">
                <h2 className="titulo-secao">Últimas transações</h2>
                <button
                  className="link-ver-todas"
                  onClick={() => mudarAba("transacoes")}
                >
                  Ver todas
                  <Icone nome="chevronDireita" tamanho={16} />
                </button>
              </div>

              <div className="transacoes">
                {ultimasTransacoes.length === 0 && (
                  <Vazio icone="transacoes">Nenhuma transação ainda.</Vazio>
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

                <button className="btn-exportar" onClick={exportarPDF}>
                  Relatório PDF
                </button>

                <button className="btn-exportar btn-limpar" onClick={() => setLimparAberto(true)}>
                  <Icone nome="lixeira" tamanho={16} />
                  Limpar
                </button>
              </div>

              <div className="transacoes">
                {transacoesOrdenadas.length === 0 && (
                  <Vazio icone="transacoes">Nenhuma transação encontrada.</Vazio>
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
              <h2 className="titulo-secao">Comparação entre meses</h2>

              <ComparacaoMeses transacoes={visiveis} />

              <h2 className="titulo-secao titulo-espaco">Gastos por categoria</h2>

              <Categorias
                gastosPorCategoria={gastos}
                totalGastos={totalGastos}
              />

              <h2 className="titulo-secao titulo-espaco">Orçamento</h2>

              <Orcamentos
                transacoes={visiveis}
                orcamentos={orcamentos}
                mes={mesOrcamento}
                onDefinir={definirOrcamento}
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

          {aba === "avisos" && (
            <Avisos
              avisos={avisos}
              lidos={lidosSet}
              atualizacaoDisponivel={atualizacaoDisponivel}
              onAtualizar={atualizar}
              onMarcar={marcarAvisosLidos}
              onAbrir={mudarAba}
            />
          )}

          {aba === "planejar" && (
            <>
              <Compromissos itens={compromissos} />

              <Cartoes
                cartoes={cartoes}
                transacoes={visiveis}
                faturasPagas={faturasPagas}
                onSalvar={salvarCartao}
                onExcluir={excluirCartao}
                onAlternarPaga={alternarFaturaPaga}
              />

              <Dividas
                dividas={dividas}
                onSalvar={salvarDivida}
                onExcluir={excluirDivida}
                onPagar={pagarDivida}
                onDesfazerPagamento={desfazerPagamentoDivida}
              />
            </>
          )}

          {aba === "nova" && (
            <>
              <FormularioTransacao
                form={form}
                editando={editandoId !== null}
                cartoes={cartoes}
                onAlterar={alterarCampo}
                onSalvar={salvarTransacao}
                onCancelar={cancelarEdicao}
              />

              <Recorrentes
                recorrentes={recorrentes}
                onExcluir={excluirRecorrente}
              />

              <GerenciarCategorias
                categorias={categoriasExtras}
                existentes={todasCategorias().map(([chave, info]) => ({ chave, nome: info.nome }))}
                onSalvar={salvarCategoria}
                onExcluir={excluirCategoria}
              />
            </>
          )}

        </div>

      </main>

      {ajudaAberta && <AjudaAtalhos onFechar={() => setAjudaAberta(false)} />}

      {limparAberto && (
        <LimparHistorico
          transacoes={transacoes}
          onOcultar={ocultarTransacoes}
          onRestaurar={restaurarTransacoes}
          onExcluirDeVez={excluirTransacoesDeVez}
          onFechar={() => setLimparAberto(false)}
        />
      )}

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

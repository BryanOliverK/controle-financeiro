import { Suspense, lazy, useEffect, useMemo, useState } from 'react'

import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Resumo from './components/Resumo'
import LancamentoRapido from './components/LancamentoRapido'
import MetaCartao from './components/MetaCartao'
import StatusNuvem from './components/StatusNuvem'
import TelaBloqueio from './components/TelaBloqueio'
import { useBloqueio } from './hooks/useBloqueio'
import { useOnline } from './hooks/useOnline'
import { estadoNuvem } from './utils/nuvem'
import Transacao from './components/Transacao'
import FormularioTransacao from './components/FormularioTransacao'
import Previsao from './components/Previsao'
import LimparHistorico from './components/LimparHistorico'
import BoasVindas from './components/BoasVindas'
import Icone from './components/Icone'
import Vazio from './components/Vazio'
import Login from './components/Login'
import TelaCarregando from './components/TelaCarregando'

import { NOVIDADES } from './novidades'
import LimiteDeErro from './components/LimiteDeErro'
import CarregandoAba from './components/CarregandoAba'

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
import { fotoDeArquivo } from './utils/foto'
import { iniciais } from './utils/perfil'
import { preferePoucoMovimento } from './utils/animacao'
import { infoConta, limparContas, limparTransferencias, registrarContas, semConta, validarTransferencia } from './utils/contas'
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
  ordenar,
  saldoDoDia
} from './utils/calculos'
import { baixarBackup, lerBackup } from './utils/backup'
import { baixarCSV } from './utils/exportar'
import {
  arredondar,
  brl,
  chaveMes,
  contar,
  dataParaIso,
  nomeMes,
  novoId,
  paraInputData
} from './utils/formatar'
import { unirPorId } from './utils/listas'
import { gastoDaCategoria, mensagemAlerta } from './utils/orcamentos'
import { gastoDoMes, limparMeta, mensagemAlertaMeta } from './utils/metaGeral'
import { criarRecorrente, gerarPendentes } from './utils/recorrentes'
import { imprimirRelatorio, montarRelatorioHtml } from './utils/relatorio'
import { validarTransacao } from './utils/validacao'

import './App.css'
import './categorias.css'
import './menu-mobile.css'
import './menu.css'
import './fx.css'
import './extras.css'
import './caixinhas.css'
import './login.css'
import './carregando.css'
import './recursos.css'

// data vazia = hoje (o formulário mostra a data de hoje e resolve ao salvar)

// Telas carregadas só quando precisam (abrir o app fica mais rápido).
// Depois que o app abre, tudo é baixado em segundo plano para funcionar offline.
const CARREGAR = {
  Avisos: () => import('./components/Avisos'),
  Cartoes: () => import('./components/Cartoes'),
  Contas: () => import('./components/Contas'),
  Perfil: () => import('./components/Perfil'),
  Dividas: () => import('./components/Dividas'),
  Compromissos: () => import('./components/Compromissos'),
  GerenciarCategorias: () => import('./components/GerenciarCategorias'),
  ImportarExtrato: () => import('./components/ImportarExtrato'),
  Categorias: () => import('./components/Categorias'),
  Caixinhas: () => import('./components/Caixinhas'),
  AjudaAtalhos: () => import('./components/AjudaAtalhos'),
  ComparacaoMeses: () => import('./components/ComparacaoMeses'),
  Orcamentos: () => import('./components/Orcamentos'),
  MetaGeral: () => import('./components/MetaGeral'),
  ResumoAnual: () => import('./components/ResumoAnual'),
  Recorrentes: () => import('./components/Recorrentes')
}

const Avisos = lazy(CARREGAR.Avisos)
const Cartoes = lazy(CARREGAR.Cartoes)
const Contas = lazy(CARREGAR.Contas)
const Perfil = lazy(CARREGAR.Perfil)
const Dividas = lazy(CARREGAR.Dividas)
const Compromissos = lazy(CARREGAR.Compromissos)
const GerenciarCategorias = lazy(CARREGAR.GerenciarCategorias)
const ImportarExtrato = lazy(CARREGAR.ImportarExtrato)
const Categorias = lazy(CARREGAR.Categorias)
const Caixinhas = lazy(CARREGAR.Caixinhas)
const AjudaAtalhos = lazy(CARREGAR.AjudaAtalhos)
const ComparacaoMeses = lazy(CARREGAR.ComparacaoMeses)
const Orcamentos = lazy(CARREGAR.Orcamentos)
const MetaGeral = lazy(CARREGAR.MetaGeral)
const ResumoAnual = lazy(CARREGAR.ResumoAnual)
const Recorrentes = lazy(CARREGAR.Recorrentes)

const FORM_VAZIO = {
  descricao: "", valor: "", tipo: "", categoria: "", data: "",
  repetir: false, parcelar: false, parcelas: "2", cartaoId: "", contaId: ""
}

const ABAS = [
  { id: "inicio", icone: "inicio", nome: "Início", grupo: "principal" },
  { id: "transacoes", icone: "trocar", nome: "Transações", grupo: "principal" },
  { id: "graficos", icone: "graficos", nome: "Gráficos", grupo: "principal" },
  { id: "caixinhas", icone: "caixinha", nome: "Caixinhas", grupo: "dinheiro" },
  { id: "contas", icone: "carteira", nome: "Contas", grupo: "dinheiro" },
  { id: "planejar", icone: "calendario", nome: "Planejar", grupo: "dinheiro" },
  { id: "avisos", icone: "sino", nome: "Avisos", grupo: "acoes" },
  { id: "nova", icone: "adicionar", nome: "Adicionar", grupo: "acoes", destaque: true },
  { id: "perfil", icone: "perfil", nome: "Perfil", grupo: "conta", rodape: true }
]

function App() {

  // Estados da tela

  const [aba, setAba] = useState("inicio")
  const [iniciarPrivado, setIniciarPrivado] = useLocalStorage("iniciarPrivado", true)
  const [privado, setPrivado] = useState(iniciarPrivado)
  const [modoLeve, setModoLeve] = useLocalStorage("modoLeve", preferePoucoMovimento())
  const [mes, setMes] = useState("todos")

  const [busca, setBusca] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [ordenacao, setOrdenacao] = useState("recentes")

  const [form, setForm] = useState(FORM_VAZIO)
  const [editandoId, setEditandoId] = useState(null)
  const [limparAberto, setLimparAberto] = useState(false)
  const [importarAberto, setImportarAberto] = useState(false)
  const [ajudaAberta, setAjudaAberta] = useState(false)

  // Dados (guardados no aparelho; a sincronização com a nuvem vem mais abaixo)

  const [transacoes, setTransacoes] = useLocalStorage("transacoes", [])
  const [caixinhas, setCaixinhas] = useLocalStorage("caixinhas", [])
  const [cdi, setCdi] = useLocalStorage("cdi", "14.5", { texto: true })
  const [pctCdi, setPctCdi] = useLocalStorage("pctCdi", "100", { texto: true })
  const [orcamentos, setOrcamentos] = useLocalStorage("orcamentos", {})
  const [metaGasto, setMetaGasto] = useLocalStorage("metaGasto", 0)
  const [recorrentes, setRecorrentes] = useLocalStorage("recorrentes", [])
  const [categoriasExtras, setCategoriasExtras] = useLocalStorage("categoriasExtras", [])
  const [cartoes, setCartoes] = useLocalStorage("cartoes", [])
  const [faturasPagas, setFaturasPagas] = useLocalStorage("faturasPagas", [])
  const [avisosLidos, setAvisosLidos] = useLocalStorage("avisosLidos", [])
  const [dividas, setDividas] = useLocalStorage("dividas", [])
  const [contas, setContas] = useLocalStorage("contas", [])
  const [transferencias, setTransferencias] = useLocalStorage("transferencias", [])
  const [foto, setFoto] = useLocalStorage("foto", "", { texto: true })
  const [modoEscuro, setModoEscuro] = useLocalStorage("modoEscuro", false)
  const [boasVindasVistas, setBoasVindasVistas] = useLocalStorage("boasVindasVistas", false)

  // As categorias do usuário precisam estar registradas antes de a tela desenhar
  registrarCategorias(categoriasExtras)
  registrarCartoes(cartoes)
  registrarContas(contas)

  const { aviso, mostrarAviso, fecharAviso } = useAviso()
  const { podeInstalar, instalar } = useInstalar()
  const { atualizacaoDisponivel, atualizar } = useAtualizacao()

  // Login e sincronização com a nuvem (veja hooks/useLogin e hooks/useSincronizacao)

  const {
    usuario, verificandoLogin, erroLogin,
    entrarComGoogle, entrarComEmail, criarContaComEmail, recuperarSenha, sair,
    salvarNome, enviarRedefinicaoDeSenha, excluirConta: excluirContaDeLogin
  } = useLogin()

  // Bloqueio por PIN e saída por inatividade
  const bloqueio = useBloqueio({ usuario, onSair: sair })

  // Enquanto a conta é excluída, a sincronização fica parada (senão recriaria os dados)
  const [excluindoConta, setExcluindoConta] = useState(false)

  const online = useOnline()

  const { sincronizado, erroSincronia, enviando, erroEnvio, erroEscuta, tentarDeNovo } = useSincronizacao({
    usuario,
    mostrarAviso,
    pausado: excluindoConta,
    dados: { transacoes, caixinhas, cdi, pctCdi, orcamentos, recorrentes, categoriasExtras, cartoes, faturasPagas, avisosLidos, dividas, contas, transferencias, foto, metaGasto },
    alterar: { setTransacoes, setCaixinhas, setCdi, setPctCdi, setOrcamentos, setRecorrentes, setCategoriasExtras, setCartoes, setFaturasPagas, setAvisosLidos, setDividas, setContas, setTransferencias, setFoto, setMetaGasto }
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
    () => gerarAvisos({ transacoes: visiveis, recorrentes, cartoes, faturasPagas, orcamentos, previsao, dividas, metaGasto }),
    [visiveis, recorrentes, cartoes, faturasPagas, orcamentos, previsao, dividas, metaGasto]
  )

  const lidosSet = useMemo(() => new Set(avisosLidos), [avisosLidos])

  const naoLidos = avisos.filter((a) => !lidosSet.has(a.id)).length + (atualizacaoDisponivel ? 1 : 0)

  const abasComSelo = ABAS.map((a) => {
    if (a.id === "avisos") return { ...a, selo: naoLidos }
    if (a.id === "perfil") return { ...a, avatar: { foto: foto || usuario?.photoURL || "", iniciais: iniciais(usuario?.displayName, usuario?.email) } }
    return a
  })

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

        if (form.contaId) {
          atualizada.contaId = form.contaId
        } else {
          delete atualizada.contaId
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
        ...(form.contaId ? { contaId: form.contaId } : {}),
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

      // Saída que chegou perto (ou passou) do orçamento da categoria ou da meta geral
      const alerta = alertasDoLancamento(nova)

      const mensagem = parcelando
        ? `Compra parcelada em ${quantidade}x adicionada`
        : form.repetir ? "Transação adicionada e repetida todo mês" : "Transação adicionada"

      mostrarAviso(
        alerta ? `${mensagem}. ${alerta}` : mensagem,
        alerta && alerta.includes("estourad") ? "erro" : "info"
      )
    }

    setForm(FORM_VAZIO)
  }

  function definirMetaGasto(valor) {
    const meta = limparMeta(valor)

    setMetaGasto(meta)
    mostrarAviso(meta > 0 ? "Meta de gastos salva" : "Meta de gastos removida")
  }

  // Texto de aviso quando uma saída nova chega perto (ou passa) do orçamento
  // da categoria ou da meta geral do mês. null se não há o que avisar.
  function alertasDoLancamento(nova) {
    if (nova.tipo !== "saida") {
      return null
    }

    const mes = chaveMes(nova.data)
    const avisos = []
    const limite = orcamentos[nova.categoria]

    if (limite) {
      const antes = gastoDaCategoria(visiveis, nova.categoria, mes)
      avisos.push(mensagemAlerta(nova.categoria, antes, arredondar(antes + nova.valor), limite))
    }

    if (metaGasto > 0 && nova.categoria !== "caixinha") {
      const antes = gastoDoMes(visiveis, mes)
      avisos.push(mensagemAlertaMeta(antes, arredondar(antes + nova.valor), metaGasto))
    }

    return avisos.filter(Boolean).join(". ") || null
  }

  // Lançamento rápido ("mercado 85"): já nasce pronto, com Desfazer
  function lancarRapido({ descricao, valor, tipo, categoria, contaId }) {

    const nova = {
      id: novoId(),
      descricao,
      valor: arredondar(valor),
      tipo,
      categoria,
      ...(contaId && contas.some((c) => c.id === contaId) ? { contaId } : {}),
      data: new Date().toISOString()
    }

    const alerta = alertasDoLancamento(nova)

    setTransacoes((atuais) => [...atuais, nova])

    const texto = `${tipo === "entrada" ? "Entrada" : "Saída"} de ${brl(nova.valor)}: ${descricao}`

    mostrarAviso(
      alerta ? `${texto}. ${alerta}` : texto,
      alerta && alerta.includes("estourad") ? "erro" : "info",
      () => {
        setTransacoes((atuais) => atuais.filter((t) => t.id !== nova.id))
        fecharAviso()
      }
    )
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
      cartaoId: transacao.cartaoId && infoCartao(transacao.cartaoId) ? transacao.cartaoId : "",
      contaId: transacao.contaId && infoConta(transacao.contaId) ? transacao.contaId : ""
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

  // Foto de perfil

  async function trocarFoto(arquivo) {
    try {
      setFoto(await fotoDeArquivo(arquivo))
      mostrarAviso("Foto atualizada")
    } catch (erro) {
      mostrarAviso(erro instanceof Error ? erro.message : "Não foi possível usar essa imagem", "erro")
    }
  }

  function removerFoto() {
    setFoto("")
    mostrarAviso("Foto removida")
  }

  // Excluir a conta (pede senha/Google; veja useLogin)

  async function excluirMinhaConta(senha) {

    setExcluindoConta(true)

    // Dá um instante para a sincronização parar de verdade antes de apagar
    await new Promise((resolver) => setTimeout(resolver, 120))

    const resultado = await excluirContaDeLogin(senha)

    // Só volta a sincronizar se a nuvem ainda tem os dados
    if (!resultado.nuvemApagada) {
      setExcluindoConta(false)
    }

    return resultado.erro
  }

  // Importar extrato

  function importarExtrato(itens, contaId) {

    if (itens.length === 0) {
      return
    }

    const idConta = contaId && contas.some((c) => c.id === contaId) ? contaId : ""

    const novas = itens.map((i) => ({
      id: novoId(),
      descricao: i.descricao,
      valor: arredondar(i.valor),
      tipo: i.tipo,
      categoria: categoriaCompativel(i.categoria, i.tipo) ? i.categoria : "outros",
      ...(idConta ? { contaId: idConta } : {}),
      data: i.data
    }))

    const ids = new Set(novas.map((t) => t.id))

    setTransacoes((atuais) => [...atuais, ...novas])
    setImportarAberto(false)

    mostrarAviso(
      `${contar(novas.length, "transação importada", "transações importadas")}`,
      "info",
      () => {
        setTransacoes((atuais) => atuais.filter((t) => !ids.has(t.id)))
        fecharAviso()
      }
    )
  }

  // Contas e transferências

  function salvarConta({ id, nome, tipo, saldoInicial, cor }) {

    if (id) {
      setContas((atuais) => atuais.map((c) => (c.id === id ? { ...c, nome, tipo, saldoInicial, cor } : c)))
      mostrarAviso("Conta atualizada")
      return
    }

    setContas((atuais) => [...atuais, { id: novoId(), nome, tipo, saldoInicial, cor }])
    mostrarAviso("Conta criada")
  }

  function excluirConta(id) {

    // As transações ficam no histórico, só deixam de pertencer à conta
    setTransacoes((atuais) => atuais.map((t) => (t.contaId === id ? semConta(t) : t)))
    setRecorrentes((atuais) => atuais.map((r) => (r.contaId === id ? semConta(r) : r)))
    setTransferencias((atuais) => atuais.filter((t) => t.de !== id && t.para !== id))
    setForm((atual) => (atual.contaId === id ? { ...atual, contaId: "" } : atual))
    setContas((atuais) => atuais.filter((c) => c.id !== id))

    mostrarAviso("Conta excluída")
  }

  function transferir({ de, para, valor, data, nota }) {

    const erro = validarTransferencia({ de, para, valor }, contas)

    if (erro) {
      mostrarAviso(erro, "erro")
      return
    }

    setTransferencias((atuais) => [
      ...atuais,
      { id: novoId(), de, para, valor: arredondar(Number(valor)), data: dataParaIso(data), nota: nota.trim() }
    ])

    mostrarAviso("Transferência registrada")
  }

  function excluirTransferencia(id) {
    setTransferencias((atuais) => atuais.filter((t) => t.id !== id))
    mostrarAviso("Transferência desfeita")
  }

  function atribuirSemConta(contaId) {

    if (!contas.some((c) => c.id === contaId)) {
      return
    }

    const ids = new Set(contas.map((c) => c.id))

    setTransacoes((atuais) => atuais.map((t) => (
      t.categoria !== "caixinha" && (!t.contaId || !ids.has(t.contaId)) ? { ...t, contaId } : t
    )))

    mostrarAviso("Transações atribuídas à conta")
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
    baixarBackup({ transacoes, caixinhas, cdi, pctCdi, orcamentos, recorrentes, categoriasExtras, cartoes, faturasPagas, dividas, contas, transferencias, metaGasto })
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

      const idsContas = new Set(contas.map((c) => c.id))

      const novasContas = backup.contas
        .filter((c) => !idsContas.has(c.id)).length

      const idsTransf = new Set(transferencias.map((t) => t.id))

      const novasTransf = backup.transferencias
        .filter((t) => !idsTransf.has(t.id)).length

      const metaNova = !(metaGasto > 0) && backup.metaGasto > 0

      if (
        !metaNova && novasTransacoes === 0 && novasCaixinhas === 0 &&
        novasRecorrentes === 0 && novosLimites === 0 &&
        novasCategorias === 0 && novosCartoes === 0 && novasDividas === 0 &&
        novasContas === 0 && novasTransf === 0
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
      setContas((atuais) => limparContas(unirPorId(atuais, backup.contas)))
      setTransferencias((atuais) => limparTransferencias(unirPorId(atuais, backup.transferencias)))
      setMetaGasto((atual) => (atual > 0 ? atual : backup.metaGasto))

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

  // Acessibilidade: "pular para o conteúdo" e foco no conteúdo ao trocar de aba
  function irParaConteudo(evento) {
    evento.preventDefault()
    document.getElementById("conteudo")?.focus()
  }

  useEffect(() => {
    const ativo = document.activeElement

    // Só move o foco se a pessoa veio do menu (não atrapalha quem está digitando)
    if (!ativo || ativo === document.body || ativo.closest?.(".sidebar")) {
      document.getElementById("conteudo")?.focus({ preventScroll: true })
    }
  }, [aba])

  // Título da página muda com a aba (aparece no histórico e nas abas do navegador)
  useEffect(() => {
    const nome = ABAS.find((a) => a.id === aba)?.nome
    document.title = bloqueio.bloqueado ? "Bloqueado · Controle Financeiro" : aba === "inicio" || !nome ? "Controle Financeiro" : `${nome} · Controle Financeiro`
  }, [aba, bloqueio.bloqueado])

  // Com o app aberto e sincronizado, baixa as outras telas em segundo plano
  useEffect(() => {
    if (!usuario || !sincronizado) {
      return undefined
    }

    const agendar = window.requestIdleCallback || ((f) => setTimeout(f, 1500))
    const cancelar = window.cancelIdleCallback || clearTimeout

    const id = agendar(() => {
      Object.values(CARREGAR).forEach((carregar) => carregar().catch(() => {}))
    })

    return () => cancelar(id)
  }, [usuario, sincronizado])

  // Foca um campo assim que ele aparecer (a aba nova pode demorar um instante)
  function irParaCampo(seletor) {
    let tentativas = 0

    const timer = setInterval(() => {
      const campo = document.querySelector(seletor)

      if (campo) {
        campo.focus()
        clearInterval(timer)
      } else if (++tentativas > 20) {
        clearInterval(timer)
      }
    }, 50)
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
    Boolean(usuario) && sincronizado && !ajudaAberta && !bloqueio.bloqueado
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
        modoLeve={modoLeve}
      />
    )
  }

  // Com PIN ativo, nada do app aparece até destravar
  if (bloqueio.bloqueado) {
    return (
      <TelaBloqueio
        nome={usuario.displayName}
        foto={foto || usuario.photoURL || ""}
        iniciais={iniciais(usuario.displayName, usuario.email)}
        tamanho={bloqueio.config.pin.tam}
        temBiometria={Boolean(bloqueio.config.bio)}
        onPin={bloqueio.destravarComPin}
        onBiometria={bloqueio.destravarComBiometria}
        esperaAtualMs={bloqueio.esperaAtualMs}
        onSair={sair}
        modoEscuro={modoEscuro}
        modoLeve={modoLeve}
      />
    )
  }

  if (!sincronizado) {
    return <TelaCarregando etapa={1} modoEscuro={modoEscuro} erro={erroSincronia} />
  }

  // O que aparece na tela

  const classesApp = ["app", modoEscuro && "modo-escuro", privado && "privado", modoLeve && "modo-leve"]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classesApp}>

      <a href="#conteudo" className="pular-conteudo" onClick={irParaConteudo}>Pular para o conteúdo</a>

      <Sidebar abas={abasComSelo} aba={aba} onMudar={mudarAba} />

      <main className="conteudo" id="conteudo" tabIndex={-1}>

        <Header>
          <div className="header-acoes">
            <StatusNuvem
              {...estadoNuvem({ online, enviando, erroEnvio, erroEscuta })}
              onTentar={tentarDeNovo}
            />

            {podeInstalar && (
              <button className="btn-instalar" onClick={instalar}>
                <Icone nome="baixar" tamanho={16} />
                Instalar app
              </button>
            )}

            {bloqueio.config.pin && (
              <button
                className="btn-olho"
                onClick={bloqueio.bloquearAgora}
                aria-label="Bloquear o app agora"
                title="Bloquear agora"
              >
                <Icone nome="cadeado" tamanho={18} />
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

        {!["nova", "caixinhas", "contas", "planejar", "avisos", "perfil"].includes(aba) && mesesDisponiveis.length > 0 && (
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
         <LimiteDeErro compacto>
          <Suspense fallback={<CarregandoAba />}>

          {aba === "inicio" && (
            <>
              {!boasVindasVistas && visiveis.length === 0 && (
                <BoasVindas
                  onComecar={() => { setBoasVindasVistas(true); mudarAba("nova") }}
                  onDispensar={() => setBoasVindasVistas(true)}
                />
              )}

              <LancamentoRapido transacoes={visiveis} onLancar={lancarRapido} />

              <Resumo
                saldo={saldo}
                entradas={entradas}
                saidas={saidas}
                animar={!modoLeve}
              />

              <MetaCartao
                gasto={gastoDoMes(visiveis, mesOrcamento)}
                meta={metaGasto}
                onAjustar={() => mudarAba("graficos")}
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
                  <Vazio
                    icone="transacoes"
                    titulo="Nada por aqui ainda"
                    acao={{ texto: "Adicionar transação", icone: "adicionar", onClick: () => mudarAba("nova") }}
                  >
                    Lance sua primeira entrada ou saída e ela aparece aqui.
                  </Vazio>
                )}

                {ultimasTransacoes.map((transacao) => (
                  <Transacao key={transacao.id} transacao={transacao} />
                ))}
              </div>

            </>
          )}

          {aba === "transacoes" && (
            <>
              <LancamentoRapido transacoes={visiveis} onLancar={lancarRapido} />

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

                <button className="btn-exportar" onClick={() => setImportarAberto(true)}>
                  <Icone nome="subir" tamanho={16} />
                  Importar extrato
                </button>

                <button className="btn-exportar btn-limpar" onClick={() => setLimparAberto(true)}>
                  <Icone nome="lixeira" tamanho={16} />
                  Limpar
                </button>
              </div>

              <div className="transacoes">
                {transacoesOrdenadas.length === 0 && (
                  transacoesDoMes.length === 0 ? (
                    <Vazio
                      icone="transacoes"
                      titulo="Nenhuma transação neste mês"
                      acao={{ texto: "Adicionar transação", icone: "adicionar", onClick: () => mudarAba("nova") }}
                    >
                      Troque de mês no topo ou lance uma nova transação.
                    </Vazio>
                  ) : (
                    <Vazio
                      icone="busca"
                      titulo="Nada encontrado"
                      acao={{ texto: "Limpar filtros", onClick: () => { setBusca(""); setFiltroTipo("todos") } }}
                    >
                      Nenhuma transação combina com a busca ou o filtro.
                    </Vazio>
                  )
                )}

                {transacoesPorData.map(([data, grupo]) => (
                  <div className="grupo-data" key={data}>

                    <h3 className="titulo-data">
                      <span>{data}</span>
                      <span className={`titulo-data-total valor-privado ${saldoDoDia(grupo) < 0 ? "negativo" : "positivo"}`}>
                        {saldoDoDia(grupo) > 0 ? "+" : saldoDoDia(grupo) < 0 ? "−" : ""}{brl(Math.abs(saldoDoDia(grupo)))}
                      </span>
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

              <h2 className="titulo-secao titulo-espaco">Resumo do ano</h2>

              <ResumoAnual transacoes={visiveis} />

              <h2 className="titulo-secao titulo-espaco">Gastos por categoria</h2>

              <Categorias
                gastosPorCategoria={gastos}
                totalGastos={totalGastos}
              />

              <h2 className="titulo-secao titulo-espaco">Orçamento</h2>

              <MetaGeral
                key={metaGasto}
                transacoes={visiveis}
                meta={metaGasto}
                mes={mesOrcamento}
                onDefinir={definirMetaGasto}
              />

              <Orcamentos
                transacoes={visiveis}
                orcamentos={orcamentos}
                mes={mesOrcamento}
                onDefinir={definirOrcamento}
              />
            </>
          )}

          {aba === "perfil" && (
            <Perfil
              usuario={usuario}
              foto={foto}
              onTrocarFoto={trocarFoto}
              onRemoverFoto={removerFoto}
              versao={NOVIDADES[0].versao}
              dados={{ transacoes: visiveis, caixinhas, contas, cartoes, dividas }}
              modoEscuro={modoEscuro}
              onModoEscuro={() => setModoEscuro(!modoEscuro)}
              iniciarPrivado={iniciarPrivado}
              onIniciarPrivado={() => setIniciarPrivado(!iniciarPrivado)}
              modoLeve={modoLeve}
              onModoLeve={() => setModoLeve(!modoLeve)}
              bloqueio={bloqueio}
              onAviso={mostrarAviso}
              onSalvarNome={salvarNome}
              onEnviarRedefinicao={enviarRedefinicaoDeSenha}
              onSair={sair}
              onExcluirConta={excluirMinhaConta}
              onExportarBackup={exportarBackup}
              onImportarBackup={importarBackup}
            />
          )}

          {aba === "contas" && (
            <Contas
              contas={contas}
              transacoes={transacoes}
              transferencias={transferencias}
              onSalvar={salvarConta}
              onExcluir={excluirConta}
              onTransferir={transferir}
              onExcluirTransferencia={excluirTransferencia}
              onAtribuirSemConta={atribuirSemConta}
            />
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
                historico={visiveis}
                form={form}
                editando={editandoId !== null}
                cartoes={cartoes}
                contas={contas}
                onAlterar={alterarCampo}
                onSalvar={salvarTransacao}
                onCancelar={cancelarEdicao}
              />

              <Suspense fallback={null}>
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
              </Suspense>
            </>
          )}

          </Suspense>
         </LimiteDeErro>
        </div>

      </main>

      {ajudaAberta && (
        <Suspense fallback={null}>
          <AjudaAtalhos onFechar={() => setAjudaAberta(false)} />
        </Suspense>
      )}

      {importarAberto && (
        <Suspense fallback={null}>
          <ImportarExtrato
            transacoes={transacoes}
            contas={contas}
            onImportar={importarExtrato}
            onFechar={() => setImportarAberto(false)}
          />
        </Suspense>
      )}

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

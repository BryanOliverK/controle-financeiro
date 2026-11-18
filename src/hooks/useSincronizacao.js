import { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

import { db } from '../firebase'
import { limparAvisosLidos } from '../utils/avisos'
import { limparCartoes, limparFaturasPagas } from '../utils/cartoes'
import { limparCategoriasExtras } from '../utils/categorias'
import { limparContas, limparTransferencias } from '../utils/contas'
import { limparFoto } from '../utils/foto'
import { limparDividas } from '../utils/dividas'
import { unirPorId } from '../utils/listas'
import { limparOrcamentos } from '../utils/orcamentos'
import { mensagemErroNuvem } from '../utils/nuvem'

// Sincronização com o Firestore (documento usuarios/{uid}).
// IMPORTANTE: a ordem dos campos na "chave" do listener e na do envio precisa
// ser a mesma, senão o app acha que algo mudou e fica reenviando.
export function useSincronizacao({ usuario, dados, alterar, mostrarAviso, pausado = false }) {
  const [sincronizado, setSincronizado] = useState(false)
  const [erroSincronia, setErroSincronia] = useState("")
  const [emVoo, setEmVoo] = useState(0)
  const [erroEnvio, setErroEnvio] = useState("")
  const [erroEscuta, setErroEscuta] = useState("")
  const [tentativa, setTentativa] = useState(0)
  const ultimoRemoto = useRef("")
  const avisouErro = useRef(false)

  const { transacoes, caixinhas, cdi, pctCdi, orcamentos, recorrentes, categoriasExtras, cartoes, faturasPagas, avisosLidos, dividas, contas, transferencias, foto } = dados
  const { setTransacoes, setCaixinhas, setCdi, setPctCdi, setOrcamentos, setRecorrentes, setCategoriasExtras, setCartoes, setFaturasPagas, setAvisosLidos, setDividas, setContas, setTransferencias, setFoto } = alterar

  // Sem login: volta a "não sincronizado"
  useEffect(() => {
    if (!usuario) {
      setSincronizado(false)
    }
  }, [usuario])

  // Recebe os dados da nuvem em tempo real

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
  if (!usuario || pausado) {
    return
  }

  const referencia = doc(db, "usuarios", usuario.uid)

  // includeMetadataChanges: avisa também quando o Firestore passa do cache
  // para a resposta do servidor (sem isso, uma conta sem documento ficaria
  // esperando para sempre depois de uma resposta só do cache)
  return onSnapshot(referencia, { includeMetadataChanges: true }, (snap) => {
    // Eco das nossas próprias gravações: ignora
    if (snap.metadata.hasPendingWrites) {
      return
    }

    // Resposta só do cache e sem documento = o Firestore acha que está sem
    // conexão. Ainda não dá para saber se a conta é nova: espera o servidor.
    // (Tratar como "conta nova" poderia subir dados locais vazios por cima
    // dos da nuvem.)
    if (!snap.exists() && snap.metadata.fromCache) {
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
    const orcamentosRemoto = limparOrcamentos(dados.orcamentos)
    const recorrentesRemoto = dados.recorrentes || []
    const categoriasRemoto = limparCategoriasExtras(dados.categoriasExtras)
    const cartoesRemoto = limparCartoes(dados.cartoes)
    const pagasRemoto = limparFaturasPagas(dados.faturasPagas)
    const lidosRemoto = limparAvisosLidos(dados.avisosLidos)
    const dividasRemoto = limparDividas(dados.dividas)
    const contasRemoto = limparContas(dados.contas)
    const transferenciasRemoto = limparTransferencias(dados.transferencias)
    const fotoRemoto = limparFoto(dados.foto)

    const chave = JSON.stringify({
      transacoes: remotasT,
      caixinhas: remotasC,
      cdi: cdiRemoto,
      pctCdi: pctRemoto,
      orcamentos: orcamentosRemoto,
      recorrentes: recorrentesRemoto,
      categoriasExtras: categoriasRemoto,
      cartoes: cartoesRemoto,
      faturasPagas: pagasRemoto,
      avisosLidos: lidosRemoto,
      dividas: dividasRemoto,
      contas: contasRemoto,
      transferencias: transferenciasRemoto,
      foto: fotoRemoto
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

      setOrcamentos((locais) =>
        primeiraVez ? { ...locais, ...orcamentosRemoto } : orcamentosRemoto
      )

      setRecorrentes((locais) =>
        primeiraVez ? unirPorId(recorrentesRemoto, locais) : recorrentesRemoto
      )

      setCategoriasExtras((locais) =>
        primeiraVez ? unirPorId(categoriasRemoto, locais) : categoriasRemoto
      )

      setCartoes((locais) =>
        primeiraVez ? unirPorId(cartoesRemoto, locais) : cartoesRemoto
      )

      setFaturasPagas((locais) =>
        primeiraVez ? limparFaturasPagas([...pagasRemoto, ...locais]) : pagasRemoto
      )

      setAvisosLidos((locais) =>
        primeiraVez ? limparAvisosLidos([...lidosRemoto, ...locais]) : lidosRemoto
      )

      setDividas((locais) =>
        primeiraVez ? unirPorId(dividasRemoto, locais) : dividasRemoto
      )

      setContas((locais) =>
        primeiraVez ? unirPorId(contasRemoto, locais) : contasRemoto
      )

      setTransferencias((locais) =>
        primeiraVez ? unirPorId(transferenciasRemoto, locais) : transferenciasRemoto
      )

      setFoto((local) =>
        primeiraVez ? (fotoRemoto || local) : fotoRemoto
      )
    }

    localStorage.setItem(chaveMigracao, "1")
    setSincronizado(true)
    setErroSincronia("")
    setErroEscuta("")
    }, (erro) => {
      const mensagem = erro.code === "permission-denied"
        ? "O Firebase recusou o acesso aos seus dados. Confira as regras do Firestore."
        : "Não foi possível carregar seus dados da nuvem. Confira sua conexão e tente de novo."

      setErroSincronia(mensagem)
      setErroEscuta(mensagem)
    })
  }, [usuario, pausado, tentativa])

  // Envia as mudanças para a nuvem

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!usuario || !sincronizado || pausado) {
      return
    }

    const dados = JSON.parse(JSON.stringify({
      transacoes,
      caixinhas,
      cdi,
      pctCdi,
      orcamentos,
      recorrentes,
      categoriasExtras,
      cartoes,
      faturasPagas,
      avisosLidos,
      dividas,
      contas,
      transferencias,
      foto
    }))

    const chave = JSON.stringify(dados)

    if (chave === ultimoRemoto.current) {
      return
    }

    ultimoRemoto.current = chave

    setEmVoo((n) => n + 1)

    setDoc(doc(db, "usuarios", usuario.uid), dados, { merge: true })
      .then(() => {
        setErroEnvio("")

        // Voltou a funcionar depois de uma falha
        if (avisouErro.current) {
          avisouErro.current = false
          mostrarAviso("Tudo sincronizado de novo")
        }
      })
      .catch((erro) => {
        const mensagem = mensagemErroNuvem(erro?.code)

        setErroEnvio(mensagem)

        // Avisa uma vez por falha (não a cada tentativa)
        if (!avisouErro.current) {
          avisouErro.current = true
          mostrarAviso(mensagem, "erro")
        }
      })
      .finally(() => setEmVoo((n) => Math.max(0, n - 1)))

  }, [usuario, sincronizado, transacoes, caixinhas, cdi, pctCdi, orcamentos, recorrentes, categoriasExtras, cartoes, faturasPagas, avisosLidos, dividas, contas, transferencias, foto, pausado, tentativa])

  // Tentar de novo: manda tudo outra vez e volta a escutar a nuvem
  function tentarDeNovo() {
    ultimoRemoto.current = ""
    setErroEnvio("")
    setErroEscuta("")
    setTentativa((n) => n + 1)
  }

  // Voltou a internet depois de uma falha: tenta sozinho
  useEffect(() => {
    if (!erroEnvio && !erroEscuta) {
      return undefined
    }

    window.addEventListener("online", tentarDeNovo)
    return () => window.removeEventListener("online", tentarDeNovo)
  }, [erroEnvio, erroEscuta])

  // Fechar a aba com alteração ainda sem chegar na nuvem: pede confirmação
  const pendente = emVoo > 0 || Boolean(erroEnvio)

  useEffect(() => {
    if (!pendente) {
      return undefined
    }

    const avisar = (evento) => {
      evento.preventDefault()
      evento.returnValue = ""
    }

    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [pendente])

  return { sincronizado, erroSincronia, enviando: emVoo > 0, erroEnvio, erroEscuta, tentarDeNovo }
}

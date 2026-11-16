import { useEffect, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

import { db } from '../firebase'
import { limparAvisosLidos } from '../utils/avisos'
import { limparCartoes, limparFaturasPagas } from '../utils/cartoes'
import { limparCategoriasExtras } from '../utils/categorias'
import { limparDividas } from '../utils/dividas'
import { unirPorId } from '../utils/listas'
import { limparOrcamentos } from '../utils/orcamentos'

// Sincronização com o Firestore (documento usuarios/{uid}).
// IMPORTANTE: a ordem dos campos na "chave" do listener e na do envio precisa
// ser a mesma, senão o app acha que algo mudou e fica reenviando.
export function useSincronizacao({ usuario, dados, alterar, mostrarAviso }) {
  const [sincronizado, setSincronizado] = useState(false)
  const [erroSincronia, setErroSincronia] = useState("")
  const ultimoRemoto = useRef("")

  const { transacoes, caixinhas, cdi, pctCdi, orcamentos, recorrentes, categoriasExtras, cartoes, faturasPagas, avisosLidos, dividas } = dados
  const { setTransacoes, setCaixinhas, setCdi, setPctCdi, setOrcamentos, setRecorrentes, setCategoriasExtras, setCartoes, setFaturasPagas, setAvisosLidos, setDividas } = alterar

  // Sem login: volta a "não sincronizado"
  useEffect(() => {
    if (!usuario) {
      setSincronizado(false)
    }
  }, [usuario])

  // Recebe os dados da nuvem em tempo real

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
  if (!usuario) {
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
      dividas: dividasRemoto
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
    }

    localStorage.setItem(chaveMigracao, "1")
    setSincronizado(true)
    setErroSincronia("")
    }, (erro) => {
      setErroSincronia(
        erro.code === "permission-denied"
          ? "O Firebase recusou o acesso aos seus dados. Confira as regras do Firestore."
          : "Não foi possível carregar seus dados da nuvem. Confira sua conexão e tente de novo."
      )
    })
  }, [usuario])

  // Envia as mudanças para a nuvem

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!usuario || !sincronizado) {
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
      dividas
    }))

    const chave = JSON.stringify(dados)

    if (chave === ultimoRemoto.current) {
      return
    }

    ultimoRemoto.current = chave

    setDoc(doc(db, "usuarios", usuario.uid), dados, { merge: true })
      .catch(() => mostrarAviso("Não foi possível sincronizar", "erro"))

  }, [usuario, sincronizado, transacoes, caixinhas, cdi, pctCdi, orcamentos, recorrentes, categoriasExtras, cartoes, faturasPagas, avisosLidos, dividas])

  return { sincronizado, erroSincronia }
}

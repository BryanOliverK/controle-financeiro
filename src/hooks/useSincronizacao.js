import { useCallback, useEffect, useRef, useState } from "react"
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import { db } from "../firebase"

// Junta duas listas pelo id (usado só no primeiro acesso de um aparelho)
function unirPorId(remotas, locais) {
  const ids = new Set(remotas.map((item) => item.id))
  return [...remotas, ...locais.filter((item) => !ids.has(item.id))]
}

// Mantém o app e o Firestore iguais: recebe as mudanças da nuvem em tempo
// real e envia as mudanças locais. "sincronizado" fica true quando a primeira
// leitura da nuvem terminou.
export function useSincronizacao({
  usuario,
  transacoes,
  caixinhas,
  cdi,
  pctCdi,
  setTransacoes,
  setCaixinhas,
  setCdi,
  setPctCdi,
  aoErro
}) {

  const uid = usuario ? usuario.uid : null

  const [uidSincronizado, setUidSincronizado] = useState(null)
  const [erro, setErro] = useState("")
  const [tentativa, setTentativa] = useState(0)

  const ultimoRemoto = useRef("")
  const aoErroRef = useRef(aoErro)

  const sincronizado = uid !== null && uidSincronizado === uid

  useEffect(() => {
    aoErroRef.current = aoErro
  })

  // Recebe os dados da nuvem em tempo real

  useEffect(() => {
    if (!uid) {
      return
    }

    ultimoRemoto.current = ""

    const referencia = doc(db, "usuarios", uid)

    return onSnapshot(
      referencia,

      (snap) => {
        console.log("SNAP", snap.exists(), snap.metadata.fromCache, snap.metadata.hasPendingWrites)
        // Eco das nossas próprias gravações: ignora
        if (snap.metadata.hasPendingWrites) {
          return
        }

        // Cache vazio neste aparelho: espera a resposta do servidor
        if (!snap.exists() && snap.metadata.fromCache) {
          return
        }

        const chaveMigracao = "migrado_" + uid
        const primeiraVez = !localStorage.getItem(chaveMigracao)

        if (!snap.exists()) {
          // Conta nova: o que já existe neste aparelho sobe para a nuvem
          localStorage.setItem(chaveMigracao, "1")
          setUidSincronizado(uid)
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
        setUidSincronizado(uid)
      },

      (falha) => {
        console.error("Erro ao ler do Firestore:", falha)
        setErro("Não foi possível carregar seus dados.")
      }
    )
  }, [uid, tentativa, setTransacoes, setCaixinhas, setCdi, setPctCdi])

  // Envia as mudanças para a nuvem

  useEffect(() => {
    if (!uid || !sincronizado) {
      return
    }

    // O JSON tira campos undefined, que o Firestore não aceita
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

    setDoc(doc(db, "usuarios", uid), dados, { merge: true })
      .catch(() => {
        // Libera para tentar de novo na próxima mudança
        ultimoRemoto.current = ""
        aoErroRef.current?.("Não foi possível sincronizar")
      })

  }, [uid, sincronizado, transacoes, caixinhas, cdi, pctCdi])

  const tentarNovamente = useCallback(() => {
    setErro("")
    setTentativa((n) => n + 1)
  }, [])

  return { sincronizado, erro, tentarNovamente }
}

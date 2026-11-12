import { useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from "firebase/auth"
import { clearIndexedDbPersistence, terminate } from "firebase/firestore"
import { auth, db, provider } from "../firebase"

const CHAVES_LOCAIS = [
  "transacoes", "caixinhas", "saldo", "entradas", "saidas", "cdi", "pctCdi"
]

export function useAuth() {

  const [usuario, setUsuario] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [erroLogin, setErroLogin] = useState("")

  useEffect(() => {
    return onAuthStateChanged(auth, (pessoa) => {
      setUsuario(pessoa)
      setVerificando(false)
    })
  }, [])

  function entrar() {
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

  async function sair() {
    try {
      await signOut(auth)
    } catch {
      return
    }

    // Limpa a cópia local para ninguém ver seus dados neste aparelho
    CHAVES_LOCAIS.forEach((chave) => localStorage.removeItem(chave))

    // O cache offline do Firestore também guarda os dados: apaga junto
    try {
      await terminate(db)
      await clearIndexedDbPersistence(db)
    } catch {
      // sem cache persistente neste navegador: nada a limpar
    }

    window.location.reload()
  }

  return { usuario, verificando, erroLogin, entrar, sair }
}

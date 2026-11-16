import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut
} from 'firebase/auth'

import { auth, provider } from '../firebase'
import { mensagemErroAuth } from '../utils/erroAuth'

// Chaves do localStorage apagadas ao sair (a cópia local some do aparelho).
// Se um dia surgir um dado novo guardado no aparelho, ele entra aqui também.
export const CHAVES_LOCAIS = [
  "transacoes", "caixinhas", "saldo", "entradas", "saidas", "cdi", "pctCdi",
  "orcamentos", "recorrentes", "categoriasExtras", "cartoes", "faturasPagas", "avisosLidos", "dividas", "contas", "transferencias"
]

// Login e logout (Google e e-mail/senha). Não mexe em dados financeiros.
export function useLogin() {
  const [usuario, setUsuario] = useState(null)
  const [verificandoLogin, setVerificandoLogin] = useState(true)
  const [erroLogin, setErroLogin] = useState("")

  useEffect(() => {
    return onAuthStateChanged(auth, (pessoa) => {
      setUsuario(pessoa)
      setVerificandoLogin(false)
    })
  }, [])

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

  // Cada função devolve o texto do erro, ou null quando deu certo.

  async function entrarComEmail(email, senha) {
    setErroLogin("")

    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha)
      return null
    } catch (erro) {
      return mensagemErroAuth(erro.code)
    }
  }

  async function criarContaComEmail(email, senha) {
    setErroLogin("")

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), senha)
      return null
    } catch (erro) {
      return mensagemErroAuth(erro.code)
    }
  }

  async function recuperarSenha(email) {
    try {
      await sendPasswordResetEmail(auth, email.trim())
      return null
    } catch (erro) {
      // Não revela se o e-mail tem conta ou não
      return erro.code === "auth/user-not-found" ? null : mensagemErroAuth(erro.code)
    }
  }

  function sair() {
    signOut(auth).then(() => {

      // Limpa a cópia local para ninguém ver seus dados neste aparelho
      CHAVES_LOCAIS.forEach((chave) => localStorage.removeItem(chave))

      window.location.reload()
    })
  }

  return {
    usuario,
    verificandoLogin,
    erroLogin,
    entrarComGoogle,
    entrarComEmail,
    criarContaComEmail,
    recuperarSenha,
    sair
  }
}

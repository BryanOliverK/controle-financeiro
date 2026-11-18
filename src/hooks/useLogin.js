import { useEffect, useState } from 'react'
import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile
} from 'firebase/auth'
import { deleteDoc, doc } from 'firebase/firestore'

import { auth, db, provider } from '../firebase'
import { mensagemErroAuth } from '../utils/erroAuth'
import { usaSenha, validarNomePerfil } from '../utils/perfil'

// Chaves do localStorage apagadas ao sair (a cópia local some do aparelho).
// Se um dia surgir um dado novo guardado no aparelho, ele entra aqui também.
export const CHAVES_LOCAIS = [
  "transacoes", "caixinhas", "saldo", "entradas", "saidas", "cdi", "pctCdi",
  "orcamentos", "recorrentes", "categoriasExtras", "cartoes", "faturasPagas", "avisosLidos", "dividas", "contas", "transferencias", "foto",
  "bloqueio", "bloqueioTentativas"
]

// Login e logout (Google e e-mail/senha). Não mexe em dados financeiros.
export function useLogin() {
  const [usuario, setUsuario] = useState(null)
  const [verificandoLogin, setVerificandoLogin] = useState(true)
  const [erroLogin, setErroLogin] = useState("")

  // O objeto do usuário muda por dentro (nome); este contador força a tela a redesenhar
  const [, setVersaoPerfil] = useState(0)

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

  // ----- Perfil -----

  // Devolve o texto do erro, ou null quando deu certo
  async function salvarNome(nome) {
    const erro = validarNomePerfil(nome)

    if (erro) {
      return erro
    }

    try {
      await updateProfile(auth.currentUser, { displayName: nome.trim() })
      setVersaoPerfil((v) => v + 1)
      return null
    } catch (erro) {
      return mensagemErroAuth(erro.code)
    }
  }

  async function enviarRedefinicaoDeSenha() {
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email)
      return null
    } catch (erro) {
      return mensagemErroAuth(erro.code)
    }
  }

  // Apaga os dados da nuvem e a conta de login. Antes, pede a senha (ou o login
  // do Google de novo) para confirmar que é a própria pessoa.
  // Devolve { erro, nuvemApagada }: se a nuvem já foi apagada e o login não,
  // o app não pode voltar a sincronizar (senão recriaria os dados).
  async function excluirConta(senha) {
    const pessoa = auth.currentUser

    if (!pessoa) {
      return { erro: "Você não está conectado.", nuvemApagada: false }
    }

    try {
      if (usaSenha(pessoa.providerData)) {
        if (!senha) {
          return { erro: "Digite sua senha para confirmar.", nuvemApagada: false }
        }

        await reauthenticateWithCredential(pessoa, EmailAuthProvider.credential(pessoa.email, senha))
      } else {
        await reauthenticateWithPopup(pessoa, provider)
      }
    } catch (erro) {
      const cancelou = erro.code === "auth/popup-closed-by-user" || erro.code === "auth/cancelled-popup-request"

      return {
        erro: cancelou ? "Confirmação cancelada. Nada foi excluído." : mensagemErroAuth(erro.code),
        nuvemApagada: false
      }
    }

    try {
      await deleteDoc(doc(db, "usuarios", pessoa.uid))
    } catch {
      return { erro: "Não foi possível apagar seus dados da nuvem. Nada foi excluído, tente de novo.", nuvemApagada: false }
    }

    try {
      await deleteUser(pessoa)
    } catch {
      return {
        erro: "Seus dados foram apagados, mas não foi possível excluir o login. Recarregue a página, entre de novo e repita a exclusão.",
        nuvemApagada: true
      }
    }

    CHAVES_LOCAIS.forEach((chave) => localStorage.removeItem(chave))
    localStorage.removeItem("migrado_" + pessoa.uid)
    window.location.reload()

    return { erro: null, nuvemApagada: true }
  }

  return {
    usuario,
    verificandoLogin,
    erroLogin,
    entrarComGoogle,
    entrarComEmail,
    criarContaComEmail,
    recuperarSenha,
    sair,
    salvarNome,
    enviarRedefinicaoDeSenha,
    excluirConta
  }
}

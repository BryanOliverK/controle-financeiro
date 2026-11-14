import { useState } from "react"
import Icone from "./Icone"

const SENHA_MINIMA = 6

function Login({
  onEntrar,
  onEntrarEmail,
  onCriarConta,
  onRecuperarSenha,
  erro,
  modoEscuro
}) {

  const [criando, setCriando] = useState(false)
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [repetir, setRepetir] = useState("")
  const [verSenha, setVerSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  function trocarModo() {
    setCriando(!criando)
    setMensagem(null)
    setRepetir("")
  }

  async function enviar(evento) {
    evento.preventDefault()

    if (enviando) {
      return
    }

    if (!email.includes("@")) {
      setMensagem({ tipo: "erro", texto: "Digite um e-mail válido." })
      return
    }

    if (criando && senha.length < SENHA_MINIMA) {
      setMensagem({ tipo: "erro", texto: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` })
      return
    }

    if (criando && senha !== repetir) {
      setMensagem({ tipo: "erro", texto: "As senhas não são iguais." })
      return
    }

    if (senha === "") {
      setMensagem({ tipo: "erro", texto: "Digite sua senha." })
      return
    }

    setMensagem(null)
    setEnviando(true)

    const textoErro = criando
      ? await onCriarConta(email, senha)
      : await onEntrarEmail(email, senha)

    setEnviando(false)

    if (textoErro) {
      setMensagem({ tipo: "erro", texto: textoErro })
    }
  }

  async function esqueciSenha() {
    if (!email.includes("@")) {
      setMensagem({ tipo: "erro", texto: "Digite seu e-mail acima para receber o link." })
      return
    }

    setEnviando(true)
    const textoErro = await onRecuperarSenha(email)
    setEnviando(false)

    setMensagem(
      textoErro
        ? { tipo: "erro", texto: textoErro }
        : {
            tipo: "info",
            texto: "Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Confira também o spam."
          }
    )
  }

  return (
    <div className={modoEscuro ? "tela-login modo-escuro" : "tela-login"}>
      <div className="login-card">

        <span className="login-icone"><Icone nome="carteira" tamanho={32} /></span>

        <h1>Controle Financeiro</h1>

        <p>
          Entre para guardar seus dados na nuvem e continuar de onde parou,
          no celular ou no computador.
        </p>

        <button className="login-google" onClick={onEntrar} type="button">
          <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          Entrar com Google
        </button>

        {erro && <p className="login-erro" role="alert">{erro}</p>}

        <div className="login-divisor" role="separator"><span>ou com e-mail</span></div>

        <form className="login-form" onSubmit={enviar} noValidate>

          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="E-mail"
            aria-label="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="login-senha">
            <input
              type={verSenha ? "text" : "password"}
              autoComplete={criando ? "new-password" : "current-password"}
              placeholder={criando ? `Senha (mínimo ${SENHA_MINIMA} caracteres)` : "Senha"}
              aria-label="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            <button
              type="button"
              className="login-ver"
              onClick={() => setVerSenha(!verSenha)}
              aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={verSenha}
            >
              <Icone nome={verSenha ? "olhoOff" : "olho"} tamanho={18} />
            </button>
          </div>

          {criando && (
            <input
              type={verSenha ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repita a senha"
              aria-label="Repita a senha"
              value={repetir}
              onChange={(e) => setRepetir(e.target.value)}
            />
          )}

          {mensagem && (
            <p
              className={mensagem.tipo === "erro" ? "login-msg erro" : "login-msg"}
              role={mensagem.tipo === "erro" ? "alert" : "status"}
            >
              {mensagem.texto}
            </p>
          )}

          <button type="submit" className="login-enviar" disabled={enviando}>
            {enviando ? "Aguarde..." : criando ? "Criar conta" : "Entrar"}
          </button>

          <div className="login-links">
            <button type="button" onClick={trocarModo}>
              {criando ? "Já tenho conta" : "Criar conta"}
            </button>

            {!criando && (
              <button type="button" onClick={esqueciSenha} disabled={enviando}>
                Esqueci minha senha
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  )
}

export default Login

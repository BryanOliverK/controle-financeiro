import { useState } from "react"
import Icone from "./Icone"
import fundo from "../assets/login-fundo.svg"

const SENHA_MINIMA = 6

function Login({
  onEntrar,
  onEntrarEmail,
  onCriarConta,
  onRecuperarSenha,
  erro,
  modoEscuro,
  modoLeve
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

  const classes = ["tela-login", modoEscuro && "modo-escuro", modoLeve && "modo-leve"]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classes} style={{ backgroundImage: `url("${fundo}")` }}>
      <div className={criando ? "lg-vidro criando" : "lg-vidro"}>

        {/* Painel do formulário: desliza para o outro lado ao trocar de modo */}
        <section className="lg-form-painel" aria-labelledby="lg-titulo">

          <div className="lg-marca">
            <span className="lg-marca-icone"><Icone nome="carteira" tamanho={18} /></span>
            Controle Financeiro
          </div>

          <h1 id="lg-titulo" key={criando ? "criar" : "entrar"} className="lg-aparece">
            {criando ? "Criar conta" : "Entrar"}
          </h1>

          <button className="lg-google" onClick={onEntrar} type="button">
            <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continuar com Google
          </button>

          {erro && <p className="login-erro" role="alert">{erro}</p>}

          <div className="login-divisor" role="separator"><span>ou com e-mail</span></div>

          <form className="login-form" onSubmit={enviar} noValidate>

            <div className="lg-campo">
              <Icone nome="email" tamanho={18} />
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="E-mail"
                aria-label="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="lg-campo">
              <Icone nome="cadeado" tamanho={18} />
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
              <div className="lg-campo lg-aparece">
                <Icone nome="cadeado" tamanho={18} />
                <input
                  type={verSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  aria-label="Repita a senha"
                  value={repetir}
                  onChange={(e) => setRepetir(e.target.value)}
                />
              </div>
            )}

            {!criando && (
              <button type="button" className="lg-esqueci" onClick={esqueciSenha} disabled={enviando}>
                Esqueci minha senha
              </button>
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

            {/* Só aparece no celular, onde o painel lateral some */}
            <button type="button" className="lg-trocar-mobile" onClick={trocarModo}>
              {criando ? "Já tenho conta. Entrar" : "Não tenho conta. Criar agora"}
            </button>

          </form>

        </section>

        {/* Painel lateral: convida a trocar de modo e desliza para o lado oposto */}
        <div className="lg-boas-vindas">
          <h2 key={criando ? "volta" : "novo"} className="lg-aparece">
            {criando ? "Bem-vindo de volta!" : "Novo por aqui?"}
          </h2>

          <p key={criando ? "volta-p" : "novo-p"} className="lg-aparece">
            {criando
              ? "Já tem uma conta? Entre com seus dados e continue de onde parou."
              : "Crie sua conta e guarde seus dados na nuvem, no celular ou no computador."}
          </p>

          <button type="button" className="lg-trocar" onClick={trocarModo}>
            {criando ? "Entrar" : "Criar conta"}
            <span aria-hidden="true"> →</span>
          </button>
        </div>

      </div>
    </div>
  )
}

export default Login

import { useCallback, useEffect, useRef, useState } from "react"
import Icone from "./Icone"
import { PIN_MAX } from "../utils/pin"

const TECLAS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]

const textoEspera = (ms) => {
  const s = Math.ceil(ms / 1000)
  return s >= 60 ? `${Math.ceil(s / 60)} min` : `${s} s`
}

// Tela que cobre o app até digitar o PIN (ou usar a biometria).
function TelaBloqueio({ nome, foto, iniciais, tamanho = PIN_MAX, temBiometria, onPin, onBiometria, esperaAtualMs, onSair, modoEscuro, modoLeve }) {

  const [digitos, setDigitos] = useState("")
  const [erro, setErro] = useState("")
  const [espera, setEspera] = useState(() => esperaAtualMs())
  const [verificando, setVerificando] = useState(false)
  const [tremendo, setTremendo] = useState(false)
  const [esqueci, setEsqueci] = useState(false)
  const tentouBio = useRef(false)

  // Contagem regressiva da espera
  useEffect(() => {
    if (espera <= 0) {
      return undefined
    }

    const timer = setInterval(() => {
      const resta = esperaAtualMs()
      setEspera(resta)
      if (resta <= 0) setErro("")
    }, 500)

    return () => clearInterval(timer)
  }, [espera, esperaAtualMs])

  const enviar = useCallback(async (pin) => {
    setVerificando(true)
    const r = await onPin(pin)
    setVerificando(false)

    if (r.ok) {
      return
    }

    setDigitos("")
    setTremendo(true)
    setTimeout(() => setTremendo(false), 450)

    if (r.esperaMs > 0) {
      setEspera(r.esperaMs)
      setErro("Muitas tentativas erradas.")
    } else {
      setErro(`PIN incorreto. ${r.restantes === 1 ? "Resta 1 tentativa" : `Restam ${r.restantes} tentativas`} antes de esperar.`)
    }
  }, [onPin])

  const digitar = useCallback((n) => {
    if (verificando || espera > 0) return

    setErro("")
    setDigitos((atual) => {
      if (atual.length >= tamanho) return atual
      const novo = atual + n
      if (novo.length === tamanho) setTimeout(() => enviar(novo), 0)
      return novo
    })
  }, [verificando, espera, tamanho, enviar])

  const apagar = useCallback(() => setDigitos((a) => a.slice(0, -1)), [])

  const usarBiometria = useCallback(async () => {
    setErro("")
    const ok = await onBiometria()
    if (!ok) setErro("Não deu para usar a biometria. Digite o PIN.")
  }, [onBiometria])

  // Teclado do computador
  useEffect(() => {
    function aoTeclar(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^\d$/.test(e.key)) digitar(e.key)
      else if (e.key === "Backspace") apagar()
    }

    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [digitar, apagar])

  // Se tem biometria, já pergunta uma vez ao abrir
  useEffect(() => {
    if (temBiometria && !tentouBio.current && esperaAtualMs() <= 0) {
      tentouBio.current = true
      const timer = setTimeout(() => { onBiometria() }, 350)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [temBiometria, onBiometria, esperaAtualMs])

  const primeiroNome = (nome || "").split(" ")[0]

  const classes = ["tela-bloqueio", modoEscuro && "modo-escuro", modoLeve && "modo-leve"].filter(Boolean).join(" ")

  return (
    <main className={classes} aria-labelledby="bloq-titulo">
      <div className="bloq-card">

        <span className="bloq-avatar" aria-hidden="true">
          {foto ? <img src={foto} alt="" referrerPolicy="no-referrer" /> : iniciais}
        </span>

        <h1 id="bloq-titulo">{primeiroNome ? `Olá, ${primeiroNome}` : "App bloqueado"}</h1>
        <p className="bloq-sub">Digite seu PIN para continuar</p>

        <div
          className={tremendo ? "bloq-bolinhas tremer" : "bloq-bolinhas"}
          role="img"
          aria-label={`${digitos.length} de ${tamanho} números digitados`}
        >
          {Array.from({ length: tamanho }, (_, i) => (
            <span key={i} className={i < digitos.length ? "cheia" : ""} />
          ))}
        </div>

        <p className="bloq-msg" role="alert" aria-live="assertive">
          {espera > 0 ? `${erro ? erro + " " : ""}Tente de novo em ${textoEspera(espera)}.` : erro}
        </p>

        {!esqueci ? (
          <>
            <div className="bloq-teclado" role="group" aria-label="Teclado numérico">
              {TECLAS.map((t) => (
                <button key={t} type="button" onClick={() => digitar(t)} disabled={espera > 0}>{t}</button>
              ))}

              {temBiometria ? (
                <button type="button" className="bloq-aux" onClick={usarBiometria} aria-label="Usar biometria" disabled={espera > 0}>
                  <Icone nome="escudo" tamanho={22} />
                </button>
              ) : <span />}

              <button type="button" onClick={() => digitar("0")} disabled={espera > 0}>0</button>

              <button type="button" className="bloq-aux" onClick={apagar} aria-label="Apagar">
                <Icone nome="voltar" tamanho={22} />
              </button>
            </div>

            <button type="button" className="bloq-link" onClick={() => setEsqueci(true)}>Esqueci o PIN</button>
          </>
        ) : (
          <div className="bloq-esqueci">
            <p>
              Para redefinir o PIN, saia da conta e entre de novo. Seus dados continuam salvos na nuvem.
            </p>

            <button type="button" className="bloq-sair" onClick={onSair}>Sair da conta</button>
            <button type="button" className="bloq-link" onClick={() => setEsqueci(false)}>Voltar</button>
          </div>
        )}

      </div>
    </main>
  )
}

export default TelaBloqueio

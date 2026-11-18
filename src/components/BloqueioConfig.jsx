import { useEffect, useState } from "react"
import { OPCOES_BLOQUEIO, OPCOES_SAIR, PIN_MAX, PIN_MIN, pinDisponivel } from "../utils/pin"
import { biometriaDisponivel } from "../utils/biometria"

const rotuloBloqueio = (m) => (m === 0 ? "Nunca" : m === 1 ? "1 minuto" : `${m} minutos`)
const rotuloSair = (m) => (m === 0 ? "Nunca" : m < 60 ? `${m} minutos` : m === 60 ? "1 hora" : `${m / 60} horas`)

const soNumeros = (t) => t.replace(/\D/g, "").slice(0, PIN_MAX)

// Perfil > Privacidade: PIN, biometria, bloqueio e saída por inatividade.
// "b" é o que vem do hook useBloqueio.
function BloqueioConfig({ b, onAviso }) {

  const [modo, setModo] = useState("") // "", "criar", "trocar", "remover"
  const [atual, setAtual] = useState("")
  const [novo, setNovo] = useState("")
  const [repetir, setRepetir] = useState("")
  const [erro, setErro] = useState("")
  const [ocupado, setOcupado] = useState(false)
  const [bioOk, setBioOk] = useState(false)

  const temPin = Boolean(b.config.pin)

  useEffect(() => {
    let vivo = true
    biometriaDisponivel().then((ok) => { if (vivo) setBioOk(ok) })
    return () => { vivo = false }
  }, [])

  function abrir(m) {
    setModo(m)
    setAtual("")
    setNovo("")
    setRepetir("")
    setErro("")
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro("")

    if ((modo === "criar" || modo === "trocar") && novo !== repetir) {
      setErro("Os dois PINs não são iguais.")
      return
    }

    setOcupado(true)

    let msg = ""

    if (modo === "criar") msg = await b.definirPin(novo)
    else if (modo === "trocar") msg = await b.trocarPin(atual, novo)
    else if (modo === "remover") msg = await b.removerPin(atual)

    setOcupado(false)

    if (msg) {
      setErro(msg)
      return
    }

    onAviso(modo === "criar" ? "PIN ativado" : modo === "trocar" ? "PIN alterado" : "PIN desativado")
    abrir("")
  }

  async function alternarBiometria() {
    if (b.config.bio) {
      b.desativarBiometria()
      onAviso("Biometria desativada")
      return
    }

    const msg = await b.ativarBiometria()
    onAviso(msg || "Biometria ativada", msg ? "erro" : "info")
  }

  const campoPin = (valor, mudar, rotulo, auto) => (
    <label className="bloqueio-campo">
      {rotulo}
      <input
        type="password"
        inputMode="numeric"
        autoComplete={auto}
        maxLength={PIN_MAX}
        placeholder={`${PIN_MIN} a ${PIN_MAX} números`}
        value={valor}
        onChange={(e) => { mudar(soNumeros(e.target.value)); setErro("") }}
      />
    </label>
  )

  return (
    <div className="perfil-bloco">
      <h3>Privacidade e bloqueio</h3>

      <p className="perfil-nota">
        O PIN impede que outra pessoa abra o app neste aparelho. Vale só aqui (não vai para a nuvem).
        Se esquecer, é só sair da conta e entrar de novo.
      </p>

      {!pinDisponivel() && (
        <p className="gc-erro" role="alert">Este navegador não permite criar um PIN (precisa de endereço seguro, https).</p>
      )}

      {!temPin && modo === "" && pinDisponivel() && (
        <button type="button" className="btn-exportar" onClick={() => abrir("criar")}>Ativar bloqueio por PIN</button>
      )}

      {temPin && modo === "" && (
        <>
          <div className="perfil-acoes">
            <button type="button" className="btn-exportar" onClick={b.bloquearAgora}>Bloquear agora</button>
            <button type="button" className="btn-exportar" onClick={() => abrir("trocar")}>Trocar PIN</button>
            <button type="button" className="btn-exportar" onClick={() => abrir("remover")}>Desativar PIN</button>
          </div>

          <label className="bloqueio-linha">
            <span><strong>Bloquear sozinho após</strong><small>Sem mexer no app</small></span>
            <select value={b.config.bloquearApos} onChange={(e) => b.alterar({ bloquearApos: Number(e.target.value) })} aria-label="Bloquear sozinho após">
              {OPCOES_BLOQUEIO.map((m) => <option key={m} value={m}>{rotuloBloqueio(m)}</option>)}
            </select>
          </label>

          {bioOk && (
            <label className="perfil-pref">
              <span>
                <strong>Biometria deste aparelho</strong>
                <small>Destrava com digital, rosto ou o bloqueio do aparelho. O PIN continua valendo.</small>
              </span>
              <input type="checkbox" role="switch" className="perfil-switch" checked={Boolean(b.config.bio)} onChange={alternarBiometria} />
            </label>
          )}
        </>
      )}

      {modo !== "" && (
        <form className="bloqueio-form" onSubmit={enviar} noValidate>
          {(modo === "trocar" || modo === "remover") && campoPin(atual, setAtual, modo === "remover" ? "Digite o PIN para desativar" : "PIN atual", "current-password")}
          {(modo === "criar" || modo === "trocar") && campoPin(novo, setNovo, modo === "trocar" ? "Novo PIN" : "Escolha um PIN", "new-password")}
          {(modo === "criar" || modo === "trocar") && campoPin(repetir, setRepetir, "Repita o PIN", "new-password")}

          {erro && <p className="gc-erro" role="alert">{erro}</p>}

          <div className="form-acoes">
            <button type="submit" className="btn-salvar" disabled={ocupado}>{ocupado ? "Aguarde…" : "Confirmar"}</button>
            <button type="button" className="btn-cancelar" onClick={() => abrir("")}>Cancelar</button>
          </div>
        </form>
      )}

      <label className="bloqueio-linha">
        <span><strong>Sair da conta sozinho após</strong><small>Sem mexer no app. Precisa entrar de novo depois.</small></span>
        <select value={b.config.sairApos} onChange={(e) => b.alterar({ sairApos: Number(e.target.value) })} aria-label="Sair da conta sozinho após">
          {OPCOES_SAIR.map((m) => <option key={m} value={m}>{rotuloSair(m)}</option>)}
        </select>
      </label>
    </div>
  )
}

export default BloqueioConfig

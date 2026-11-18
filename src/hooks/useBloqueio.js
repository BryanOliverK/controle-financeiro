import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocalStorage } from "./useLocalStorage"
import { conferirBiometria, registrarBiometria } from "../utils/biometria"
import {
  CONFIG_PADRAO, conferirPin, criarPin, esperaAposErros, limparBloqueio,
  pinFraco, pinValido, tentativasAntesDaEspera
} from "../utils/pin"

const CHAVE_TENTATIVAS = "bloqueioTentativas"

function lerTentativas() {
  try {
    const t = JSON.parse(localStorage.getItem(CHAVE_TENTATIVAS) || "{}")
    return { n: Number.isInteger(t.n) && t.n > 0 ? t.n : 0, ate: Number.isFinite(t.ate) ? t.ate : 0 }
  } catch {
    return { n: 0, ate: 0 }
  }
}

function gravarTentativas(valor) {
  try {
    localStorage.setItem(CHAVE_TENTATIVAS, JSON.stringify(valor))
  } catch {
    // sem armazenamento: o limite vale só até recarregar
  }
}

// Bloqueio do app (PIN/biometria) e saída automática por inatividade.
export function useBloqueio({ usuario, onSair }) {

  const [bruto, setBruto] = useLocalStorage("bloqueio", CONFIG_PADRAO)
  const config = useMemo(() => limparBloqueio(bruto), [bruto])

  // Com PIN ativo, o app já abre bloqueado
  const [bloqueado, setBloqueado] = useState(() => Boolean(limparBloqueio(bruto).pin))

  const ultimaAtividade = useRef(Date.now())
  const sairRef = useRef(onSair)
  const saindo = useRef(false)

  useEffect(() => {
    sairRef.current = onSair
  })

  // Sem PIN não existe tela de bloqueio
  const estaBloqueado = bloqueado && Boolean(config.pin)

  // ----- Inatividade -----

  useEffect(() => {
    if (!usuario) {
      return undefined
    }

    const marcar = () => { ultimaAtividade.current = Date.now() }
    const eventos = ["pointerdown", "keydown", "wheel", "touchstart"]

    eventos.forEach((e) => window.addEventListener(e, marcar, { passive: true }))

    function checar() {
      const parado = Date.now() - ultimaAtividade.current

      if (config.pin && config.bloquearApos > 0 && parado >= config.bloquearApos * 60000) {
        setBloqueado(true)
      }

      if (config.sairApos > 0 && parado >= config.sairApos * 60000 && !saindo.current) {
        saindo.current = true
        sairRef.current?.()
      }
    }

    const intervalo = setInterval(checar, 10000)
    const aoVoltar = () => { if (document.visibilityState === "visible") checar() }

    document.addEventListener("visibilitychange", aoVoltar)

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, marcar))
      clearInterval(intervalo)
      document.removeEventListener("visibilitychange", aoVoltar)
    }
  }, [usuario, config.pin, config.bloquearApos, config.sairApos])

  // ----- Destravar -----

  const esperaAtualMs = useCallback(() => Math.max(0, lerTentativas().ate - Date.now()), [])

  function liberar() {
    gravarTentativas({ n: 0, ate: 0 })
    ultimaAtividade.current = Date.now()
    setBloqueado(false)
  }

  // { ok, esperaMs, restantes }
  async function destravarComPin(pin) {
    const { n } = lerTentativas()
    const espera = esperaAtualMs()

    if (espera > 0) {
      return { ok: false, esperaMs: espera, restantes: 0 }
    }

    if (await conferirPin(pin, config.pin)) {
      liberar()
      return { ok: true, esperaMs: 0, restantes: 5 }
    }

    const erros = n + 1
    const esperaMs = esperaAposErros(erros)

    gravarTentativas({ n: erros, ate: esperaMs ? Date.now() + esperaMs : 0 })

    return { ok: false, esperaMs, restantes: tentativasAntesDaEspera(erros) }
  }

  async function destravarComBiometria() {
    if (!config.bio || esperaAtualMs() > 0) {
      return false
    }

    const ok = await conferirBiometria(config.bio)

    if (ok) {
      liberar()
    }

    return ok
  }

  // ----- Configuração -----

  // Devolve "" se deu certo, ou a mensagem de erro
  async function definirPin(pin) {
    if (!pinValido(pin)) {
      return "Use de 4 a 6 números."
    }

    if (pinFraco(pin)) {
      return "Esse PIN é fácil demais de adivinhar. Evite sequências (1234) e números repetidos (0000)."
    }

    try {
      const registro = await criarPin(pin)
      setBruto({ ...config, pin: registro })
      return ""
    } catch {
      return "Este navegador não permite criar o PIN. Use o app por um endereço seguro (https)."
    }
  }

  async function removerPin(pinAtual) {
    if (!(await conferirPin(pinAtual, config.pin))) {
      return "PIN incorreto."
    }

    setBruto({ ...config, pin: null, bio: "" })
    setBloqueado(false)
    return ""
  }

  async function trocarPin(pinAtual, novo) {
    if (!(await conferirPin(pinAtual, config.pin))) {
      return "O PIN atual está incorreto."
    }

    return definirPin(novo)
  }

  function alterar(parcial) {
    setBruto({ ...config, ...parcial })
  }

  async function ativarBiometria() {
    const id = await registrarBiometria(usuario?.uid, usuario?.displayName || usuario?.email)

    if (!id) {
      return "Não foi possível ativar a biometria neste aparelho."
    }

    setBruto({ ...config, bio: id })
    return ""
  }

  function desativarBiometria() {
    setBruto({ ...config, bio: "" })
  }

  function bloquearAgora() {
    if (config.pin) {
      setBloqueado(true)
    }
  }

  return {
    config, bloqueado: estaBloqueado, bloquearAgora,
    destravarComPin, destravarComBiometria, esperaAtualMs,
    definirPin, removerPin, trocarPin, alterar, ativarBiometria, desativarBiometria
  }
}

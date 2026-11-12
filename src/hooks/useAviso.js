import { useCallback, useEffect, useRef, useState } from "react"
import { novoId } from "../utils/formatar"

// Aviso (toast) no topo da tela. Com "acao" aparece o botão Desfazer.
export function useAviso() {

  const [aviso, setAviso] = useState(null)
  const timer = useRef(null)

  const fecharAviso = useCallback(() => {
    clearTimeout(timer.current)
    setAviso(null)
  }, [])

  const mostrarAviso = useCallback((texto, tipo = "info", acao = null) => {
    clearTimeout(timer.current)
    setAviso({ id: novoId(), texto, tipo, acao })
    timer.current = setTimeout(() => setAviso(null), acao ? 5000 : 3000)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return { aviso, mostrarAviso, fecharAviso }
}

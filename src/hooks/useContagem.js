import { useEffect, useRef, useState } from "react"
import { interpolar } from "../utils/animacao"

// Faz um número "contar" até o valor novo (do que estava para o que chegou).
// ativo = false mostra o valor direto, sem animar (modo leve).
export function useContagem(alvo, ativo = true, duracao = 700) {

  const [valor, setValor] = useState(ativo ? 0 : alvo)
  const atual = useRef(valor)

  useEffect(() => {
    if (!ativo) {
      atual.current = alvo
      setValor(alvo)
      return undefined
    }

    const de = atual.current
    const inicio = performance.now()
    let quadro = 0

    function passo(agora) {
      const t = (agora - inicio) / duracao
      const novo = interpolar(de, alvo, t)

      atual.current = novo
      setValor(novo)

      if (t < 1) {
        quadro = requestAnimationFrame(passo)
      }
    }

    quadro = requestAnimationFrame(passo)

    return () => cancelAnimationFrame(quadro)
  }, [alvo, ativo, duracao])

  return valor
}

import { useEffect, useRef } from "react"

// Atalhos de teclado de uma tecla só. mapa = { n: () => ..., "/": () => ... }
// Não dispara enquanto a pessoa digita em um campo, nem com Ctrl/Alt/Cmd
// (para não atrapalhar os atalhos do navegador).
export function useAtalhos(mapa, ativo = true) {

  const atual = useRef(mapa)

  useEffect(() => {
    atual.current = mapa
  })

  useEffect(() => {
    if (!ativo) {
      return
    }

    function aoTeclar(evento) {
      if (evento.ctrlKey || evento.metaKey || evento.altKey) {
        return
      }

      const alvo = evento.target
      const tag = alvo?.tagName

      if (
        alvo?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT"
      ) {
        return
      }

      const acao = atual.current[evento.key.toLowerCase()]

      if (acao) {
        evento.preventDefault()
        acao()
      }
    }

    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [ativo])
}

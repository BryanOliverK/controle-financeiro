import { useEffect, useState } from "react"

const INTERVALO = 30 * 60 * 1000 // confere a cada 30 minutos
const PADRAO = /\/assets\/index-[^"'\s>]+\.js/

// Descobre quando existe uma versão nova do app publicada.
//
// O Vite dá ao arquivo principal um nome com código (index-AbC123.js) que muda
// a cada versão. Comparamos o que está rodando agora com o que o site está
// servindo: se for diferente, há atualização. Só funciona no site publicado.
export function useAtualizacao() {

  const [disponivel, setDisponivel] = useState(false)

  useEffect(() => {
    if (!import.meta.env.PROD) {
      return
    }

    const emUso = [...document.querySelectorAll("script[src]")]
      .map((s) => s.getAttribute("src") || "")
      .find((src) => PADRAO.test(src))
      ?.match(PADRAO)?.[0]

    if (!emUso) {
      return
    }

    let parado = false

    async function conferir() {
      try {
        const resposta = await fetch(import.meta.env.BASE_URL, { cache: "no-store" })
        const publicado = (await resposta.text()).match(PADRAO)?.[0]

        if (!parado && publicado && publicado !== emUso) {
          setDisponivel(true)
        }
      } catch {
        // sem internet: tenta de novo mais tarde
      }
    }

    function aoVoltar() {
      if (document.visibilityState === "visible") {
        conferir()
      }
    }

    const primeira = setTimeout(conferir, 5000)
    const relogio = setInterval(conferir, INTERVALO)
    document.addEventListener("visibilitychange", aoVoltar)

    return () => {
      parado = true
      clearTimeout(primeira)
      clearInterval(relogio)
      document.removeEventListener("visibilitychange", aoVoltar)
    }
  }, [])

  function atualizar() {
    window.location.reload()
  }

  return { atualizacaoDisponivel: disponivel, atualizar }
}

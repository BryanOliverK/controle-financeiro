import { useEffect, useState } from "react"

// Guarda o convite de instalação do navegador (PWA) para oferecer um botão
// "Instalar app" só quando a instalação é possível.
export function useInstalar() {

  const [convite, setConvite] = useState(null)

  useEffect(() => {
    function antes(evento) {
      evento.preventDefault()
      setConvite(evento)
    }

    function depois() {
      setConvite(null)
    }

    window.addEventListener("beforeinstallprompt", antes)
    window.addEventListener("appinstalled", depois)

    return () => {
      window.removeEventListener("beforeinstallprompt", antes)
      window.removeEventListener("appinstalled", depois)
    }
  }, [])

  async function instalar() {
    if (!convite) {
      return
    }

    convite.prompt()
    await convite.userChoice
    setConvite(null)
  }

  return { podeInstalar: convite !== null, instalar }
}

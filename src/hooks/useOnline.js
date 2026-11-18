import { useEffect, useState } from "react"

// true quando o aparelho está com internet (segundo o navegador)
export function useOnline() {

  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine !== false))

  useEffect(() => {
    const ligou = () => setOnline(true)
    const caiu = () => setOnline(false)

    window.addEventListener("online", ligou)
    window.addEventListener("offline", caiu)

    return () => {
      window.removeEventListener("online", ligou)
      window.removeEventListener("offline", caiu)
    }
  }, [])

  return online
}

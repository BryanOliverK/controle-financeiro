import { useEffect, useState } from "react"

// Estado que se guarda sozinho no localStorage.
// texto: true guarda o valor cru (como o app já fazia com cdi e pctCdi);
// sem isso, guarda como JSON.
export function useLocalStorage(chave, inicial, { texto = false } = {}) {

  const [valor, setValor] = useState(() => {
    try {
      const salvo = localStorage.getItem(chave)

      if (salvo === null) {
        return inicial
      }

      if (texto) {
        return salvo === "" ? inicial : salvo
      }

      return JSON.parse(salvo)
    } catch {
      return inicial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(chave, texto ? String(valor) : JSON.stringify(valor))
    } catch {
      // modo privado ou armazenamento cheio: o app continua funcionando
    }
  }, [chave, valor, texto])

  return [valor, setValor]
}

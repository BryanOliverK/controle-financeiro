import { useEffect, useState } from "react"
import Icone from "./Icone"

const ICONE = { ok: "nuvem", enviando: "repetir", offline: "nuvemOff", erro: "alerta" }

// Indicador de sincronização no topo: Sincronizado / Salvando / Sem conexão / Não salvou.
// "Salvando…" só aparece se demorar um pouco (senão pisca a cada alteração).
function StatusNuvem({ estado, texto, detalhe, podeTentar, onTentar }) {

  const [demorou, setDemorou] = useState(false)

  useEffect(() => {
    if (estado !== "enviando") {
      setDemorou(false)
      return undefined
    }

    const timer = setTimeout(() => setDemorou(true), 600)
    return () => clearTimeout(timer)
  }, [estado])

  const mostrado = estado === "enviando" && !demorou ? "ok" : estado
  const nome = mostrado === "ok" && estado === "enviando" ? "Sincronizado" : texto

  return (
    <span
      className={`status-nuvem ${mostrado}`}
      role="status"
      aria-live="polite"
      title={detalhe}
    >
      <Icone nome={ICONE[mostrado]} tamanho={16} />
      <span className="status-nuvem-texto">{nome}</span>

      {podeTentar && (
        <button type="button" className="status-nuvem-tentar" onClick={onTentar}>
          Tentar de novo
        </button>
      )}
    </span>
  )
}

export default StatusNuvem

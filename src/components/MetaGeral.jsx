import { useState } from "react"
import { brl, nomeMes } from "../utils/formatar"
import { META_MAXIMA, gastoDoMes, limparMeta, statusMeta, sugerirMeta } from "../utils/metaGeral"

// Define a meta geral de gastos do mês (um limite só, somando todas as categorias).
function MetaGeral({ transacoes, meta, mes, onDefinir }) {

  const [texto, setTexto] = useState(meta ? String(meta) : "")

  const gasto = gastoDoMes(transacoes, mes)
  const status = statusMeta(gasto, meta)
  const sugestao = sugerirMeta(transacoes)

  function confirmar() {
    const numero = limparMeta(texto)

    if (texto.trim() !== "" && numero === 0) {
      // Valor inválido: volta ao que estava
      setTexto(meta ? String(meta) : "")
      return
    }

    if (numero !== meta) {
      onDefinir(numero)
    }
  }

  function usarSugestao() {
    setTexto(String(sugestao))
    onDefinir(sugestao)
  }

  return (
    <div className={status ? `orc-card meta-geral ${status.nivel}` : "orc-card meta-geral"}>

      <div className="orc-topo">
        <h3>Meta geral de {nomeMes(mes)}</h3>
        <p>Um limite só para tudo que você gastar no mês. O app avisa ao chegar em 80% e ao passar da meta.</p>
      </div>

      <div className="meta-edicao">
        <label>
          <span>Meta mensal (R$)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max={META_MAXIMA}
            step="1"
            placeholder="Sem meta"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={confirmar}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
        </label>

        {!meta && sugestao && (
          <button type="button" className="btn-exportar" onClick={usarSugestao}>
            Usar {brl(sugestao)} (média dos últimos meses)
          </button>
        )}
      </div>

      {status ? (
        <>
          <div
            className="orc-barra"
            role="progressbar"
            aria-label="Meta geral de gastos"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, Math.round(status.porcentagem))}
          >
            <div className="orc-progresso" style={{ width: `${Math.min(100, status.porcentagem)}%` }} />
          </div>

          <span className="orc-situacao">
            {brl(gasto)} de {brl(meta)} ·{" "}
            {status.nivel === "estourado"
              ? <>passou <b className="cmp-valor">{brl(-status.restante)}</b></>
              : <>restam <b className="cmp-valor">{brl(status.restante)}</b></>}
          </span>
        </>
      ) : (
        <span className="orc-situacao">Gasto até agora neste mês: {brl(gasto)}</span>
      )}

    </div>
  )
}

export default MetaGeral

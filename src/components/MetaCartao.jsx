import Icone from "./Icone"
import { brl } from "../utils/formatar"
import { statusMeta } from "../utils/metaGeral"

// Resumo da meta geral do mês no Início (só aparece se houver meta).
function MetaCartao({ gasto, meta, onAjustar }) {

  const status = statusMeta(gasto, meta)

  if (!status) {
    return null
  }

  return (
    <div className={`meta-cartao ${status.nivel}`}>

      <div className="meta-topo">
        <span className="meta-titulo"><Icone nome="alvo" tamanho={18} /> Meta de gastos do mês</span>

        <button type="button" className="link-ver-todas" onClick={onAjustar}>
          Ajustar
          <Icone nome="chevronDireita" tamanho={16} />
        </button>
      </div>

      <div className="meta-valores">
        <strong className="valor-privado">{brl(gasto)}</strong>
        <span className="valor-privado">de {brl(meta)}</span>
      </div>

      <div
        className="orc-barra"
        role="progressbar"
        aria-label="Meta de gastos do mês"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(status.porcentagem))}
      >
        <div className="orc-progresso" style={{ width: `${Math.min(100, status.porcentagem)}%` }} />
      </div>

      <small className="meta-situacao">
        {status.nivel === "estourado"
          ? <>Passou <b className="valor-privado">{brl(-status.restante)}</b> da meta</>
          : <>Restam <b className="valor-privado">{brl(status.restante)}</b> ({Math.floor(status.porcentagem)}% usado)</>}
      </small>

    </div>
  )
}

export default MetaCartao

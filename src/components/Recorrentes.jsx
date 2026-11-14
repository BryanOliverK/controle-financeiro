import Icone from "./Icone"
import { infoCategoria, SEM_CATEGORIA } from "../utils/categorias"
import { brl, nomeMes } from "../utils/formatar"

// Lista das transações que se repetem todo mês, com opção de parar.
function Recorrentes({ recorrentes, onExcluir }) {

  if (recorrentes.length === 0) {
    return null
  }

  return (
    <section className="rec-card">

      <h3 className="titulo-secao">
        <Icone nome="repetir" tamanho={18} /> Lançamentos mensais
      </h3>

      {recorrentes.map((r) => {
        const info = infoCategoria(r.categoria) || SEM_CATEGORIA

        return (
          <div className="rec-linha" key={r.id}>

            <span className="orc-icone" style={{ "--cor": info.cor }}>
              <Icone nome={info.icone} tamanho={20} />
            </span>

            <div className="rec-info">
              <strong>{r.descricao}</strong>
              <span>
                <b className={r.tipo === "entrada" ? "entrada-texto cmp-valor" : "saida-texto cmp-valor"}>
                  {r.tipo === "entrada" ? "+" : "-"}{brl(r.valor)}
                </b>
                {" · "}todo dia {r.dia} · próximo em {nomeMes(r.proximoMes)}
              </span>
            </div>

            <button
              className="btn-excluir"
              onClick={() => onExcluir(r.id)}
              aria-label={`Parar de repetir ${r.descricao}`}
              title="Parar de repetir"
            >
              <Icone nome="lixeira" tamanho={16} />
            </button>

          </div>
        )
      })}

    </section>
  )
}

export default Recorrentes

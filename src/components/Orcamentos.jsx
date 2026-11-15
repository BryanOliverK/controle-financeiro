import { useState } from "react"
import Icone from "./Icone"
import { todasCategorias } from "../utils/categorias"
import { brl, nomeMes } from "../utils/formatar"
import { gastoDaCategoria, statusOrcamento } from "../utils/orcamentos"

// Uma categoria: mostra quanto já foi gasto e deixa definir o limite.
function LinhaOrcamento({ chave, info, gasto, limite, onDefinir }) {

  const [texto, setTexto] = useState(limite ? String(limite) : "")

  const status = statusOrcamento(gasto, limite)

  function confirmar() {
    const numero = Number(texto)

    if (texto.trim() === "" || numero <= 0) {
      // Vazio ou inválido: remove o limite
      setTexto("")
      if (limite) onDefinir(chave, null)
      return
    }

    if (numero !== limite) {
      onDefinir(chave, numero)
    }
  }

  return (
    <div className={status ? `orc-linha ${status.nivel}` : "orc-linha"}>

      <span className="orc-icone" style={{ "--cor": info.cor }}>
        <Icone nome={info.icone} tamanho={20} />
      </span>

      <div className="orc-meio">
        <div className="orc-titulo">
          <strong>{info.nome}</strong>
          <span className="orc-valores cmp-valor">
            {status ? `${brl(gasto)} de ${brl(limite)}` : brl(gasto)}
          </span>
        </div>

        {status ? (
          <>
            <div
              className="orc-barra"
              role="progressbar"
              aria-label={`Orçamento de ${info.nome}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, Math.round(status.porcentagem))}
            >
              <div
                className="orc-progresso"
                style={{ width: `${Math.min(100, status.porcentagem)}%` }}
              />
            </div>

            <span className="orc-situacao">
              {status.nivel === "estourado"
                ? <>Passou <b className="cmp-valor">{brl(-status.restante)}</b> do limite</>
                : <>Restam <b className="cmp-valor">{brl(status.restante)}</b></>}
            </span>
          </>
        ) : (
          <span className="orc-situacao">Sem limite definido</span>
        )}
      </div>

      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="1"
        placeholder="Limite"
        aria-label={`Limite mensal de ${info.nome}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      />

    </div>
  )
}

// Limites mensais por categoria, comparados com o gasto do mês.
function Orcamentos({ transacoes, orcamentos, mes, onDefinir }) {

  // Salário só entra dinheiro: não faz sentido ter limite de gasto
  const categorias = todasCategorias().filter(([, info]) => info.tipo === "ambos")

  return (
    <div className="orc-card">

      <div className="orc-topo">
        <h3>Orçamento de {nomeMes(mes)}</h3>
        <p>Defina quanto quer gastar por mês em cada categoria. O app avisa quando chegar em 80% e quando passar do limite.</p>
      </div>

      {categorias.map(([chave, info]) => (
        <LinhaOrcamento
          key={`${chave}-${orcamentos[chave] ?? ""}`}
          chave={chave}
          info={info}
          gasto={gastoDaCategoria(transacoes, chave, mes)}
          limite={orcamentos[chave] ?? 0}
          onDefinir={onDefinir}
        />
      ))}

    </div>
  )
}

export default Orcamentos

import Icone from "./Icone"
import Vazio from "./Vazio"
import { brl, nomeMes } from "../utils/formatar"
import { agruparCompromissosPorMes } from "../utils/compromissos"

const ICONES = {
  fatura: "transacoes",
  parcela: "transacoes",
  recorrente: "repetir",
  lancamento: "calendario"
}

function dataCurta(data) {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

// Tudo que vai ser cobrado (ou recebido) nos próximos meses, mês a mês.
function Compromissos({ itens }) {

  const grupos = agruparCompromissosPorMes(itens)

  return (
    <section className="compromissos">

      <h2 className="titulo-secao">Compromissos futuros</h2>

      {grupos.length === 0 && (
        <Vazio icone="calendario">
          Nada a pagar pela frente. Faturas, parcelas e lançamentos mensais aparecem aqui.
        </Vazio>
      )}

      {grupos.map((g) => (
        <div key={g.mes} className="comp-mes">

          <div className="comp-mes-topo">
            <h3>{nomeMes(g.mes)}</h3>
            <span className="valor-privado">
              {g.saidas > 0 && <>A pagar: <strong>{brl(g.saidas)}</strong></>}
            </span>
          </div>

          <ul className="comp-lista">
            {g.itens.map((item) => (
              <li key={item.id} className={item.atrasada ? "comp-item atrasada" : "comp-item"}>

                <span className="comp-icone"><Icone nome={ICONES[item.origem]} tamanho={18} /></span>

                <span className="comp-texto">
                  <strong>{item.titulo}</strong>
                  <small>
                    {dataCurta(item.data)}
                    {item.detalhe && ` · ${item.detalhe}`}
                    {item.atrasada && " · Atrasada"}
                  </small>
                </span>

                <span className={item.tipo === "entrada" ? "comp-valor entrada-texto valor-privado" : "comp-valor saida-texto valor-privado"}>
                  {item.tipo === "entrada" ? "+" : "-"}{brl(item.valor)}
                </span>

              </li>
            ))}
          </ul>

        </div>
      ))}

    </section>
  )
}

export default Compromissos

import Icone from "./Icone"
import { brl } from "../utils/formatar"
import { useContagem } from "../hooks/useContagem"

// Os valores contam até o número final (animar = false mostra direto)
function Resumo({ saldo, entradas, saidas, animar = true }) {

    const saldoVisto = useContagem(saldo, animar)
    const entradasVistas = useContagem(entradas, animar)
    const saidasVistas = useContagem(saidas, animar)

    return (
        <div className="resumo">

            <div className="card saldo">
                <h3>
                    <span className="card-icone"><Icone nome="carteira" tamanho={18} /></span>
                    Saldo
                </h3>
                <p>{brl(saldoVisto)}</p>
            </div>

            <div className="card entrada">
                <h3>
                    <span className="card-icone"><Icone nome="setaEntrada" tamanho={18} /></span>
                    Entradas
                </h3>
                <p>{brl(entradasVistas)}</p>
            </div>

            <div className="card saida">
                <h3>
                    <span className="card-icone"><Icone nome="setaSaida" tamanho={18} /></span>
                    Saídas
                </h3>
                <p>{brl(saidasVistas)}</p>
            </div>

        </div>
    )
}

export default Resumo

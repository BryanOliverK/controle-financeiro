import Icone from "./Icone"
import { brl } from "../utils/formatar"

function Resumo({ saldo, entradas, saidas }) {

    return (
        <div className="resumo">

            <div className="card saldo">
                <h3>
                    <span className="card-icone"><Icone nome="carteira" tamanho={18} /></span>
                    Saldo
                </h3>
                <p>{brl(saldo)}</p>
            </div>

            <div className="card entrada">
                <h3>
                    <span className="card-icone"><Icone nome="setaEntrada" tamanho={18} /></span>
                    Entradas
                </h3>
                <p>{brl(entradas)}</p>
            </div>

            <div className="card saida">
                <h3>
                    <span className="card-icone"><Icone nome="setaSaida" tamanho={18} /></span>
                    Saídas
                </h3>
                <p>{brl(saidas)}</p>
            </div>

        </div>
    )
}

export default Resumo

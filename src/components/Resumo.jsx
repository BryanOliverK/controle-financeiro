import { brl } from "../utils/formatar"

function Resumo({ saldo, entradas, saidas }) {

    return (
        <div className="resumo">

            <div className="card saldo">
                <h3>Saldo</h3>
                <p>{brl(saldo)}</p>
            </div>

            <div className="card entrada">
                <h3>Entradas</h3>
                <p>{brl(entradas)}</p>
            </div>

            <div className="card saida">
                <h3>Saídas</h3>
                <p>{brl(saidas)}</p>
            </div>

        </div>
    )
}

export default Resumo

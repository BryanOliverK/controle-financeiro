function Resumo({saldo, entradas, saidas}) {
   
    return(
        <div className="resumo">

            <div className="card saldo">
                <h3>Saldo</h3>
                <p>R$ {saldo.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2
                })}
                </p>
            </div>

            <div className="card entrada">
                <h3>Entradas</h3>
                <p>R$ {entradas.toLocaleString("pt-BR",{
                    minimumFractionDigits: 2
                })}
                </p>
            </div>

            <div className="card saida">
                <h3>Saídas</h3>  
                <p>R$ {saidas.toLocaleString("pt-BR",{
                    minimumFractionDigits: 2
                })}
                </p>
            </div>
        </div>
    )
}

export default Resumo
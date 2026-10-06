function Transacao({descricao, valor, tipo, categoria, data}) {
    return (
        <div className="info-transacao">   
                <h3>{descricao}</h3>

                <span className="categoria">
                    {categoria}
                </span>

                <p>
                    {tipo === "entrada" ? "+" : "-"}R$ {valor.toLocaleString("pt-BR",{
                        minimumFractionDigits: 2
                    })}
                </p>

                <span className={tipo === "entrada" ? "entrada-texto": "saida-texto"}>
                   {tipo === "entrada" ? "Entrada": "Saída"}
                </span>

                <p className="data-transacao">
                    {new Date(data).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    })}
                    {" · "}
                    {new Date(data).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                    })}
                </p>
        </div>
    )
}

export default Transacao

//////////////////////////////////////////////////////////////////////////////////////////////////////
//  Operador Ternário "?" :                                                                         //
//                                                                                                  //
//     É uma forma simplificada de escrever um if/else em uma única linha.                          //
//                                                                                                  //
//  Estrutura:                                                                                      //
//                                                                                                  //
//     condição ? verdadeiro : falso                                                                //
//                                                                                                  //
//  Exemplo:                                                                                        //
//                                                                                                  //
//     idade >= 18 ? "Maior" : "Menor"                                                              //
//                                                                                                  //
//  Leitura:                                                                                        //
//                                                                                                  //
//     Se idade >= 18 for verdadeiro → "Maior", senão → "Menor".                                    //
//////////////////////////////////////////////////////////////////////////////////////////////////////
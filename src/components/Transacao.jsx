import { nomeCategoria } from "../utils/categorias"
import { brl } from "../utils/formatar"

// Uma linha da lista. Se receber onEditar/onExcluir, mostra os botões
// (transações de caixinha não podem ser editadas aqui).
function Transacao({ transacao, onEditar, onExcluir }) {

    const { id, descricao, valor, tipo, categoria, data } = transacao

    const dataTransacao = new Date(data)
    const mostrarAcoes = categoria !== "caixinha" && (onEditar || onExcluir)

    return (
        <div className="transacao">

            <div className="info-transacao">
                <h3>{descricao}</h3>

                {categoria && (
                    <span className="categoria">
                        {nomeCategoria(categoria)}
                    </span>
                )}

                <p>
                    {tipo === "entrada" ? "+" : "-"}{brl(valor)}
                </p>

                <span className={tipo === "entrada" ? "entrada-texto": "saida-texto"}>
                   {tipo === "entrada" ? "Entrada": "Saída"}
                </span>

                <p className="data-transacao">
                    {dataTransacao.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric"
                    })}
                    {" · "}
                    {dataTransacao.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                    })}
                </p>
            </div>

            {mostrarAcoes && (
                <div className="acoes">

                    {onEditar && (
                        <button className="btn-editar" onClick={() => onEditar(id)}>
                            Editar
                        </button>
                    )}

                    {onExcluir && (
                        <button className="btn-excluir" onClick={() => onExcluir(id)}>
                            Excluir
                        </button>
                    )}

                </div>
            )}

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

import Icone from "./Icone"
import { infoCategoria, nomeCategoria, SEM_CATEGORIA } from "../utils/categorias"
import { infoCartao } from "../utils/cartoes"
import { infoConta } from "../utils/contas"
import { brl } from "../utils/formatar"
import { limparEtiquetas } from "../utils/etiquetas"

// Uma linha da lista. Se receber onEditar/onExcluir, mostra os botões
// (transações de caixinha não podem ser editadas aqui).
// Com onEtiqueta, clicar numa etiqueta filtra a lista por ela.
function Transacao({ transacao, onEditar, onExcluir, onEtiqueta }) {

    const { id, descricao, valor, tipo, categoria, data, parcela, cartaoId, contaId } = transacao

    const dataTransacao = new Date(data)
    const mostrarAcoes = categoria !== "caixinha" && (onEditar || onExcluir)
    const entrada = tipo === "entrada"

    const info = infoCategoria(categoria) || SEM_CATEGORIA
    const etiquetas = limparEtiquetas(transacao.etiquetas)

    return (
        <div className="transacao">

            <span className="transacao-icone" style={{ "--cor": info.cor }}>
                <Icone nome={info.icone} tamanho={22} />
            </span>

            <div className="info-transacao">
                <h3>
                    {descricao}
                    {parcela && (
                        <span className="selo-parcela" title="Compra parcelada">
                            {parcela.n}/{parcela.total}
                        </span>
                    )}
                </h3>

                <p className="data-transacao">
                    {categoria && <>{nomeCategoria(categoria)}{" · "}</>}
                    {contaId && infoConta(contaId) && <>{infoConta(contaId).nome}{" · "}</>}
                    {cartaoId && infoCartao(cartaoId) && <>{infoCartao(cartaoId).nome}{" · "}</>}
                    {dataTransacao.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    })}
                    {" · "}
                    {dataTransacao.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                    })}
                </p>

                {etiquetas.length > 0 && (
                    <p className="etq-linha">
                        {etiquetas.map((e) => (
                            onEtiqueta ? (
                                <button
                                    type="button"
                                    key={e}
                                    className="etq-chip etq-link"
                                    onClick={() => onEtiqueta(e)}
                                    title={`Ver só ${e}`}
                                    aria-label={`Filtrar pela etiqueta ${e}`}
                                >
                                    #{e}
                                </button>
                            ) : (
                                <span key={e} className="etq-chip">#{e}</span>
                            )
                        ))}
                    </p>
                )}
            </div>

            <div className="lado-transacao">

                <p className={entrada ? "valor-transacao entrada-texto" : "valor-transacao saida-texto"}>
                    <span className="sr-only">{entrada ? "Entrada " : "Saída "}</span>
                    {entrada ? "+" : "-"}{brl(valor)}
                </p>

                {mostrarAcoes && (
                    <div className="acoes">

                        {onEditar && (
                            <button
                                className="btn-editar"
                                onClick={() => onEditar(id)}
                                aria-label={`Editar ${descricao}`}
                                title="Editar"
                            >
                                <Icone nome="editar" tamanho={16} />
                            </button>
                        )}

                        {onExcluir && (
                            <button
                                className="btn-excluir"
                                onClick={() => onExcluir(id)}
                                aria-label={`Excluir ${descricao}`}
                                title="Excluir"
                            >
                                <Icone nome="lixeira" tamanho={16} />
                            </button>
                        )}

                    </div>
                )}

            </div>

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

import { useState } from "react"
import Icone from "./Icone"
import ConfirmarAcao from "./ConfirmarAcao"
import { agruparFaturas, chaveFatura, CORES_CARTAO, LIMITE_NOME_CARTAO, statusFatura } from "../utils/cartoes"
import { brl } from "../utils/formatar"

const NOVO = { id: null, nome: "", fechamento: "", vencimento: "", cor: CORES_CARTAO[0] }

const ROTULO = { paga: "Paga", aberta: "Aberta", fechada: "Fechada", vencida: "Vencida" }

const dataCurta = (data) => data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })

function Fatura({ fatura, paga, onAlternar }) {

  const status = statusFatura(fatura, paga)

  return (
    <li className={`fatura ${status}`}>

      <div className="fatura-linha">
        <span className="fatura-info">
          <strong>Vence {dataCurta(fatura.vence)}</strong>
          <small>Fecha {dataCurta(fatura.fecha)}</small>
        </span>

        <span className={`fatura-selo ${status}`}>{ROTULO[status]}</span>

        <span className="fatura-total valor-privado">{brl(fatura.total)}</span>
      </div>

      <div className="fatura-acoes">
        <details>
          <summary>Ver {fatura.itens.length} {fatura.itens.length === 1 ? "compra" : "compras"}</summary>

          <ul className="fatura-compras">
            {fatura.itens.map((t) => (
              <li key={t.id}>
                <span>{t.descricao}{t.parcela && ` (${t.parcela.n}/${t.parcela.total})`}</span>
                <small>{dataCurta(new Date(t.data))}</small>
                <span className="valor-privado">{brl(t.valor)}</span>
              </li>
            ))}
          </ul>
        </details>

        <button type="button" className="fatura-botao" onClick={onAlternar}>
          {paga ? "Desfazer pagamento" : "Marcar como paga"}
        </button>
      </div>

    </li>
  )
}

// Cadastro dos cartões e suas faturas.
function Cartoes({ cartoes, transacoes, faturasPagas, onSalvar, onExcluir, onAlternarPaga }) {

  const [rascunho, setRascunho] = useState(NOVO)
  const [formAberto, setFormAberto] = useState(false)
  const [erro, setErro] = useState("")
  const [excluindo, setExcluindo] = useState(null)

  const pagas = new Set(faturasPagas)

  function alterar(campo, valor) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }))
    setErro("")
  }

  function abrirNovo() {
    setRascunho(NOVO)
    setErro("")
    setFormAberto(true)
  }

  function editar(cartao) {
    setRascunho({ ...cartao })
    setErro("")
    setFormAberto(true)
  }

  function cancelar() {
    setRascunho(NOVO)
    setFormAberto(false)
    setErro("")
  }

  function salvar(evento) {
    evento.preventDefault()

    const nome = rascunho.nome.trim()
    const fechamento = Number(rascunho.fechamento)
    const vencimento = Number(rascunho.vencimento)

    if (nome === "") {
      setErro("Dê um nome para o cartão.")
      return
    }

    const diaOk = (n) => Number.isInteger(n) && n >= 1 && n <= 31

    if (!diaOk(fechamento) || !diaOk(vencimento)) {
      setErro("Fechamento e vencimento são dias do mês, de 1 a 31.")
      return
    }

    if (cartoes.some((c) => c.id !== rascunho.id && c.nome.toLowerCase() === nome.toLowerCase())) {
      setErro("Já existe um cartão com esse nome.")
      return
    }

    onSalvar({ ...rascunho, nome, fechamento, vencimento })
    cancelar()
  }

  return (
    <section className="cartoes">

      <div className="secao-topo">
        <h2 className="titulo-secao">Cartões de crédito</h2>

        {!formAberto && (
          <button type="button" className="link-ver-todas" onClick={abrirNovo}>
            Novo cartão
            <Icone nome="adicionar" tamanho={16} />
          </button>
        )}
      </div>

      {cartoes.length === 0 && !formAberto && (
        <p className="cartoes-vazio">
          Cadastre seu cartão com o dia de fechamento e o de vencimento. Ao lançar
          uma saída, escolha "Pagar com" e o app organiza a fatura para você.
        </p>
      )}

      {cartoes.map((cartao) => {
        const faturas = agruparFaturas(cartao, transacoes)
        const emAberto = faturas.filter((f) => !pagas.has(chaveFatura(cartao.id, f.chave)))
        const jaPagas = faturas.filter((f) => pagas.has(chaveFatura(cartao.id, f.chave)))

        return (
          <article key={cartao.id} className="cartao-card" style={{ "--cor": cartao.cor }}>

            <header className="cartao-topo">
              <span className="cartao-bolinha"><Icone nome="transacoes" tamanho={20} /></span>

              <span className="cartao-nome">
                <strong>{cartao.nome}</strong>
                <small>Fecha dia {cartao.fechamento} · Vence dia {cartao.vencimento}</small>
              </span>

              <button type="button" className="btn-editar" onClick={() => editar(cartao)} aria-label={`Editar cartão ${cartao.nome}`} title="Editar">
                <Icone nome="editar" tamanho={16} />
              </button>

              <button type="button" className="btn-excluir" onClick={() => setExcluindo(cartao)} aria-label={`Excluir cartão ${cartao.nome}`} title="Excluir">
                <Icone nome="lixeira" tamanho={16} />
              </button>
            </header>

            {faturas.length === 0 && (
              <p className="cartoes-vazio">Nenhuma compra neste cartão ainda.</p>
            )}

            {emAberto.length > 0 && (
              <ul className="faturas">
                {emAberto.map((f) => (
                  <Fatura key={f.chave} fatura={f} paga={false} onAlternar={() => onAlternarPaga(cartao.id, f.chave)} />
                ))}
              </ul>
            )}

            {jaPagas.length > 0 && (
              <details className="faturas-pagas">
                <summary>Faturas pagas ({jaPagas.length})</summary>

                <ul className="faturas">
                  {jaPagas.slice().reverse().map((f) => (
                    <Fatura key={f.chave} fatura={f} paga onAlternar={() => onAlternarPaga(cartao.id, f.chave)} />
                  ))}
                </ul>
              </details>
            )}

          </article>
        )
      })}

      {formAberto && (
        <form className="cartao-form" onSubmit={salvar} noValidate>

          <strong>{rascunho.id ? "Editar cartão" : "Novo cartão"}</strong>

          <input
            type="text"
            placeholder="Nome (ex.: Nubank)"
            aria-label="Nome do cartão"
            value={rascunho.nome}
            maxLength={LIMITE_NOME_CARTAO}
            onChange={(e) => alterar("nome", e.target.value.slice(0, LIMITE_NOME_CARTAO))}
          />

          <div className="cartao-dias">
            <label>
              Fecha no dia
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={rascunho.fechamento}
                onChange={(e) => alterar("fechamento", e.target.value)}
              />
            </label>

            <label>
              Vence no dia
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                value={rascunho.vencimento}
                onChange={(e) => alterar("vencimento", e.target.value)}
              />
            </label>
          </div>

          <div className="gc-grade" role="radiogroup" aria-label="Cor">
            {CORES_CARTAO.map((cor) => (
              <button
                key={cor}
                type="button"
                role="radio"
                aria-checked={rascunho.cor === cor}
                aria-label={`Cor ${cor}`}
                className={rascunho.cor === cor ? "gc-cor ativo" : "gc-cor"}
                style={{ backgroundColor: cor }}
                onClick={() => alterar("cor", cor)}
              />
            ))}
          </div>

          {erro && <p className="gc-erro" role="alert">{erro}</p>}

          <div className="form-acoes">
            <button type="submit" className="btn-salvar">
              {rascunho.id ? "Salvar cartão" : "Criar cartão"}
            </button>

            <button type="button" className="btn-cancelar" onClick={cancelar}>Cancelar</button>
          </div>

        </form>
      )}

      {excluindo && (
        <ConfirmarAcao
          titulo="Excluir cartão?"
          textoConfirmar="Excluir cartão"
          perigo
          onConfirmar={() => { onExcluir(excluindo.id); setExcluindo(null) }}
          onCancelar={() => setExcluindo(null)}
        >
          <p>
            "{excluindo.nome}" será removido. As compras feitas nele continuam no
            histórico, mas deixam de pertencer a uma fatura.
          </p>
        </ConfirmarAcao>
      )}

    </section>
  )
}

export default Cartoes

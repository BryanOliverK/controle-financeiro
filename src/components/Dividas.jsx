import { useState } from "react"
import Icone from "./Icone"
import ConfirmarAcao from "./ConfirmarAcao"
import {
  LIMITE_DESCRICAO_DIVIDA,
  LIMITE_PESSOA,
  diasParaVencer,
  ordenarDividas,
  resumoDividas,
  saldoDivida,
  statusDivida,
  totalPago,
  validarDivida,
  validarPagamento
} from "../utils/dividas"
import { brl } from "../utils/formatar"

const NOVA = { id: null, tipo: "devo", pessoa: "", valor: "", descricao: "", vencimento: "" }

const ROTULO = { aberta: "Em aberto", vencida: "Vencida", quitada: "Quitada" }

const dataCurta = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
const dataDoDia = (dia) => new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })

function textoPrazo(divida) {
  const dias = diasParaVencer(divida)

  if (dias === null) return ""
  if (dias < 0) return `Venceu em ${dataDoDia(divida.vencimento)}`
  if (dias === 0) return "Vence hoje"
  if (dias === 1) return "Vence amanhã"
  return `Vence em ${dataDoDia(divida.vencimento)}`
}

function CartaoDivida({ divida, onEditar, onExcluir, onPagar, onDesfazer }) {

  const [pagando, setPagando] = useState(false)
  const [valor, setValor] = useState("")
  const [lancar, setLancar] = useState(true)
  const [erro, setErro] = useState("")

  const status = statusDivida(divida)
  const saldo = saldoDivida(divida)
  const pago = totalPago(divida)
  const devo = divida.tipo === "devo"
  const porcentagem = Math.min(100, Math.round((pago / divida.valor) * 100))
  const prazo = status === "quitada" ? "" : textoPrazo(divida)

  function abrirPagamento() {
    setValor(String(saldo))
    setLancar(true)
    setErro("")
    setPagando(true)
  }

  function confirmarPagamento(evento) {
    evento.preventDefault()

    const msg = validarPagamento(divida, valor)

    if (msg) {
      setErro(msg)
      return
    }

    onPagar(divida.id, valor, lancar)
    setPagando(false)
  }

  return (
    <li className={`divida ${devo ? "devo" : "devem"} ${status}`}>

      <div className="divida-topo">
        <span className="divida-quem">
          <strong>{divida.pessoa}</strong>
          <small>
            {devo ? "Você deve" : "Te deve"}
            {divida.descricao && ` · ${divida.descricao}`}
          </small>
        </span>

        <span className={`divida-selo ${status}`}>{ROTULO[status]}</span>
      </div>

      <div className="divida-valores">
        <span className="valor-privado">
          {status === "quitada" ? brl(divida.valor) : `Falta ${brl(saldo)}`}
        </span>
        {status !== "quitada" && pago > 0 && (
          <small className="valor-privado">de {brl(divida.valor)}</small>
        )}
      </div>

      <div
        className="divida-barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentagem}
        aria-label={`${porcentagem}% pago`}
      >
        <span style={{ width: `${porcentagem}%` }} />
      </div>

      {prazo && <small className={`divida-prazo ${status}`}>{prazo}</small>}

      {pagando ? (
        <form className="divida-pagar" onSubmit={confirmarPagamento} noValidate>
          <label>
            {devo ? "Quanto você pagou?" : "Quanto você recebeu?"}
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => { setValor(e.target.value); setErro("") }}
            />
          </label>

          <label className="divida-check">
            <input type="checkbox" checked={lancar} onChange={(e) => setLancar(e.target.checked)} />
            Lançar também em Transações ({devo ? "saída" : "entrada"})
          </label>

          {erro && <p className="gc-erro" role="alert">{erro}</p>}

          <div className="form-acoes">
            <button type="submit" className="btn-salvar">Registrar</button>
            <button type="button" className="btn-cancelar" onClick={() => setPagando(false)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <div className="divida-acoes">
          {status !== "quitada" && (
            <button type="button" className="fatura-botao" onClick={abrirPagamento}>
              {devo ? "Registrar pagamento" : "Registrar recebimento"}
            </button>
          )}

          <button type="button" className="btn-editar" onClick={() => onEditar(divida)} aria-label={`Editar dívida de ${divida.pessoa}`} title="Editar">
            <Icone nome="editar" tamanho={16} />
          </button>

          <button type="button" className="btn-excluir" onClick={() => onExcluir(divida)} aria-label={`Excluir dívida de ${divida.pessoa}`} title="Excluir">
            <Icone nome="lixeira" tamanho={16} />
          </button>
        </div>
      )}

      {divida.pagamentos.length > 0 && (
        <details className="divida-historico">
          <summary>{devo ? "Pagamentos" : "Recebimentos"} ({divida.pagamentos.length})</summary>

          <ul>
            {divida.pagamentos.map((p) => (
              <li key={p.id}>
                <span>{dataCurta(p.data)}</span>
                <span className="valor-privado">{brl(p.valor)}</span>
                <button type="button" className="divida-desfazer" onClick={() => onDesfazer(divida.id, p.id)}>
                  Desfazer
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

    </li>
  )
}

// Dívidas (você deve) e empréstimos (te devem), com pagamentos parciais.
function Dividas({ dividas, onSalvar, onExcluir, onPagar, onDesfazerPagamento }) {

  const [rascunho, setRascunho] = useState(NOVA)
  const [formAberto, setFormAberto] = useState(false)
  const [erro, setErro] = useState("")
  const [excluindo, setExcluindo] = useState(null)

  const resumo = resumoDividas(dividas)
  const ordenadas = ordenarDividas(dividas)
  const abertas = ordenadas.filter((d) => statusDivida(d) !== "quitada")
  const quitadas = ordenadas.filter((d) => statusDivida(d) === "quitada")

  function alterar(campo, valor) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }))
    setErro("")
  }

  function abrirNova() {
    setRascunho(NOVA)
    setErro("")
    setFormAberto(true)
  }

  function editar(divida) {
    setRascunho({ ...divida, valor: String(divida.valor) })
    setErro("")
    setFormAberto(true)
  }

  function cancelar() {
    setRascunho(NOVA)
    setFormAberto(false)
    setErro("")
  }

  function salvar(evento) {
    evento.preventDefault()

    const msg = validarDivida(rascunho)

    if (msg) {
      setErro(msg)
      return
    }

    if (rascunho.id) {
      const atual = dividas.find((d) => d.id === rascunho.id)

      if (atual && Number(rascunho.valor) < totalPago(atual)) {
        setErro(`Já foram pagos ${brl(totalPago(atual))}. O valor não pode ser menor que isso.`)
        return
      }
    }

    onSalvar({ ...rascunho, valor: Number(rascunho.valor) })
    cancelar()
  }

  const itemProps = {
    onEditar: editar,
    onExcluir: setExcluindo,
    onPagar,
    onDesfazer: onDesfazerPagamento
  }

  return (
    <section className="dividas">

      <div className="secao-topo">
        <h2 className="titulo-secao">Dívidas e empréstimos</h2>

        {!formAberto && (
          <button type="button" className="link-ver-todas" onClick={abrirNova}>
            Nova
            <Icone nome="adicionar" tamanho={16} />
          </button>
        )}
      </div>

      {dividas.length === 0 && !formAberto && (
        <p className="cartoes-vazio">
          Anote o que você deve ou o que te devem. Registre pagamentos aos poucos
          e acompanhe quanto ainda falta, com aviso quando estiver perto de vencer.
        </p>
      )}

      {dividas.length > 0 && (
        <div className="divida-resumo">
          <div className="divida-resumo-item devo">
            <small>Você deve</small>
            <strong className="valor-privado">{brl(resumo.devo)}</strong>
          </div>

          <div className="divida-resumo-item devem">
            <small>Te devem</small>
            <strong className="valor-privado">{brl(resumo.devem)}</strong>
          </div>
        </div>
      )}

      {abertas.length > 0 && (
        <ul className="dividas-lista">
          {abertas.map((d) => <CartaoDivida key={d.id} divida={d} {...itemProps} />)}
        </ul>
      )}

      {quitadas.length > 0 && (
        <details className="faturas-pagas">
          <summary>Quitadas ({quitadas.length})</summary>

          <ul className="dividas-lista">
            {quitadas.map((d) => <CartaoDivida key={d.id} divida={d} {...itemProps} />)}
          </ul>
        </details>
      )}

      {formAberto && (
        <form className="cartao-form" onSubmit={salvar} noValidate>

          <strong>{rascunho.id ? "Editar dívida" : "Nova dívida"}</strong>

          <div className="divida-tipos" role="radiogroup" aria-label="Tipo">
            <button
              type="button"
              role="radio"
              aria-checked={rascunho.tipo === "devo"}
              className={rascunho.tipo === "devo" ? "ativo" : ""}
              onClick={() => alterar("tipo", "devo")}
            >
              Eu devo
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={rascunho.tipo === "devem"}
              className={rascunho.tipo === "devem" ? "ativo" : ""}
              onClick={() => alterar("tipo", "devem")}
            >
              Me devem
            </button>
          </div>

          <input
            type="text"
            placeholder={rascunho.tipo === "devo" ? "Para quem você deve?" : "Quem te deve?"}
            aria-label="Pessoa"
            value={rascunho.pessoa}
            maxLength={LIMITE_PESSOA}
            onChange={(e) => alterar("pessoa", e.target.value.slice(0, LIMITE_PESSOA))}
          />

          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="Valor total (R$)"
            aria-label="Valor total"
            value={rascunho.valor}
            onChange={(e) => alterar("valor", e.target.value)}
          />

          <input
            type="text"
            placeholder="Motivo (opcional)"
            aria-label="Motivo"
            value={rascunho.descricao}
            maxLength={LIMITE_DESCRICAO_DIVIDA}
            onChange={(e) => alterar("descricao", e.target.value.slice(0, LIMITE_DESCRICAO_DIVIDA))}
          />

          <label className="divida-data">
            Vencimento (opcional)
            <input
              type="date"
              value={rascunho.vencimento}
              onChange={(e) => alterar("vencimento", e.target.value)}
            />
          </label>

          {erro && <p className="gc-erro" role="alert">{erro}</p>}

          <div className="form-acoes">
            <button type="submit" className="btn-salvar">
              {rascunho.id ? "Salvar" : "Adicionar"}
            </button>

            <button type="button" className="btn-cancelar" onClick={cancelar}>Cancelar</button>
          </div>

        </form>
      )}

      {excluindo && (
        <ConfirmarAcao
          titulo="Excluir dívida?"
          textoConfirmar="Excluir"
          perigo
          onConfirmar={() => { onExcluir(excluindo.id); setExcluindo(null) }}
          onCancelar={() => setExcluindo(null)}
        >
          <p>
            A dívida {excluindo.tipo === "devo" ? "com" : "de"} "{excluindo.pessoa}" será removida
            junto com o histórico de pagamentos. Os valores já lançados em Transações continuam lá.
          </p>
        </ConfirmarAcao>
      )}

    </section>
  )
}

export default Dividas

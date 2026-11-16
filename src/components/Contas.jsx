import { useState } from "react"
import Icone from "./Icone"
import ConfirmarAcao from "./ConfirmarAcao"
import {
  CORES_CONTA,
  LIMITE_NOME_CONTA,
  LIMITE_NOTA,
  TIPOS_CONTA,
  contarSemConta,
  saldoConta,
  saldoSemConta,
  totalContas,
  validarConta,
  validarTransferencia
} from "../utils/contas"
import { brl, hojeLocal } from "../utils/formatar"

const NOVA = { id: null, nome: "", tipo: "banco", saldoInicial: "", cor: CORES_CONTA[0] }
const TRANSFERENCIA_VAZIA = { de: "", para: "", valor: "", data: "", nota: "" }

const nomeTipo = (valor) => TIPOS_CONTA.find((t) => t.valor === valor)?.nome || ""
const dataCurta = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })

// Contas com saldo próprio e transferências entre elas.
function Contas({
  contas, transacoes, transferencias,
  onSalvar, onExcluir, onTransferir, onExcluirTransferencia, onAtribuirSemConta
}) {

  const [rascunho, setRascunho] = useState(NOVA)
  const [formAberto, setFormAberto] = useState(false)
  const [erro, setErro] = useState("")
  const [excluindo, setExcluindo] = useState(null)

  const [transf, setTransf] = useState(TRANSFERENCIA_VAZIA)
  const [transfAberta, setTransfAberta] = useState(false)
  const [erroTransf, setErroTransf] = useState("")

  const [destinoSem, setDestinoSem] = useState("")
  const [atribuindo, setAtribuindo] = useState(false)

  const semConta = contarSemConta(transacoes, contas)
  const nomeDe = (id) => contas.find((c) => c.id === id)?.nome || "Conta removida"

  function alterar(campo, valor) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }))
    setErro("")
  }

  function abrirNova() {
    setRascunho(NOVA)
    setErro("")
    setFormAberto(true)
  }

  function editar(conta) {
    setRascunho({ ...conta, saldoInicial: conta.saldoInicial === 0 ? "" : String(conta.saldoInicial) })
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

    const msg = validarConta(rascunho, contas, rascunho.id)

    if (msg) {
      setErro(msg)
      return
    }

    onSalvar({ ...rascunho, nome: rascunho.nome.trim(), saldoInicial: Number(rascunho.saldoInicial || 0) })
    cancelar()
  }

  function alterarTransf(campo, valor) {
    setTransf((atual) => ({ ...atual, [campo]: valor }))
    setErroTransf("")
  }

  function abrirTransferencia() {
    setTransf({ ...TRANSFERENCIA_VAZIA, de: contas[0]?.id || "", para: contas[1]?.id || "" })
    setErroTransf("")
    setTransfAberta(true)
  }

  function enviarTransferencia(evento) {
    evento.preventDefault()

    const msg = validarTransferencia(transf, contas)

    if (msg) {
      setErroTransf(msg)
      return
    }

    onTransferir(transf)
    setTransfAberta(false)
  }

  const recentes = transferencias
    .slice()
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 8)

  return (
    <section className="contas">

      <div className="secao-topo">
        <h2 className="titulo-secao">Contas</h2>

        {!formAberto && (
          <button type="button" className="link-ver-todas" onClick={abrirNova}>
            Nova conta
            <Icone nome="adicionar" tamanho={16} />
          </button>
        )}
      </div>

      {contas.length === 0 && !formAberto && (
        <p className="cartoes-vazio">
          Crie suas contas (carteira, banco, poupança...) para saber quanto tem em cada
          uma. Ao lançar uma transação você escolhe a conta, e dá para transferir
          dinheiro entre elas sem que isso conte como gasto.
        </p>
      )}

      {contas.length > 0 && (
        <div className="conta-total">
          <small>Total nas contas</small>
          <strong className="valor-privado">{brl(totalContas(contas, transacoes, transferencias))}</strong>
        </div>
      )}

      {contas.length > 0 && (
        <ul className="contas-lista">
          {contas.map((c) => {
            const saldo = saldoConta(c, transacoes, transferencias)

            return (
              <li key={c.id} className="conta-card" style={{ "--cor": c.cor }}>
                <span className="conta-bolinha"><Icone nome="carteira" tamanho={20} /></span>

                <span className="conta-nome">
                  <strong>{c.nome}</strong>
                  <small>{nomeTipo(c.tipo)}</small>
                </span>

                <span className={`conta-saldo valor-privado${saldo < 0 ? " negativo" : ""}`}>{brl(saldo)}</span>

                <button type="button" className="btn-editar" onClick={() => editar(c)} aria-label={`Editar conta ${c.nome}`} title="Editar">
                  <Icone nome="editar" tamanho={16} />
                </button>

                <button type="button" className="btn-excluir" onClick={() => setExcluindo(c)} aria-label={`Excluir conta ${c.nome}`} title="Excluir">
                  <Icone nome="lixeira" tamanho={16} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {contas.length >= 2 && !transfAberta && (
        <button type="button" className="fatura-botao conta-transferir" onClick={abrirTransferencia}>
          <Icone nome="repetir" tamanho={16} />
          Transferir entre contas
        </button>
      )}

      {contas.length === 1 && (
        <p className="cartoes-vazio">Crie mais uma conta para poder transferir entre elas.</p>
      )}

      {transfAberta && (
        <form className="cartao-form" onSubmit={enviarTransferencia} noValidate>

          <strong>Transferir entre contas</strong>

          <label className="divida-data">
            De
            <select value={transf.de} onChange={(e) => alterarTransf("de", e.target.value)}>
              {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>

          <label className="divida-data">
            Para
            <select value={transf.para} onChange={(e) => alterarTransf("para", e.target.value)}>
              {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>

          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="Valor (R$)"
            aria-label="Valor da transferência"
            value={transf.valor}
            onChange={(e) => alterarTransf("valor", e.target.value)}
          />

          <label className="divida-data">
            Data
            <input
              type="date"
              value={transf.data || hojeLocal()}
              onChange={(e) => alterarTransf("data", e.target.value)}
            />
          </label>

          <input
            type="text"
            placeholder="Observação (opcional)"
            aria-label="Observação"
            value={transf.nota}
            maxLength={LIMITE_NOTA}
            onChange={(e) => alterarTransf("nota", e.target.value.slice(0, LIMITE_NOTA))}
          />

          {erroTransf && <p className="gc-erro" role="alert">{erroTransf}</p>}

          <div className="form-acoes">
            <button type="submit" className="btn-salvar">Transferir</button>
            <button type="button" className="btn-cancelar" onClick={() => setTransfAberta(false)}>Cancelar</button>
          </div>

        </form>
      )}

      {recentes.length > 0 && (
        <details className="faturas-pagas">
          <summary>Transferências ({transferencias.length})</summary>

          <ul className="transf-lista">
            {recentes.map((t) => (
              <li key={t.id}>
                <span className="transf-info">
                  <strong>{nomeDe(t.de)} → {nomeDe(t.para)}</strong>
                  <small>{dataCurta(t.data)}{t.nota && ` · ${t.nota}`}</small>
                </span>

                <span className="valor-privado">{brl(t.valor)}</span>

                <button type="button" className="divida-desfazer" onClick={() => onExcluirTransferencia(t.id)}>
                  Desfazer
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {contas.length > 0 && semConta > 0 && (
        <div className="conta-sem">
          <p>
            <strong>{semConta} {semConta === 1 ? "transação" : "transações"} sem conta</strong>{" "}
            (saldo <span className="valor-privado">{brl(saldoSemConta(transacoes, contas))}</span>).
            Você pode atribuir todas a uma conta de uma vez.
          </p>

          <div className="conta-sem-acao">
            <select value={destinoSem} onChange={(e) => setDestinoSem(e.target.value)} aria-label="Conta de destino">
              <option value="">Escolha a conta...</option>
              {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>

            <button type="button" className="fatura-botao" disabled={destinoSem === ""} onClick={() => setAtribuindo(true)}>
              Atribuir
            </button>
          </div>
        </div>
      )}

      {formAberto && (
        <form className="cartao-form" onSubmit={salvar} noValidate>

          <strong>{rascunho.id ? "Editar conta" : "Nova conta"}</strong>

          <input
            type="text"
            placeholder="Nome (ex.: Nubank)"
            aria-label="Nome da conta"
            value={rascunho.nome}
            maxLength={LIMITE_NOME_CONTA}
            onChange={(e) => alterar("nome", e.target.value.slice(0, LIMITE_NOME_CONTA))}
          />

          <label className="divida-data">
            Tipo
            <select value={rascunho.tipo} onChange={(e) => alterar("tipo", e.target.value)}>
              {TIPOS_CONTA.map((t) => <option key={t.valor} value={t.valor}>{t.nome}</option>)}
            </select>
          </label>

          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="Saldo inicial (R$, opcional)"
            aria-label="Saldo inicial"
            value={rascunho.saldoInicial}
            onChange={(e) => alterar("saldoInicial", e.target.value)}
          />

          <div className="gc-grade" role="radiogroup" aria-label="Cor">
            {CORES_CONTA.map((cor) => (
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
            <button type="submit" className="btn-salvar">{rascunho.id ? "Salvar conta" : "Criar conta"}</button>
            <button type="button" className="btn-cancelar" onClick={cancelar}>Cancelar</button>
          </div>

        </form>
      )}

      {excluindo && (
        <ConfirmarAcao
          titulo="Excluir conta?"
          textoConfirmar="Excluir conta"
          perigo
          onConfirmar={() => { onExcluir(excluindo.id); setExcluindo(null) }}
          onCancelar={() => setExcluindo(null)}
        >
          <p>
            "{excluindo.nome}" será removida, junto com as transferências que passaram por ela.
            As transações continuam no histórico, só deixam de ter uma conta.
          </p>
        </ConfirmarAcao>
      )}

      {atribuindo && (
        <ConfirmarAcao
          titulo="Atribuir à conta?"
          textoConfirmar="Atribuir"
          onConfirmar={() => { onAtribuirSemConta(destinoSem); setAtribuindo(false); setDestinoSem("") }}
          onCancelar={() => setAtribuindo(false)}
        >
          <p>
            {semConta} {semConta === 1 ? "transação" : "transações"} passarão a pertencer à
            conta "{nomeDe(destinoSem)}". Dá para trocar uma a uma depois, editando a transação.
          </p>
        </ConfirmarAcao>
      )}

    </section>
  )
}

export default Contas

import { useMemo, useState } from "react"
import Icone from "./Icone"
import ConfirmarAcao from "./ConfirmarAcao"
import { nomeMes } from "../utils/formatar"
import { contarCaixinhas, resumirPorMes } from "../utils/historico"

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

// Lista os meses (agrupados por ano) com caixas de seleção.
function ListaMeses({ meses, marcados, onAlternar, onAlternarAno }) {

  const anos = [...new Set(meses.map((m) => m.ano))]

  return (
    <div className="lh-anos">
      {anos.map((ano) => {
        const doAno = meses.filter((m) => m.ano === ano)
        const todos = doAno.every((m) => marcados.has(m.mes))

        return (
          <fieldset key={ano} className="lh-ano">
            <legend>
              <label>
                <input
                  type="checkbox"
                  checked={todos}
                  onChange={() => onAlternarAno(doAno, !todos)}
                />
                <strong>{ano}</strong>
                <span> · todos os meses</span>
              </label>
            </legend>

            {doAno.map((m) => (
              <label key={m.mes} className="lh-mes">
                <input
                  type="checkbox"
                  checked={marcados.has(m.mes)}
                  onChange={() => onAlternar(m.mes)}
                />
                <span>{nomeMes(m.mes)}</span>
                <small>{plural(m.quantidade, "transação", "transações")}</small>
              </label>
            ))}
          </fieldset>
        )
      })}
    </div>
  )
}

function LimparHistorico({ transacoes, onOcultar, onRestaurar, onExcluirDeVez }) {

  const [aberto, setAberto] = useState(false)
  const [incluirCaixinha, setIncluirCaixinha] = useState(false)
  const [marcadosVisiveis, setMarcadosVisiveis] = useState(new Set())
  const [marcadosOcultos, setMarcadosOcultos] = useState(new Set())
  const [confirmando, setConfirmando] = useState(null) // "ocultar" | "excluir"

  const mesesVisiveis = useMemo(
    () => resumirPorMes(transacoes, { ocultas: false, incluirCaixinha }),
    [transacoes, incluirCaixinha]
  )

  const mesesOcultos = useMemo(
    () => resumirPorMes(transacoes, { ocultas: true, incluirCaixinha: true }),
    [transacoes]
  )

  const temCaixinha = useMemo(
    () => transacoes.some((t) => !t.oculta && t.categoria === "caixinha"),
    [transacoes]
  )

  // Só conta o que ainda existe (um mês some da lista depois de ocultado)
  const escolhidosVisiveis = mesesVisiveis.filter((m) => marcadosVisiveis.has(m.mes))
  const escolhidosOcultos = mesesOcultos.filter((m) => marcadosOcultos.has(m.mes))

  const qtdVisiveis = escolhidosVisiveis.reduce((s, m) => s + m.quantidade, 0)
  const qtdOcultos = escolhidosOcultos.reduce((s, m) => s + m.quantidade, 0)
  const totalOcultos = mesesOcultos.reduce((s, m) => s + m.quantidade, 0)

  const caixinhasFora = incluirCaixinha
    ? 0
    : contarCaixinhas(transacoes, escolhidosVisiveis.map((m) => m.mes))

  function alternar(setter, mes) {
    setter((atual) => {
      const novo = new Set(atual)
      novo.has(mes) ? novo.delete(mes) : novo.add(mes)
      return novo
    })
  }

  function alternarAno(setter, doAno, marcar) {
    setter((atual) => {
      const novo = new Set(atual)
      doAno.forEach((m) => (marcar ? novo.add(m.mes) : novo.delete(m.mes)))
      return novo
    })
  }

  function confirmar() {
    const acao = confirmando
    setConfirmando(null)

    if (acao === "ocultar") {
      onOcultar(escolhidosVisiveis.map((m) => m.mes), incluirCaixinha)
      setMarcadosVisiveis(new Set())
    } else if (acao === "excluir") {
      onExcluirDeVez(escolhidosOcultos.map((m) => m.mes))
      setMarcadosOcultos(new Set())
    }
  }

  function restaurar() {
    onRestaurar(escolhidosOcultos.map((m) => m.mes))
    setMarcadosOcultos(new Set())
  }

  return (
    <section className="limpar-historico">

      <button
        type="button"
        className="gc-titulo"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
      >
        <span>
          Limpar histórico
          {totalOcultos > 0 && ` (${totalOcultos} oculta${totalOcultos === 1 ? "" : "s"})`}
        </span>
        <Icone nome="chevronBaixo" tamanho={18} className={aberto ? "gc-seta aberta" : "gc-seta"} />
      </button>

      {aberto && (
        <div className="gc-corpo">

          <p className="lh-ajuda">
            Escolha os meses que quer tirar da vista. <strong>Ocultar</strong> não
            apaga nada: as transações saem das listas e dos totais, mas ficam
            guardadas e você pode restaurar quando quiser.
          </p>

          {mesesVisiveis.length === 0 ? (
            <p className="lh-vazio">
              {incluirCaixinha || !temCaixinha
                ? "Não há transações para ocultar."
                : "Só restam movimentações de caixinha, que ficam de fora por padrão. Marque a opção abaixo para incluí-las."}
            </p>
          ) : (
            <ListaMeses
              meses={mesesVisiveis}
              marcados={marcadosVisiveis}
              onAlternar={(mes) => alternar(setMarcadosVisiveis, mes)}
              onAlternarAno={(doAno, marcar) => alternarAno(setMarcadosVisiveis, doAno, marcar)}
            />
          )}

          {(mesesVisiveis.length > 0 || temCaixinha) && (
            <label className="lh-opcao">
              <input
                type="checkbox"
                checked={incluirCaixinha}
                onChange={(e) => {
                  setIncluirCaixinha(e.target.checked)
                  setMarcadosVisiveis(new Set())
                }}
              />
              <span>
                Incluir movimentações de caixinhas
                <small>Não recomendado: muda o seu saldo.</small>
              </span>
            </label>
          )}

          {mesesVisiveis.length > 0 && (
            <button
              type="button"
              className="btn-salvar"
              disabled={qtdVisiveis === 0}
              onClick={() => setConfirmando("ocultar")}
            >
              {qtdVisiveis === 0
                ? "Ocultar meses selecionados"
                : `Ocultar ${plural(qtdVisiveis, "transação", "transações")}`}
            </button>
          )}

          {mesesOcultos.length > 0 && (
            <div className="lh-ocultas">

              <strong>Ocultas ({totalOcultos})</strong>

              <ListaMeses
                meses={mesesOcultos}
                marcados={marcadosOcultos}
                onAlternar={(mes) => alternar(setMarcadosOcultos, mes)}
                onAlternarAno={(doAno, marcar) => alternarAno(setMarcadosOcultos, doAno, marcar)}
              />

              <div className="form-acoes">
                <button
                  type="button"
                  className="btn-salvar"
                  disabled={qtdOcultos === 0}
                  onClick={restaurar}
                >
                  Restaurar
                </button>

                <button
                  type="button"
                  className="btn-perigo"
                  disabled={qtdOcultos === 0}
                  onClick={() => setConfirmando("excluir")}
                >
                  Excluir de vez
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {confirmando === "ocultar" && (
        <ConfirmarAcao
          titulo="Ocultar transações?"
          textoConfirmar="Ocultar"
          onConfirmar={confirmar}
          onCancelar={() => setConfirmando(null)}
        >
          <p>
            {plural(qtdVisiveis, "transação vai", "transações vão")} sair das listas e
            dos totais ({escolhidosVisiveis.map((m) => nomeMes(m.mes)).join(", ")}).
          </p>
          {caixinhasFora > 0 && (
            <p>
              {caixinhasFora === 1
                ? "1 movimentação de caixinha fica de fora"
                : `${caixinhasFora} movimentações de caixinha ficam de fora`}
              , para não mudar seu saldo.
            </p>
          )}
          <p>Nada é apagado: você pode restaurar depois, em "Ocultas".</p>
        </ConfirmarAcao>
      )}

      {confirmando === "excluir" && (
        <ConfirmarAcao
          titulo="Excluir de vez?"
          textoConfirmar="Excluir de vez"
          perigo
          onConfirmar={confirmar}
          onCancelar={() => setConfirmando(null)}
        >
          <p>
            {plural(qtdOcultos, "transação será apagada", "transações serão apagadas")} de
            todos os seus aparelhos ({escolhidosOcultos.map((m) => nomeMes(m.mes)).join(", ")}).
          </p>
          <p>
            Logo depois dá para desfazer, mas só até você fechar ou recarregar o app.
            Se tiver dúvida, exporte um backup antes.
          </p>
        </ConfirmarAcao>
      )}

    </section>
  )
}

export default LimparHistorico

import { useEffect, useMemo, useRef, useState } from "react"
import Icone from "./Icone"
import ConfirmarAcao from "./ConfirmarAcao"
import { brl, nomeMes } from "../utils/formatar"
import { agruparPorMes } from "../utils/historico"

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

function diaMes(data) {
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

// Caixa que aceita o estado "parcial" (alguns marcados, outros não)
function CaixaTriestado({ marcados, total, onAlternar, ...resto }) {
  return (
    <input
      type="checkbox"
      checked={total > 0 && marcados === total}
      ref={(el) => { if (el) el.indeterminate = marcados > 0 && marcados < total }}
      onChange={onAlternar}
      {...resto}
    />
  )
}

// Meses agrupados por ano. Cada mês abre e mostra as transações, uma a uma.
function ListaMeses({ grupos, marcados, onAlternarIds }) {

  const [abertos, setAbertos] = useState(new Set())

  const anos = [...new Set(grupos.map((g) => g.ano))]

  const contarMarcados = (itens) => itens.filter((t) => marcados.has(t.id)).length

  function alternarMesAberto(mes) {
    setAbertos((atual) => {
      const novo = new Set(atual)
      novo.has(mes) ? novo.delete(mes) : novo.add(mes)
      return novo
    })
  }

  return (
    <div className="lh-anos">
      {anos.map((ano) => {
        const doAno = grupos.filter((g) => g.ano === ano)
        const itensAno = doAno.flatMap((g) => g.itens)

        return (
          <fieldset key={ano} className="lh-ano">
            <legend>
              <label>
                <CaixaTriestado
                  marcados={contarMarcados(itensAno)}
                  total={itensAno.length}
                  onAlternar={() => onAlternarIds(
                    itensAno.map((t) => t.id),
                    contarMarcados(itensAno) !== itensAno.length
                  )}
                />
                <strong>{ano}</strong>
                <span> · todos os meses</span>
              </label>
            </legend>

            {doAno.map((g) => {
              const aberto = abertos.has(g.mes)
              const marcadosMes = contarMarcados(g.itens)

              return (
                <div key={g.mes} className="lh-grupo">

                  <div className="lh-mes">
                    <label>
                      <CaixaTriestado
                        marcados={marcadosMes}
                        total={g.itens.length}
                        aria-label={`Selecionar todas de ${nomeMes(g.mes)}`}
                        onAlternar={() => onAlternarIds(
                          g.itens.map((t) => t.id),
                          marcadosMes !== g.itens.length
                        )}
                      />
                      <span>{nomeMes(g.mes)}</span>
                    </label>

                    <button
                      type="button"
                      className="lh-abrir"
                      onClick={() => alternarMesAberto(g.mes)}
                      aria-expanded={aberto}
                    >
                      <small>
                        {marcadosMes > 0
                          ? `${marcadosMes} de ${g.itens.length}`
                          : plural(g.itens.length, "transação", "transações")}
                      </small>
                      <Icone nome="chevronBaixo" tamanho={16} className={aberto ? "gc-seta aberta" : "gc-seta"} />
                    </button>
                  </div>

                  {aberto && (
                    <ul className="lh-itens">
                      {g.itens.map((t) => (
                        <li key={t.id}>
                          <label>
                            <input
                              type="checkbox"
                              checked={marcados.has(t.id)}
                              onChange={() => onAlternarIds([t.id], !marcados.has(t.id))}
                            />
                            <span className="lh-item-texto">
                              <span className="lh-item-nome">{t.descricao}</span>
                              <small>{diaMes(t.data)}</small>
                            </span>
                            <span className={t.tipo === "entrada" ? "lh-valor entrada-texto" : "lh-valor saida-texto"}>
                              {t.tipo === "entrada" ? "+" : "-"}{brl(t.valor)}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}

                </div>
              )
            })}
          </fieldset>
        )
      })}
    </div>
  )
}

// "a", "b" e mais 3
function resumirNomes(itens) {
  const nomes = itens.slice(0, 3).map((t) => `"${t.descricao}"`)
  const resto = itens.length - nomes.length

  return resto > 0 ? `${nomes.join(", ")} e mais ${resto}` : nomes.join(", ")
}

function LimparHistorico({ transacoes, onOcultar, onRestaurar, onExcluirDeVez, onFechar }) {

  const botaoFechar = useRef(null)

  const [incluirCaixinha, setIncluirCaixinha] = useState(false)
  const [marcadosVisiveis, setMarcadosVisiveis] = useState(new Set())
  const [marcadosOcultos, setMarcadosOcultos] = useState(new Set())
  const [confirmando, setConfirmando] = useState(null) // "ocultar" | "excluir"

  const gruposVisiveis = useMemo(
    () => agruparPorMes(transacoes, { ocultas: false, incluirCaixinha }),
    [transacoes, incluirCaixinha]
  )

  const gruposOcultos = useMemo(
    () => agruparPorMes(transacoes, { ocultas: true, incluirCaixinha: true }),
    [transacoes]
  )

  const temCaixinha = useMemo(
    () => transacoes.some((t) => !t.oculta && t.categoria === "caixinha"),
    [transacoes]
  )

  // Só vale o que ainda existe na lista (depois de ocultar, a seleção some sozinha)
  const escolhidasVisiveis = gruposVisiveis.flatMap((g) => g.itens).filter((t) => marcadosVisiveis.has(t.id))
  const escolhidasOcultas = gruposOcultos.flatMap((g) => g.itens).filter((t) => marcadosOcultos.has(t.id))

  const totalOcultas = gruposOcultos.reduce((soma, g) => soma + g.itens.length, 0)

  useEffect(() => {
    botaoFechar.current?.focus()
  }, [])

  useEffect(() => {
    if (confirmando) {
      return
    }

    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        onFechar()
      }
    }

    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [confirmando, onFechar])

  function alternarIds(setter, ids, marcar) {
    setter((atual) => {
      const novo = new Set(atual)
      ids.forEach((id) => (marcar ? novo.add(id) : novo.delete(id)))
      return novo
    })
  }

  function confirmar() {
    const acao = confirmando
    setConfirmando(null)

    if (acao === "ocultar") {
      onOcultar(escolhidasVisiveis.map((t) => t.id))
      setMarcadosVisiveis(new Set())
    } else if (acao === "excluir") {
      onExcluirDeVez(escolhidasOcultas.map((t) => t.id))
      setMarcadosOcultos(new Set())
    }
  }

  function restaurar() {
    onRestaurar(escolhidasOcultas.map((t) => t.id))
    setMarcadosOcultos(new Set())
  }

  return (
    <>
    <div className="ajuda-fundo" onClick={onFechar}>
      <div
        className="ajuda-janela limpar-janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby="limpar-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >

        <div className="limpar-topo">
          <h2 id="limpar-titulo">
            Limpar histórico
            {totalOcultas > 0 && <small>{totalOcultas} oculta{totalOcultas === 1 ? "" : "s"}</small>}
          </h2>

          <button
            ref={botaoFechar}
            type="button"
            className="limpar-fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <Icone nome="adicionar" tamanho={20} className="limpar-x" />
          </button>
        </div>

        <div className="gc-corpo">

          <p className="lh-ajuda">
            Abra um mês para escolher as transações, ou marque o mês inteiro.{" "}
            <strong>Ocultar</strong> não apaga nada: elas saem das listas e dos
            totais, mas ficam guardadas e você pode restaurar quando quiser.
          </p>

          {gruposVisiveis.length === 0 ? (
            <p className="lh-vazio">
              {incluirCaixinha || !temCaixinha
                ? "Não há transações para ocultar."
                : "Só restam movimentações de caixinha, que ficam de fora por padrão. Marque a opção abaixo para incluí-las."}
            </p>
          ) : (
            <ListaMeses
              grupos={gruposVisiveis}
              marcados={marcadosVisiveis}
              onAlternarIds={(ids, marcar) => alternarIds(setMarcadosVisiveis, ids, marcar)}
            />
          )}

          {(gruposVisiveis.length > 0 || temCaixinha) && (
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
                Mostrar também movimentações de caixinhas
                <small>Não recomendado: ocultá-las muda o seu saldo.</small>
              </span>
            </label>
          )}

          {gruposVisiveis.length > 0 && (
            <button
              type="button"
              className="btn-salvar"
              disabled={escolhidasVisiveis.length === 0}
              onClick={() => setConfirmando("ocultar")}
            >
              {escolhidasVisiveis.length === 0
                ? "Ocultar transações selecionadas"
                : `Ocultar ${plural(escolhidasVisiveis.length, "transação", "transações")}`}
            </button>
          )}

          {gruposOcultos.length > 0 && (
            <div className="lh-ocultas">

              <strong>Ocultas ({totalOcultas})</strong>

              <ListaMeses
                grupos={gruposOcultos}
                marcados={marcadosOcultos}
                onAlternarIds={(ids, marcar) => alternarIds(setMarcadosOcultos, ids, marcar)}
              />

              <div className="form-acoes">
                <button
                  type="button"
                  className="btn-salvar"
                  disabled={escolhidasOcultas.length === 0}
                  onClick={restaurar}
                >
                  Restaurar
                </button>

                <button
                  type="button"
                  className="btn-perigo"
                  disabled={escolhidasOcultas.length === 0}
                  onClick={() => setConfirmando("excluir")}
                >
                  Excluir de vez
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>

    {confirmando === "ocultar" && (
      <ConfirmarAcao
        titulo="Ocultar transações?"
        textoConfirmar="Ocultar"
        onConfirmar={confirmar}
        onCancelar={() => setConfirmando(null)}
      >
        <p>
          {plural(escolhidasVisiveis.length, "transação vai", "transações vão")} sair
          das listas e dos totais: {resumirNomes(escolhidasVisiveis)}.
        </p>
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
          {plural(escolhidasOcultas.length, "transação será apagada", "transações serão apagadas")} de
          todos os seus aparelhos: {resumirNomes(escolhidasOcultas)}.
        </p>
        <p>
          Logo depois dá para desfazer, mas só até você fechar ou recarregar o app.
          Se tiver dúvida, exporte um backup antes.
        </p>
      </ConfirmarAcao>
    )}
    </>
  )
}

export default LimparHistorico

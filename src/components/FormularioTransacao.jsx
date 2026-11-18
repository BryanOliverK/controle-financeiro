import { useState } from "react"
import Icone from "./Icone"
import CampoEtiquetas from "./CampoEtiquetas"
import { categoriasPara } from "../utils/categorias"
import { brl, hojeLocal } from "../utils/formatar"
import { MAX_PARCELAS, dividirEmParcelas } from "../utils/parcelas"
import { LIMITE_DESCRICAO } from "../utils/validacao"
import { sugestoesDescricao } from "../utils/rapido"
import { infoCategoria } from "../utils/categorias"

const TIPOS = [
  { valor: "entrada", nome: "Entrada", icone: "setaEntrada" },
  { valor: "saida", nome: "Saída", icone: "setaSaida" }
]

// Formulário de nova transação / edição. Os campos ficam no App (prop "form"),
// assim o que foi digitado não se perde ao trocar de aba.
function FormularioTransacao({ form, editando, cartoes = [], contas = [], historico = [], etiquetasUsadas = [], onAlterar, onSalvar, onCancelar }) {

  const [focado, setFocado] = useState(false)
  const [ativa, setAtiva] = useState(-1)

  // Sugestões do que você já lançou (só em transação nova)
  const sugestoes = !editando && focado ? sugestoesDescricao(form.descricao, historico, 5) : []

  function aplicar(s) {
    onAlterar("tipo", s.tipo)
    onAlterar("categoria", s.categoria)
    onAlterar("valor", String(s.valor))
    onAlterar("contaId", s.contaId && contas.some((c) => c.id === s.contaId) ? s.contaId : "")
    onAlterar("descricao", s.descricao.slice(0, LIMITE_DESCRICAO))
    onAlterar("etiquetas", s.etiquetas || [])
    setAtiva(-1)
    setFocado(false)
  }

  function teclas(evento) {
    if (sugestoes.length === 0) return

    if (evento.key === "ArrowDown") {
      evento.preventDefault()
      setAtiva((i) => (i + 1) % sugestoes.length)
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault()
      setAtiva((i) => (i <= 0 ? sugestoes.length - 1 : i - 1))
    } else if (evento.key === "Enter" && ativa >= 0) {
      evento.preventDefault()
      aplicar(sugestoes[ativa])
    } else if (evento.key === "Escape") {
      setFocado(false)
    }
  }

  const categorias = categoriasPara(form.tipo)
  const diaDoMes = Number((form.data || hojeLocal()).split("-")[2])

  const podeParcelar = !editando && form.tipo === "saida"
  const quantidade = Math.floor(Number(form.parcelas))
  const valorTotal = Number(form.valor)

  const previaParcelas =
    form.parcelar && quantidade >= 2 && quantidade <= MAX_PARCELAS && valorTotal > 0
      ? dividirEmParcelas(valorTotal, quantidade)
      : null

  function enviar(evento) {
    evento.preventDefault()
    onSalvar()
  }

  return (
    <>
      <h2 className="titulo-secao">
        {editando ? "Editar transação" : "Nova transação"}
      </h2>

      <form className="formulario" onSubmit={enviar} noValidate>

        <div className="seg" role="radiogroup" aria-label="Tipo">
          {TIPOS.map((tipo) => (
            <button
              key={tipo.valor}
              type="button"
              role="radio"
              aria-checked={form.tipo === tipo.valor}
              className={`seg-op ${tipo.valor}${form.tipo === tipo.valor ? " ativo" : ""}`}
              onClick={() => onAlterar("tipo", tipo.valor)}
            >
              <Icone nome={tipo.icone} tamanho={18} />
              {tipo.nome}
            </button>
          ))}
        </div>

        <div className="campo-descricao">
          <input
            type="text"
            placeholder="Descrição"
            aria-label="Descrição"
            value={form.descricao}
            maxLength={LIMITE_DESCRICAO}
            autoComplete="off"
            role="combobox"
            aria-expanded={sugestoes.length > 0}
            aria-controls="lista-sugestoes"
            aria-autocomplete="list"
            aria-activedescendant={ativa >= 0 ? `sugestao-${ativa}` : undefined}
            onFocus={() => setFocado(true)}
            onBlur={() => { setFocado(false); setAtiva(-1) }}
            onKeyDown={teclas}
            onChange={(e) => {
              onAlterar("descricao", e.target.value.slice(0, LIMITE_DESCRICAO))
              setAtiva(-1)
            }}
          />

          {sugestoes.length > 0 && (
            <ul className="sugestoes" id="lista-sugestoes" role="listbox" aria-label="Já lançados antes">
              {sugestoes.map((s, i) => (
                <li
                  key={`${s.tipo}|${s.descricao}`}
                  id={`sugestao-${i}`}
                  role="option"
                  aria-selected={i === ativa}
                  className={i === ativa ? "sugestao ativa" : "sugestao"}
                  onMouseDown={(e) => { e.preventDefault(); aplicar(s) }}
                >
                  <span className="sugestao-nome">{s.descricao}</span>
                  <small>{infoCategoria(s.categoria)?.nome || ""}</small>
                  <strong className="valor-privado">{brl(s.valor)}</strong>
                </li>
              ))}
            </ul>
          )}

          <span
            className={
              form.descricao.length >= LIMITE_DESCRICAO
                ? "contador cheio"
                : "contador"
            }
          >
            {form.descricao.length}/{LIMITE_DESCRICAO}
          </span>
        </div>

        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="Valor (R$)"
          aria-label="Valor"
          value={form.valor}
          onChange={(e) => onAlterar("valor", e.target.value)}
        />

        <div className="campo-categoria">
          <span className="campo-rotulo" id="rotulo-categoria">Categoria</span>

          <div className="cat-grade" role="radiogroup" aria-labelledby="rotulo-categoria">
            {categorias.map(([chave, info]) => (
              <button
                key={chave}
                type="button"
                role="radio"
                aria-checked={form.categoria === chave}
                className={form.categoria === chave ? "cat-op ativo" : "cat-op"}
                style={{ "--cor": info.cor }}
                onClick={() => onAlterar("categoria", chave)}
              >
                <Icone nome={info.icone} tamanho={18} />
                {info.nome}
              </button>
            ))}
          </div>
        </div>

        <CampoEtiquetas
          valor={form.etiquetas || []}
          usadas={etiquetasUsadas}
          onChange={(lista) => onAlterar("etiquetas", lista)}
        />

        {contas.length > 0 && (
          <div className="campo-cartao">
            <label className="campo-rotulo" htmlFor="campo-conta">Conta</label>

            <select
              id="campo-conta"
              value={form.contaId}
              onChange={(e) => onAlterar("contaId", e.target.value)}
            >
              <option value="">Sem conta</option>

              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        )}

        {form.tipo === "saida" && cartoes.length > 0 && (
          <div className="campo-cartao">
            <label className="campo-rotulo" htmlFor="campo-cartao">Pagar com</label>

            <select
              id="campo-cartao"
              value={form.cartaoId}
              onChange={(e) => onAlterar("cartaoId", e.target.value)}
            >
              <option value="">À vista (dinheiro, Pix ou débito)</option>

              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  Cartão {c.nome} (fecha dia {c.fechamento}, vence dia {c.vencimento})
                </option>
              ))}
            </select>
          </div>
        )}

        {!editando && (
          <label className="campo-repetir">
            <input
              type="checkbox"
              checked={form.repetir}
              onChange={(e) => {
                onAlterar("repetir", e.target.checked)

                if (e.target.checked) {
                  onAlterar("parcelar", false)
                }
              }}
            />

            <span className="repetir-icone">
              <Icone nome="repetir" tamanho={18} />
            </span>

            <span className="repetir-texto">
              <strong>Repetir todo mês</strong>
              <small>
                Lança sozinho todo dia {diaDoMes}
                {diaDoMes > 28 && " (no último dia dos meses mais curtos)"}
              </small>
            </span>

            <span className="repetir-chave" aria-hidden="true" />
          </label>
        )}

        {podeParcelar && (
          <div className="campo-parcelar">
            <label className="campo-repetir">
              <input
                type="checkbox"
                checked={form.parcelar}
                onChange={(e) => {
                  onAlterar("parcelar", e.target.checked)

                  if (e.target.checked) {
                    onAlterar("repetir", false)
                  }
                }}
              />

              <span className="repetir-icone">
                <Icone nome="transacoes" tamanho={18} />
              </span>

              <span className="repetir-texto">
                <strong>Parcelar compra</strong>
                <small>Divide o valor em parcelas, uma por mês</small>
              </span>

              <span className="repetir-chave" aria-hidden="true" />
            </label>

            {form.parcelar && (
              <div className="parcelar-detalhe">
                <input
                  type="number"
                  inputMode="numeric"
                  min="2"
                  max={MAX_PARCELAS}
                  step="1"
                  aria-label="Número de parcelas"
                  value={form.parcelas}
                  onChange={(e) => onAlterar("parcelas", e.target.value)}
                />

                <span className="parcelar-previa" aria-live="polite">
                  {previaParcelas
                    ? `${quantidade}x de ${brl(previaParcelas[0])}`
                    : `Informe de 2 a ${MAX_PARCELAS} parcelas`}
                </span>
              </div>
            )}
          </div>
        )}

        <input
          type="date"
          aria-label="Data"
          value={form.data || hojeLocal()}
          onChange={(e) => onAlterar("data", e.target.value)}
        />

        <div className="form-acoes">
          <button type="submit" className="btn-salvar">
            {editando ? "Salvar alteração" : "Adicionar transação"}
          </button>

          {editando && (
            <button type="button" className="btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
          )}
        </div>

      </form>
    </>
  )
}

export default FormularioTransacao

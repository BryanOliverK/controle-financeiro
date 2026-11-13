import Icone from "./Icone"
import { categoriasPara } from "../utils/categorias"
import { hojeLocal } from "../utils/formatar"
import { LIMITE_DESCRICAO } from "../utils/validacao"

const TIPOS = [
  { valor: "entrada", nome: "Entrada", icone: "setaEntrada" },
  { valor: "saida", nome: "Saída", icone: "setaSaida" }
]

// Formulário de nova transação / edição. Os campos ficam no App (prop "form"),
// assim o que foi digitado não se perde ao trocar de aba.
function FormularioTransacao({ form, editando, onAlterar, onSalvar, onCancelar }) {

  const categorias = categoriasPara(form.tipo)

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
            onChange={(e) =>
              onAlterar("descricao", e.target.value.slice(0, LIMITE_DESCRICAO))
            }
          />

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

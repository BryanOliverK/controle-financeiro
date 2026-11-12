import { categoriasPara } from "../utils/categorias"
import { hojeLocal } from "../utils/formatar"
import { LIMITE_DESCRICAO } from "../utils/validacao"

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
          placeholder="Valor"
          aria-label="Valor"
          value={form.valor}
          onChange={(e) => onAlterar("valor", e.target.value)}
        />

        <select
          aria-label="Tipo"
          value={form.tipo}
          onChange={(e) => onAlterar("tipo", e.target.value)}
        >
          <option value="">Selecione o tipo</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

        <select
          aria-label="Categoria"
          value={form.categoria}
          onChange={(e) => onAlterar("categoria", e.target.value)}
        >
          <option value="">Selecione a Categoria</option>
          {categorias.map(([chave, info]) => (
            <option key={chave} value={chave}>{info.nome}</option>
          ))}
        </select>

        <input
          type="date"
          aria-label="Data"
          value={form.data || hojeLocal()}
          onChange={(e) => onAlterar("data", e.target.value)}
        />

        <button type="submit">
          {editando ? "Salvar Alteração" : "Adicionar Transação"}
        </button>

        {editando && (
          <button type="button" className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
        )}

      </form>
    </>
  )
}

export default FormularioTransacao

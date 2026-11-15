import { useState } from "react"
import Icone from "./Icone"
import {
  CORES_ESCOLHA,
  ICONES_ESCOLHA,
  LIMITE_NOME_CATEGORIA
} from "../utils/categorias"

const NOVA = { id: null, nome: "", icone: ICONES_ESCOLHA[0], cor: CORES_ESCOLHA[7] }

// Cria, edita e apaga as categorias do usuário.
function GerenciarCategorias({ categorias, existentes, onSalvar, onExcluir }) {

  const [aberto, setAberto] = useState(false)
  const [rascunho, setRascunho] = useState(NOVA)
  const [erro, setErro] = useState("")

  function alterar(campo, valor) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }))
    setErro("")
  }

  function salvar(evento) {
    evento.preventDefault()

    const nome = rascunho.nome.trim()

    if (nome === "") {
      setErro("Dê um nome para a categoria.")
      return
    }

    const repetida = existentes.some(
      (n) => n.chave !== rascunho.id && n.nome.toLowerCase() === nome.toLowerCase()
    )

    if (repetida) {
      setErro("Já existe uma categoria com esse nome.")
      return
    }

    onSalvar({ ...rascunho, nome })
    setRascunho(NOVA)
  }

  return (
    <section className="gerenciar-categorias">

      <button
        type="button"
        className="gc-titulo"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
      >
        <span>Minhas categorias{categorias.length > 0 && ` (${categorias.length})`}</span>
        <Icone nome="chevronBaixo" tamanho={18} className={aberto ? "gc-seta aberta" : "gc-seta"} />
      </button>

      {aberto && (
        <div className="gc-corpo">

          {categorias.length > 0 && (
            <ul className="gc-lista">
              {categorias.map((c) => (
                <li key={c.id}>
                  <span className="gc-bolinha" style={{ "--cor": c.cor }}>
                    <Icone nome={c.icone} tamanho={18} />
                  </span>

                  <span className="gc-nome">{c.nome}</span>

                  <button
                    type="button"
                    className="btn-editar"
                    onClick={() => setRascunho(c)}
                    aria-label={`Editar categoria ${c.nome}`}
                    title="Editar"
                  >
                    <Icone nome="editar" tamanho={16} />
                  </button>

                  <button
                    type="button"
                    className="btn-excluir"
                    onClick={() => onExcluir(c.id)}
                    aria-label={`Excluir categoria ${c.nome}`}
                    title="Excluir"
                  >
                    <Icone nome="lixeira" tamanho={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="gc-form" onSubmit={salvar} noValidate>

            <strong>{rascunho.id ? "Editar categoria" : "Nova categoria"}</strong>

            <input
              type="text"
              placeholder="Nome (ex.: Academia)"
              aria-label="Nome da categoria"
              value={rascunho.nome}
              maxLength={LIMITE_NOME_CATEGORIA}
              onChange={(e) => alterar("nome", e.target.value.slice(0, LIMITE_NOME_CATEGORIA))}
            />

            <div className="gc-grade" role="radiogroup" aria-label="Ícone">
              {ICONES_ESCOLHA.map((nome) => (
                <button
                  key={nome}
                  type="button"
                  role="radio"
                  aria-checked={rascunho.icone === nome}
                  aria-label={`Ícone ${nome}`}
                  className={rascunho.icone === nome ? "gc-icone ativo" : "gc-icone"}
                  onClick={() => alterar("icone", nome)}
                >
                  <Icone nome={nome} tamanho={20} />
                </button>
              ))}
            </div>

            <div className="gc-grade" role="radiogroup" aria-label="Cor">
              {CORES_ESCOLHA.map((cor) => (
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
                {rascunho.id ? "Salvar categoria" : "Criar categoria"}
              </button>

              {rascunho.id && (
                <button type="button" className="btn-cancelar" onClick={() => { setRascunho(NOVA); setErro("") }}>
                  Cancelar
                </button>
              )}
            </div>

          </form>

        </div>
      )}

    </section>
  )
}

export default GerenciarCategorias

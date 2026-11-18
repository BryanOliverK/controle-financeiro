import { useRef, useState } from "react"
import Icone from "./Icone"
import { categoriasPara, infoCategoria } from "../utils/categorias"
import { infoConta } from "../utils/contas"
import { extrairEtiquetas } from "../utils/etiquetas"
import { brl } from "../utils/formatar"
import { interpretarRapido, normalizar, sugerirCategoria, sugestoesDescricao } from "../utils/rapido"

const ERROS = {
  vazio: 'Digite algo como "mercado 85".',
  "sem-valor": 'Faltou o valor. Ex.: "mercado 85".',
  "sem-descricao": 'Faltou a descrição. Ex.: "mercado 85".',
  "valor-invalido": "Esse valor não é válido."
}

const virgula = (n) => String(n).replace(".", ",")

// Campo único para lançar rápido: "mercado 85" (saída), "+ salário 3000" (entrada).
// Mostra uma prévia do que vai ser lançado (a categoria dá para trocar) e Enter confirma.
function LancamentoRapido({ transacoes, onLancar }) {

  const [texto, setTexto] = useState("")
  const [erro, setErro] = useState("")
  const [escolha, setEscolha] = useState({ chave: "", categoria: "" })
  const campo = useRef(null)

  const r = interpretarRapido(texto)
  const chave = r.ok ? `${r.tipo}|${normalizar(r.descricao)}` : ""
  const palpite = r.ok ? sugerirCategoria(r.descricao, r.tipo, transacoes) : { categoria: "", contaId: "" }
  const categoria = r.ok && escolha.chave === chave ? escolha.categoria : palpite.categoria
  const conta = palpite.contaId && infoConta(palpite.contaId) ? palpite.contaId : ""

  // Ainda só escrevendo o nome: oferece o que você já lançou antes
  const sugestoes = !r.ok && r.motivo === "sem-valor"
    ? sugestoesDescricao(extrairEtiquetas(texto).texto.replace(/^[+\-−]\s*/, ""), transacoes, 3)
    : []

  function alterar(valor) {
    setTexto(valor.slice(0, 80))
    setErro("")
  }

  function enviar(evento) {
    evento.preventDefault()

    if (!r.ok) {
      setErro(ERROS[r.motivo] || ERROS.vazio)
      return
    }

    if (!categoria) {
      setErro("Escolha uma categoria.")
      return
    }

    onLancar({ descricao: r.descricao, valor: r.valor, tipo: r.tipo, categoria, contaId: conta, etiquetas: r.etiquetas || [] })

    setTexto("")
    setErro("")
    campo.current?.focus()
  }

  const info = categoria ? infoCategoria(categoria) : null

  return (
    <form className="rapido" onSubmit={enviar} noValidate>

      <div className="rapido-campo">
        <Icone nome="adicionar" tamanho={18} />

        <input
          ref={campo}
          type="text"
          value={texto}
          onChange={(e) => alterar(e.target.value)}
          placeholder='Lançamento rápido: "mercado 85 #casa" ou "+ salário 3000"'
          aria-label="Lançamento rápido"
          aria-describedby="rapido-ajuda"
          autoComplete="off"
          enterKeyHint="done"
        />

        <button type="submit" className={r.ok ? "rapido-enviar" : "rapido-enviar apagado"}>Lançar</button>
      </div>

      <div id="rapido-ajuda" className="rapido-ajuda" aria-live="polite">

        {r.ok && (
          <div className="rapido-previa">
            <span className={`rapido-tipo ${r.tipo}`}>{r.tipo === "entrada" ? "Entrada" : "Saída"}</span>
            <strong className="valor-privado">{brl(r.valor)}</strong>
            <span className="rapido-desc">{r.descricao}</span>

            <label className="rapido-cat">
              {info && <Icone nome={info.icone} tamanho={14} />}
              <select
                aria-label="Categoria"
                value={categoria}
                onChange={(e) => setEscolha({ chave, categoria: e.target.value })}
              >
                {!categoria && <option value="">Escolha…</option>}
                {categoriasPara(r.tipo).map(([c, i]) => <option key={c} value={c}>{i.nome}</option>)}
              </select>
            </label>

            {conta && <span className="rapido-conta">{infoConta(conta).nome}</span>}

            {(r.etiquetas || []).map((e) => <span key={e} className="etq-chip">#{e}</span>)}
          </div>
        )}

        {sugestoes.length > 0 && (
          <div className="rapido-sugestoes" role="group" aria-label="Sugestões do seu histórico">
            {sugestoes.map((s) => (
              <button
                key={`${s.tipo}|${s.descricao}`}
                type="button"
                className="rapido-sugestao"
                onClick={() => { alterar(`${s.tipo === "entrada" ? "+ " : ""}${s.descricao} ${virgula(s.valor)}${(s.etiquetas || []).map((e) => ` #${e}`).join("")}`); campo.current?.focus() }}
              >
                {s.descricao}
                <small className="valor-privado">{brl(s.valor)}</small>
              </button>
            ))}
          </div>
        )}

        {!r.ok && sugestoes.length === 0 && !erro && (
          <span className="rapido-dica">Escreva o que foi e quanto. Use + para entrada e #palavra para etiqueta. Enter lança.</span>
        )}

        {erro && <span className="rapido-erro" role="alert">{erro}</span>}
      </div>

    </form>
  )
}

export default LancamentoRapido

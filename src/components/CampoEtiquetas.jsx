import { useId, useState } from "react"
import Icone from "./Icone"
import {
  LIMITE_ETIQUETA, MAX_ETIQUETAS,
  adicionarEtiqueta, removerEtiqueta, sugestoesEtiqueta
} from "../utils/etiquetas"

// Campo de etiquetas: o que você digita vira uma "bolinha" ao apertar Enter,
// vírgula ou espaço. Embaixo aparecem as que você já usou antes.
// valor: lista atual. usadas: [{ nome, qtd }] (contarEtiquetas). onChange(novaLista).
function CampoEtiquetas({ valor, usadas = [], onChange }) {

  const [texto, setTexto] = useState("")
  const id = useId()
  const cheio = valor.length >= MAX_ETIQUETAS

  const sugestoes = cheio ? [] : sugestoesEtiqueta(usadas, valor, texto, 6)

  function confirmar(bruto = texto) {
    const nova = adicionarEtiqueta(valor, bruto)

    if (nova !== valor) {
      onChange(nova)
    }

    setTexto("")
  }

  function teclas(evento) {
    const { key } = evento

    if (key === "Enter" || key === "," || key === " ") {
      // Enter com o campo vazio segue para enviar o formulário
      if (key === "Enter" && texto.trim() === "") {
        return
      }

      evento.preventDefault()
      confirmar()
    } else if (key === "Backspace" && texto === "" && valor.length > 0) {
      onChange(valor.slice(0, -1))
    }
  }

  return (
    <div className="campo-etiquetas">
      <label className="campo-rotulo" htmlFor={id}>
        Etiquetas <small>(opcional, até {MAX_ETIQUETAS})</small>
      </label>

      <div className="etq-caixa">
        {valor.map((e) => (
          <span className="etq-chip" key={e}>
            #{e}
            <button
              type="button"
              className="etq-remover"
              onClick={() => onChange(removerEtiqueta(valor, e))}
              aria-label={`Remover etiqueta ${e}`}
            >
              <Icone nome="fechar" tamanho={12} />
            </button>
          </span>
        ))}

        <input
          id={id}
          type="text"
          value={texto}
          maxLength={LIMITE_ETIQUETA + 1}
          disabled={cheio}
          autoComplete="off"
          autoCapitalize="none"
          enterKeyHint="done"
          placeholder={cheio ? "Limite de etiquetas atingido" : valor.length === 0 ? "viagem, presente, trabalho…" : "Outra etiqueta"}
          aria-describedby={`${id}-ajuda`}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={teclas}
          onBlur={() => { if (texto.trim() !== "") confirmar() }}
        />
      </div>

      <span id={`${id}-ajuda`} className="sr-only">
        Digite uma palavra e aperte Enter, vírgula ou espaço para adicionar.
      </span>

      {sugestoes.length > 0 && (
        <div className="etq-sugestoes" role="group" aria-label="Etiquetas que você já usou">
          {sugestoes.map((nome) => (
            <button
              key={nome}
              type="button"
              className="etq-sugestao"
              onClick={() => confirmar(nome)}
            >
              #{nome}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CampoEtiquetas

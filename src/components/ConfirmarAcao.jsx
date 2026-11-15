import { useEffect, useRef } from "react"

// Janela de confirmação. O foco começa em "Cancelar", então apertar Enter sem
// querer não faz nada. Esc ou clique fora também cancelam.
function ConfirmarAcao({ titulo, children, textoConfirmar, perigo, onConfirmar, onCancelar }) {

  const cancelar = useRef(null)

  useEffect(() => {
    cancelar.current?.focus()

    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        onCancelar()
      }
    }

    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [onCancelar])

  return (
    <div className="ajuda-fundo" onClick={onCancelar}>
      <div
        className="ajuda-janela confirmar-janela"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="confirmar-titulo">{titulo}</h2>

        <div className="confirmar-texto">{children}</div>

        <div className="confirmar-botoes">
          <button ref={cancelar} type="button" className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>

          <button
            type="button"
            className={perigo ? "btn-confirmar perigo" : "btn-confirmar"}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmarAcao

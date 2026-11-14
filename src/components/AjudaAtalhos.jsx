import { useEffect, useRef } from "react"

export const ATALHOS = [
  { tecla: "N", texto: "Nova transação" },
  { tecla: "/", texto: "Buscar transações" },
  { tecla: "I", texto: "Ir para Início" },
  { tecla: "T", texto: "Ir para Transações" },
  { tecla: "G", texto: "Ir para Gráficos" },
  { tecla: "C", texto: "Ir para Caixinhas" },
  { tecla: "P", texto: "Mostrar ou ocultar valores" },
  { tecla: "D", texto: "Modo escuro ou claro" },
  { tecla: "?", texto: "Abrir esta ajuda" },
  { tecla: "Esc", texto: "Fechar esta janela" }
]

// Janela com a lista de atalhos. Esc ou clique fora fecham.
function AjudaAtalhos({ onFechar }) {

  const botao = useRef(null)

  useEffect(() => {
    botao.current?.focus()

    function aoTeclar(evento) {
      if (evento.key === "Escape") {
        onFechar()
      }
    }

    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [onFechar])

  return (
    <div className="ajuda-fundo" onClick={onFechar}>
      <div
        className="ajuda-janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ajuda-titulo"
        onClick={(evento) => evento.stopPropagation()}
      >
        <h2 id="ajuda-titulo">Atalhos de teclado</h2>

        <ul className="ajuda-lista">
          {ATALHOS.map((atalho) => (
            <li key={atalho.tecla}>
              <kbd>{atalho.tecla}</kbd>
              <span>{atalho.texto}</span>
            </li>
          ))}
        </ul>

        <button ref={botao} className="ajuda-fechar" onClick={onFechar}>
          Fechar
        </button>
      </div>
    </div>
  )
}

export default AjudaAtalhos

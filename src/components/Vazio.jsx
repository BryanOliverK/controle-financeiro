import Icone from "./Icone"

// Aviso de lista vazia, com ícone e texto amigável.
function Vazio({ icone = "outros", children }) {
  return (
    <div className="vazio">
      <span className="vazio-icone">
        <Icone nome={icone} tamanho={26} />
      </span>
      <p>{children}</p>
    </div>
  )
}

export default Vazio

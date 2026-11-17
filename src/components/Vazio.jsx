import Icone from "./Icone"

// Aviso de lista vazia: ícone, texto amigável e, se quiser, um botão do próximo passo.
// acao = { texto, onClick, icone? }
function Vazio({ icone = "outros", titulo, acao, children }) {
  return (
    <div className="vazio">
      <span className="vazio-icone">
        <Icone nome={icone} tamanho={26} />
      </span>

      {titulo && <strong className="vazio-titulo">{titulo}</strong>}

      <p>{children}</p>

      {acao && (
        <button type="button" className="vazio-acao" onClick={acao.onClick}>
          {acao.icone && <Icone nome={acao.icone} tamanho={16} />}
          {acao.texto}
        </button>
      )}
    </div>
  )
}

export default Vazio

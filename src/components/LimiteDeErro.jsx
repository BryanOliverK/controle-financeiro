import { Component } from "react"
import Icone from "./Icone"

const ehFalhaDeCarregamento = (erro) =>
  /dynamically imported module|Loading chunk|Failed to fetch|Importing a module script failed/i.test(String(erro?.message ?? erro))

function escuro() {
  try {
    return localStorage.getItem("modoEscuro") === "true"
  } catch {
    return false
  }
}

// Pega erros de tela para o app não ficar branco. compacto = só a aba (o menu continua);
// sem compacto = tela cheia (último recurso).
class LimiteDeErro extends Component {

  state = { erro: null, copiado: false }

  static getDerivedStateFromError(erro) {
    return { erro, copiado: false }
  }

  componentDidCatch(erro, info) {
    console.error("Erro na tela:", erro, info?.componentStack)
  }

  tentar = () => this.setState({ erro: null })

  copiar = async () => {
    const { erro } = this.state
    const texto = `${erro?.message ?? erro}\n\n${erro?.stack ?? ""}`

    try {
      await navigator.clipboard.writeText(texto)
      this.setState({ copiado: true })
    } catch {
      // sem permissão para copiar: os detalhes continuam visíveis para selecionar
    }
  }

  render() {
    const { erro, copiado } = this.state

    if (!erro) {
      return this.props.children
    }

    const falhaDeRede = ehFalhaDeCarregamento(erro)

    const titulo = falhaDeRede ? "Não foi possível carregar esta parte" : "Algo deu errado"

    const texto = falhaDeRede
      ? "Pode ser a internet ou uma versão nova do app. Recarregue a página para continuar."
      : "Seus dados continuam salvos. Tente de novo; se repetir, recarregue a página."

    if (this.props.compacto) {
      return (
        <div className="erro-aba" role="alert">
          <span className="erro-icone"><Icone nome="alerta" tamanho={22} /></span>
          <strong>{titulo}</strong>
          <p>{texto}</p>

          <div className="erro-botoes">
            <button type="button" className="btn-salvar" onClick={falhaDeRede ? () => window.location.reload() : this.tentar}>
              {falhaDeRede ? "Recarregar" : "Tentar de novo"}
            </button>
          </div>
        </div>
      )
    }

    return (
      <main className={escuro() ? "tela-erro modo-escuro" : "tela-erro"} role="alert">
        <div className="erro-card">
          <span className="erro-icone"><Icone nome="alerta" tamanho={28} /></span>
          <h1>{titulo}</h1>
          <p>{texto}</p>

          <div className="erro-botoes">
            <button type="button" className="btn-salvar" onClick={() => window.location.reload()}>Recarregar a página</button>
          </div>

          <details className="erro-detalhes">
            <summary>Detalhes técnicos</summary>
            <pre>{String(erro?.message ?? erro)}</pre>
            <button type="button" className="btn-cancelar" onClick={this.copiar}>{copiado ? "Copiado" : "Copiar detalhes"}</button>
          </details>
        </div>
      </main>
    )
  }
}

export default LimiteDeErro

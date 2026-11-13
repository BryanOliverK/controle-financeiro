import { useRef } from "react"
import Icone from "./Icone"

// Cartão de backup: baixa os dados em um arquivo e importa de volta.
function Backup({ onExportar, onImportar }) {

  const inputArquivo = useRef(null)

  function escolherArquivo(evento) {
    const arquivo = evento.target.files?.[0]

    // Limpa para poder escolher o mesmo arquivo de novo depois
    evento.target.value = ""

    if (arquivo) {
      onImportar(arquivo)
    }
  }

  return (
    <section className="backup">

      <div className="backup-texto">
        <h3>Backup dos seus dados</h3>
        <p>
          Baixe uma cópia de tudo (transações e caixinhas). Ao importar, só
          entra o que estiver faltando: nada do que você já tem é apagado.
        </p>
      </div>

      <div className="backup-acoes">
        <button className="btn-exportar" onClick={onExportar}>
          <Icone nome="baixar" tamanho={16} />
          Exportar backup
        </button>

        <button
          className="btn-exportar"
          onClick={() => inputArquivo.current?.click()}
        >
          <Icone nome="subir" tamanho={16} />
          Importar backup
        </button>

        <input
          ref={inputArquivo}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={escolherArquivo}
        />
      </div>

    </section>
  )
}

export default Backup

import Icone from "./Icone"
import Vazio from "./Vazio"
import { SEM_CATEGORIA, infoCategoria } from "../utils/categorias"
import { brl } from "../utils/formatar"

function Categorias({ gastosPorCategoria, totalGastos }) {

  const lista = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])

  if (lista.length === 0) {
    return <Vazio icone="graficos">Nenhum gasto registrado ainda.</Vazio>
  }

  // Cria os segmentos do gráfico (o início de cada um é a soma dos anteriores)
  let acumulado = 0

  const segmentos = lista.map(([chave, valor]) => {
    const info = infoCategoria(chave) || SEM_CATEGORIA

    const porcentagem = (valor / totalGastos) * 100
    const inicio = acumulado

    acumulado += porcentagem

    return {
      chave,
      valor,
      porcentagem,
      inicio,
      cor: info.cor,
      nome: info.nome,
      icone: info.icone
    }
  })

  // Cria o gradiente do gráfico
  const gradiente = segmentos
    .map((segmento) => {
      const fim = segmento.inicio + segmento.porcentagem

      return `${segmento.cor} ${segmento.inicio}% ${fim}%`
    })
    .join(", ")

  return (
    <div className="categorias-dashboard">

      <div className="categorias-grafico-card">

        <div
          className="grafico-rosca"
          role="img"
          aria-label="Gráfico de gastos por categoria"
          style={{
            background: `conic-gradient(${gradiente})`
          }}
        >
          <div className="grafico-centro">
            <span>Total</span>

            <strong>
              {brl(totalGastos)}
            </strong>
          </div>
        </div>

        <div className="categorias-legenda">

          {segmentos.map((segmento) => (
            <div
              className="legenda-item"
              key={segmento.chave}
            >

              <div className="legenda-nome">
                <span
                  className="legenda-icone"
                  style={{ "--cor": segmento.cor }}
                >
                  <Icone nome={segmento.icone} tamanho={18} />
                </span>

                <span>
                  {segmento.nome}
                </span>
              </div>

              <div className="legenda-valores">
                <strong>
                  {brl(segmento.valor)}
                </strong>

                <span>
                  {segmento.porcentagem.toFixed(1)}%
                </span>
              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}

export default Categorias

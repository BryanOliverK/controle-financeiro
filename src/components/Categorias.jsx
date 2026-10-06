const categorias = {
  alimentacao: { nome: "🍔 Alimentação", cor: "#f59e0b" },
  lazer: { nome: "🎮 Lazer", cor: "#8b5cf6" },
  casa: { nome: "🏠 Casa", cor: "#3b82f6" },
  transporte: { nome: "🚗 Transporte", cor: "#06b6d4" },
  salario: { nome: "💰 Salário", cor: "#22c55e" },
  educacao: { nome: "📚 Educação", cor: "#ec4899" },
  compras: { nome: "🛒 Compras", cor: "#f97316" },
  outros: { nome: "📦 Outros", cor: "#94a3b8" }
}

const semCategoria = {
  nome: "📦 Sem categoria",
  cor: "#94a3b8"
}

function formatar(valor) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2
  })
}

function Categorias({ gastosPorCategoria, totalGastos }) {

  const lista = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])

  if (lista.length === 0) {
    return (
      <p className="vazio">
        Nenhum gasto registrado ainda.
      </p>
    )
  }

  // Cria os segmentos do gráfico
  const segmentos = lista.map(([chave, valor], index) => {
    const info = categorias[chave] || semCategoria

    const porcentagem = (valor / totalGastos) * 100

    const inicio = lista
      .slice(0, index)
      .reduce((total, [, valorAnterior]) => {
        return total + (valorAnterior / totalGastos) * 100
      }, 0)

    return {
      chave,
      valor,
      porcentagem,
      inicio,
      cor: info.cor,
      nome: info.nome
    }
  })

  // Cria o gradiente do gráfico
  const gradiente = segmentos
    .map((segmento) => {
      const inicio = segmento.inicio
      const fim = segmento.inicio + segmento.porcentagem

      return `${segmento.cor} ${inicio}% ${fim}%`
    })
    .join(", ")

  return (
    <div className="categorias-dashboard">

      <div className="categorias-grafico-card">

        <div
          className="grafico-rosca"
          style={{
            background: `conic-gradient(${gradiente})`
          }}
        >
          <div className="grafico-centro">
            <span>Total</span>

            <strong>
              R$ {formatar(totalGastos)}
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
                  className="legenda-cor"
                  style={{
                    backgroundColor: segmento.cor
                  }}
                />

                <span>
                  {segmento.nome}
                </span>
              </div>

              <div className="legenda-valores">
                <strong>
                  R$ {formatar(segmento.valor)}
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
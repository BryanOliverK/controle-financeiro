import Icone from "./Icone"
import Vazio from "./Vazio"
import { brl } from "../utils/formatar"
import { resumoPorMes, rotuloMesCurto, variacao } from "../utils/comparacao"

const MESES = 6

// "+12% em relação a out" (seta e cor dependem de ser bom ou ruim)
function Variacao({ atual, anterior, rotulo, maisEhBom }) {

  const v = variacao(atual, anterior)

  if (v === null) {
    return <span className="cmp-variacao">sem base para comparar</span>
  }

  const subiu = v > 0.05
  const caiu = v < -0.05

  const classe = !subiu && !caiu
    ? "cmp-variacao"
    : subiu === maisEhBom
      ? "cmp-variacao bom"
      : "cmp-variacao ruim"

  return (
    <span className={classe}>
      {subiu && "▲ "}{caiu && "▼ "}
      {Math.abs(v).toFixed(0)}% {subiu ? "a mais" : caiu ? "a menos" : "igual"} que {rotulo}
    </span>
  )
}

// Barras de entradas e saídas dos últimos meses + variação do mês atual.
function ComparacaoMeses({ transacoes }) {

  const meses = resumoPorMes(transacoes, MESES)
  const maior = Math.max(...meses.flatMap((m) => [m.entradas, m.saidas]))

  if (maior <= 0) {
    return (
      <Vazio icone="graficos">
        Sem movimentações nos últimos {MESES} meses.
      </Vazio>
    )
  }

  const atual = meses[meses.length - 1]
  const anterior = meses[meses.length - 2]
  const rotuloAnterior = rotuloMesCurto(anterior.chave)

  // Altura em %, com um mínimo para valores pequenos continuarem visíveis
  const altura = (valor) => (valor > 0 ? Math.max((valor / maior) * 100, 3) : 0)

  return (
    <div className="cmp-card">

      <div className="cmp-topo">
        <h3>Últimos {MESES} meses</h3>

        <div className="cmp-legenda">
          <span><i className="cmp-ponto entrada" /> Entradas</span>
          <span><i className="cmp-ponto saida" /> Saídas</span>
        </div>
      </div>

      <div
        className="cmp-grade"
        role="img"
        aria-label={`Entradas e saídas dos últimos ${MESES} meses`}
      >
        {meses.map((m) => (
          <div className="cmp-mes" key={m.chave}>
            <div className="cmp-barras">
              <div
                className="cmp-barra entrada"
                style={{ height: `${altura(m.entradas)}%` }}
                title={`${rotuloMesCurto(m.chave)}: entradas ${brl(m.entradas)}`}
              />
              <div
                className="cmp-barra saida"
                style={{ height: `${altura(m.saidas)}%` }}
                title={`${rotuloMesCurto(m.chave)}: saídas ${brl(m.saidas)}`}
              />
            </div>
            <span className={m === atual ? "cmp-rotulo atual" : "cmp-rotulo"}>
              {rotuloMesCurto(m.chave)}
            </span>
          </div>
        ))}
      </div>

      <ul className="sr-only">
        {meses.map((m) => (
          <li key={m.chave}>
            {rotuloMesCurto(m.chave)}: entradas {brl(m.entradas)}, saídas {brl(m.saidas)}
          </li>
        ))}
      </ul>

      <div className="cmp-resumo">
        <div>
          <span className="cmp-resumo-titulo">
            <Icone nome="setaSaida" tamanho={14} /> Saídas este mês
          </span>
          <strong className="cmp-valor">{brl(atual.saidas)}</strong>
          <Variacao
            atual={atual.saidas}
            anterior={anterior.saidas}
            rotulo={rotuloAnterior}
            maisEhBom={false}
          />
        </div>

        <div>
          <span className="cmp-resumo-titulo">
            <Icone nome="setaEntrada" tamanho={14} /> Entradas este mês
          </span>
          <strong className="cmp-valor">{brl(atual.entradas)}</strong>
          <Variacao
            atual={atual.entradas}
            anterior={anterior.entradas}
            rotulo={rotuloAnterior}
            maisEhBom={true}
          />
        </div>
      </div>

    </div>
  )
}

export default ComparacaoMeses

import { useMemo, useState } from "react"
import Vazio from "./Vazio"
import { SEM_CATEGORIA, infoCategoria } from "../utils/categorias"
import { brl } from "../utils/formatar"
import { anosDisponiveis, resumoDoAno } from "../utils/resumoAnual"

const mesCurto = (m) => new Date(2000, m - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")
const mesLongo = (m) => new Date(2000, m - 1, 1).toLocaleDateString("pt-BR", { month: "long" })

// Resumo do ano: entradas e saídas mês a mês, totais e o que mais pesou.
function ResumoAnual({ transacoes }) {

  const anos = useMemo(() => anosDisponiveis(transacoes), [transacoes])
  const [escolhido, setEscolhido] = useState(() => new Date().getFullYear())

  const ano = anos.includes(escolhido) ? escolhido : anos[0]
  const r = useMemo(() => (ano ? resumoDoAno(transacoes, ano) : null), [transacoes, ano])

  if (!r) {
    return <Vazio icone="graficos">Quando você tiver transações, o resumo do ano aparece aqui.</Vazio>
  }

  const maximo = Math.max(1, ...r.meses.flatMap((m) => [m.entradas, m.saidas]))
  const sobrou = r.totais.saldo

  return (
    <div className="ano-card">

      <div className="ano-topo">
        <h3>Resumo de {ano}</h3>

        {anos.length > 1 && (
          <select value={ano} onChange={(e) => setEscolhido(Number(e.target.value))} aria-label="Ano do resumo">
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
      </div>

      <div className="ano-totais">
        <div><small>Entradas</small><strong className="valor-privado entrada">{brl(r.totais.entradas)}</strong></div>
        <div><small>Saídas</small><strong className="valor-privado saida">{brl(r.totais.saidas)}</strong></div>
        <div>
          <small>{sobrou >= 0 ? "Sobrou" : "Faltou"}</small>
          <strong className={`valor-privado ${sobrou >= 0 ? "entrada" : "saida"}`}>{brl(Math.abs(sobrou))}</strong>
        </div>
        <div>
          <small>Guardado do que entrou</small>
          <strong>{r.taxaPoupanca === null ? "—" : `${Math.round(r.taxaPoupanca)}%`}</strong>
        </div>
      </div>

      <div
        className="ano-grafico"
        role="img"
        aria-label={`Gráfico de entradas e saídas por mês em ${ano}. A tabela abaixo tem os mesmos valores.`}
      >
        {r.meses.map((m) => (
          <div
            key={m.mes}
            className="ano-coluna"
            title={`${mesLongo(m.mes)}: entrou ${brl(m.entradas)}, saiu ${brl(m.saidas)}`}
          >
            <div className="ano-barras">
              <span className="ano-barra entrada" style={{ height: `${(m.entradas / maximo) * 100}%` }} />
              <span className="ano-barra saida" style={{ height: `${(m.saidas / maximo) * 100}%` }} />
            </div>
            <span className="ano-rotulo">{mesCurto(m.mes)}</span>
          </div>
        ))}
      </div>

      <div className="ano-legenda" aria-hidden="true">
        <span><i className="entrada" /> Entradas</span>
        <span><i className="saida" /> Saídas</span>
      </div>

      <ul className="ano-destaques">
        {r.mesesComMovimento > 0 && (
          <li>Média de gasto por mês: <b className="valor-privado">{brl(r.mediaSaidas)}</b> <small>({r.mesesComMovimento} {r.mesesComMovimento === 1 ? "mês" : "meses"} com movimento)</small></li>
        )}
        {r.maiorGasto && (
          <li>Mês de maior gasto: <b>{mesLongo(r.maiorGasto.mes)}</b> · <b className="valor-privado">{brl(r.maiorGasto.valor)}</b></li>
        )}
      </ul>

      {r.topCategorias.length > 0 && (
        <div className="ano-categorias">
          <h4>O que mais pesou</h4>

          {r.topCategorias.map((c) => {
            const info = infoCategoria(c.categoria) || SEM_CATEGORIA

            return (
              <div className="ano-cat" key={c.categoria}>
                <span className="ano-cat-nome">{info.nome}</span>
                <div className="ano-cat-barra"><span style={{ width: `${c.porcentagem}%`, background: info.cor }} /></div>
                <span className="ano-cat-valor valor-privado">{brl(c.valor)} <small>{Math.round(c.porcentagem)}%</small></span>
              </div>
            )
          })}
        </div>
      )}

      <details className="ano-tabela">
        <summary>Ver mês a mês em tabela</summary>

        <table>
          <thead>
            <tr><th scope="col">Mês</th><th scope="col">Entradas</th><th scope="col">Saídas</th><th scope="col">Saldo</th></tr>
          </thead>
          <tbody>
            {r.meses.map((m) => (
              <tr key={m.mes}>
                <th scope="row">{mesLongo(m.mes)}</th>
                <td className="valor-privado">{brl(m.entradas)}</td>
                <td className="valor-privado">{brl(m.saidas)}</td>
                <td className="valor-privado">{brl(m.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

    </div>
  )
}

export default ResumoAnual

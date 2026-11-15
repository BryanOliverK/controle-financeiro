import Icone from "./Icone"
import { brl } from "../utils/formatar"

// Card do Início: quanto deve sobrar (ou faltar) no fim do mês.
function Previsao({ previsao }) {

  const { saldoHoje, saldoPrevisto, diasRestantes, gastoProjetado, saidasPendentes, entradasPendentes, dadosSuficientes } = previsao

  const negativo = saldoPrevisto < 0

  return (
    <section className={negativo ? "previsao negativa" : "previsao"} aria-label="Previsão do mês">

      <div className="previsao-topo">
        <span className="previsao-icone"><Icone nome={negativo ? "alvo" : "calendario"} tamanho={18} /></span>
        <h3>Previsão para o fim do mês</h3>
      </div>

      <p className="previsao-valor valor-privado">{brl(saldoPrevisto)}</p>

      <p className="previsao-texto">
        {negativo
          ? "No ritmo atual, o mês deve terminar no vermelho."
          : "É quanto deve sobrar até o fim do mês, se o ritmo continuar."}
      </p>

      <ul className="previsao-linhas">
        <li>
          <span>Saldo hoje</span>
          <strong className="valor-privado">{brl(saldoHoje)}</strong>
        </li>

        {saidasPendentes > 0 && (
          <li>
            <span>Mensais ainda a lançar (saídas)</span>
            <strong className="valor-privado">-{brl(saidasPendentes)}</strong>
          </li>
        )}

        {entradasPendentes > 0 && (
          <li>
            <span>Mensais ainda a receber</span>
            <strong className="valor-privado">+{brl(entradasPendentes)}</strong>
          </li>
        )}

        <li>
          <span>
            {dadosSuficientes
              ? `Gastos do dia a dia (${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"} restantes)`
              : "Gastos do dia a dia"}
          </span>
          <strong className="valor-privado">
            {dadosSuficientes ? `-${brl(gastoProjetado)}` : "poucos dados ainda"}
          </strong>
        </li>
      </ul>

    </section>
  )
}

export default Previsao

import { useEffect, useState } from "react"

const ETAPAS = ["Verificando seu login", "Sincronizando seus dados"]

// Quanto da barra fica cheia em cada etapa (a 2ª só termina quando os dados chegam)
const PROGRESSO = [30, 75]

const SEGUNDOS_ATE_AVISO = 8

// Tela mostrada enquanto o app confere o login e baixa os dados da nuvem.
// etapa: 0 = verificando login, 1 = sincronizando dados.
function TelaCarregando({ etapa = 0, modoEscuro }) {

  const [demorando, setDemorando] = useState(false)
  const [largura, setLargura] = useState(0)

  const alvo = PROGRESSO[etapa] ?? 100

  // Passou do normal: avisa que ainda está tentando
  useEffect(() => {
    const timer = setTimeout(() => setDemorando(true), SEGUNDOS_ATE_AVISO * 1000)
    return () => clearTimeout(timer)
  }, [])

  // A barra cresce até o alvo da etapa (começa em 0 para animar na entrada)
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setLargura(alvo))
    return () => cancelAnimationFrame(quadro)
  }, [alvo])

  return (
    <div
      className={modoEscuro ? "tela-carregando modo-escuro" : "tela-carregando"}
      role="status"
      aria-live="polite"
    >
      <div className="carregando-card">

        <span className="carregando-icone">💰</span>

        <h1>Controle Financeiro</h1>

        <div
          className="carregando-barra"
          role="progressbar"
          aria-label="Progresso do carregamento"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={alvo}
        >
          <div className="carregando-progresso" style={{ width: `${largura}%` }} />
        </div>

        <ul className="carregando-etapas">
          {ETAPAS.map((nome, indice) => {
            const estado = indice < etapa ? "feita" : indice === etapa ? "atual" : ""

            return (
              <li key={nome} className={estado}>
                <span className="carregando-marca" aria-hidden="true">
                  {estado === "feita" ? "✓" : ""}
                </span>
                {nome}
              </li>
            )
          })}
        </ul>

        <p className="carregando-dica">
          {demorando
            ? "Está demorando mais que o normal. Confira sua conexão e se algum bloqueador de anúncios está ativo para este site."
            : "Só um instante, estamos buscando seus dados."}
        </p>

      </div>
    </div>
  )
}

export default TelaCarregando

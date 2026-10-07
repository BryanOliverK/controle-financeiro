import { useEffect, useState } from "react"

const EMOJIS = ["🐷", "💰", "✈️", "🏠", "🚗", "🎓", "🛡️", "🎁"]
const DIAS_UTEIS_MES = 21

// Fica fora do componente para o React não reclamar de função "impura" no render
function agora() {
  return new Date()
}

function brl(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

// IR regressivo da renda fixa
function aliquotaIR(dias) {
  if (dias <= 180) return 0.225
  if (dias <= 360) return 0.2
  if (dias <= 720) return 0.175
  return 0.15
}

function taxaMensal(taxaAnual) {
  return Math.pow(1 + taxaAnual, DIAS_UTEIS_MES / 252) - 1
}

function simular(valor, taxaAnual, meses) {
  const bruto = valor * (Math.pow(1 + taxaAnual, (meses * DIAS_UTEIS_MES) / 252) - 1)
  const imposto = bruto * aliquotaIR(meses * 30)
  return { bruto, imposto, liquido: bruto - imposto }
}

function mesesAte(data) {
  const dias = (new Date(data + "T12:00:00") - agora()) / 86400000
  return Math.ceil(dias / 30)
}

function taxaLiquidaMensal(taxaAnual, meses) {
  return taxaMensal(taxaAnual) * (1 - aliquotaIR(meses * 30))
}

// Quanto guardar por mês para atingir a meta, já contando o rendimento
function aporteNecessario(saldo, alvo, meses, taxaAnual) {
  const i = taxaLiquidaMensal(taxaAnual, meses)
  const fator = Math.pow(1 + i, meses)
  const faltando = alvo - saldo * fator

  if (faltando <= 0) return 0
  if (i === 0) return faltando / meses

  return (faltando * i) / (fator - 1)
}

function projetar(saldo, aporte, meses, taxaAnual) {
  const i = taxaLiquidaMensal(taxaAnual, meses)
  const fator = Math.pow(1 + i, meses)

  if (i === 0) return saldo + aporte * meses

  return saldo * fator + (aporte * (fator - 1)) / i
}

function plural(n) {
  return n === 1 ? "mês" : "meses"
}

function CaixinhaCard({ caixinha, taxaAnual, onMovimentar, onExcluir }) {

  const [valorMov, setValorMov] = useState("")
  const [extra, setExtra] = useState("")

  const meta = caixinha.meta
  const progresso = meta ? Math.min(100, (caixinha.saldo / meta.valor) * 100) : 0
  const meses = meta ? mesesAte(meta.data) : 0

  const aporte = meta && meses > 0
    ? aporteNecessario(caixinha.saldo, meta.valor, meses, taxaAnual)
    : 0

  const projecao = meta && meses > 0 && extra !== ""
    ? projetar(caixinha.saldo, Number(extra), meses, taxaAnual)
    : null

  function mover(tipo) {
    onMovimentar(caixinha.id, tipo, Number(valorMov))
    setValorMov("")
  }

  return (
    <div className="cx-card">

      <div className="cx-topo">
        <div className="cx-nome">
          <span className="cx-emoji">{caixinha.emoji}</span>
          {caixinha.nome}
        </div>

        <button className="cx-excluir" onClick={() => onExcluir(caixinha.id)}>
          Excluir
        </button>
      </div>

      <strong className="cx-saldo cx-valor">{brl(caixinha.saldo)}</strong>

      {meta && (
        <div className="cx-meta">
          <div className="cx-meta-topo">
            <span>
              Meta: <b className="cx-valor">{brl(meta.valor)}</b> até{" "}
              {new Date(meta.data + "T12:00:00").toLocaleDateString("pt-BR")}
            </span>
            <span>{progresso.toFixed(0)}%</span>
          </div>

          <div className="cx-barra">
            <div className="cx-progresso" style={{ width: `${progresso}%` }} />
          </div>

          {caixinha.saldo >= meta.valor ? (
            <p className="cx-info">🎉 Meta atingida!</p>
          ) : meses <= 0 ? (
            <p className="cx-info">O prazo da meta já passou.</p>
          ) : aporte === 0 ? (
            <p className="cx-info">✅ Só com o rendimento você já chega lá.</p>
          ) : (
            <p className="cx-info">
              Para chegar lá, guarde cerca de{" "}
              <b className="cx-valor">{brl(aporte)}</b> por mês ({meses} {plural(meses)}).
            </p>
          )}

          {meses > 0 && caixinha.saldo < meta.valor && (
            <label className="cx-extra">
              <span>E se eu guardar por mês:</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="R$ 0,00"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
              />
            </label>
          )}

          {projecao !== null && (
            <p className="cx-info">
              Você chegaria a <b className="cx-valor">{brl(projecao)}</b>{" "}
              {projecao >= meta.valor
                ? "✅ meta batida"
                : <>· faltariam <b className="cx-valor">{brl(meta.valor - projecao)}</b></>}
            </p>
          )}
        </div>
      )}

      <div className="cx-mov">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="Valor"
          value={valorMov}
          onChange={(e) => setValorMov(e.target.value)}
        />
        <button className="cx-guardar" onClick={() => mover("guardar")}>Guardar</button>
        <button className="cx-retirar" onClick={() => mover("retirar")}>Retirar</button>
      </div>

      <div className="cx-sim">
        <span className="cx-sim-titulo">Rendimento estimado (líquido de IR)</span>

        <div className="cx-sim-grade">
          {[1, 2, 6, 12].map((m) => (
            <div className="cx-sim-item" key={m}>
              <span>{m} {plural(m)}</span>
              <strong className="cx-valor">
                +{brl(simular(caixinha.saldo, taxaAnual, m).liquido)}
              </strong>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function Caixinhas({ caixinhas, onCriar, onMovimentar, onExcluir }) {

  const [cdi, setCdi] = useState(() => localStorage.getItem("cdi") || "14.5")
  const [pctCdi, setPctCdi] = useState(() => localStorage.getItem("pctCdi") || "100")

  const [nome, setNome] = useState("")
  const [emoji, setEmoji] = useState("🐷")
  const [metaValor, setMetaValor] = useState("")
  const [metaData, setMetaData] = useState("")

  useEffect(() => {
    localStorage.setItem("cdi", cdi)
  }, [cdi])

  useEffect(() => {
    localStorage.setItem("pctCdi", pctCdi)
  }, [pctCdi])

  const taxaAnual = (Number(cdi) / 100) * (Number(pctCdi) / 100)

  function criar() {
    const ok = onCriar({ nome, emoji, metaValor, metaData })

    if (ok) {
      setNome("")
      setMetaValor("")
      setMetaData("")
    }
  }

  return (
    <>
      <div className="cx-config">
        <label>
          <span>CDI atual (% ao ano)</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={cdi}
            onChange={(e) => setCdi(e.target.value)}
          />
        </label>

        <label>
          <span>% do CDI no seu banco</span>
          <input
            type="number"
            inputMode="decimal"
            step="1"
            value={pctCdi}
            onChange={(e) => setPctCdi(e.target.value)}
          />
        </label>
      </div>

      <div className="cx-nova">
        <h3>Nova caixinha</h3>

        <div className="cx-emojis">
          {EMOJIS.map((e) => (
            <button
              key={e}
              className={e === emoji ? "cx-emoji-btn ativo" : "cx-emoji-btn"}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="cx-nova-campos">
          <input
            type="text"
            placeholder="Nome (ex: Viagem)"
            maxLength={30}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="Meta em R$ (opcional)"
            value={metaValor}
            onChange={(e) => setMetaValor(e.target.value)}
          />
          <input
            type="date"
            value={metaData}
            onChange={(e) => setMetaData(e.target.value)}
          />
          <button onClick={criar}>Criar caixinha</button>
        </div>
      </div>

      {caixinhas.length === 0 && (
        <p className="vazio">Nenhuma caixinha ainda. Crie a primeira acima.</p>
      )}

      <div className="cx-lista">
        {caixinhas.map((caixinha) => (
          <CaixinhaCard
            key={caixinha.id}
            caixinha={caixinha}
            taxaAnual={taxaAnual}
            onMovimentar={onMovimentar}
            onExcluir={onExcluir}
          />
        ))}
      </div>

      <p className="cx-aviso-legal">
        Valores estimados: consideram 21 dias úteis por mês e o IR regressivo da
        renda fixa. O rendimento real varia conforme o CDI e as regras do seu banco.
      </p>
    </>
  )
}

export default Caixinhas

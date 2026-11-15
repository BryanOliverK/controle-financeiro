import Icone from "./Icone"
import Vazio from "./Vazio"

const ICONES = {
  fatura: "transacoes",
  compromisso: "calendario",
  orcamento: "alvo",
  previsao: "graficos",
  novidade: "estrela"
}

const DESTINOS = {
  planejar: "Abrir Planejar",
  graficos: "Ver orçamentos",
  inicio: "Ver previsão"
}

function Cartao({ aviso, lido, onMarcar, onAbrir }) {
  return (
    <li className={`aviso-card ${aviso.nivel}${lido ? " lido" : ""}`}>

      <span className="aviso-icone"><Icone nome={ICONES[aviso.tipo] || "sino"} tamanho={20} /></span>

      <div className="aviso-corpo">
        <strong>{aviso.titulo}</strong>
        <p>{aviso.texto}</p>

        <div className="aviso-botoes">
          {aviso.destino && (
            <button type="button" className="aviso-abrir" onClick={() => onAbrir(aviso.destino)}>
              {DESTINOS[aviso.destino]}
            </button>
          )}

          {!lido && (
            <button type="button" className="aviso-lido" onClick={() => onMarcar([aviso.id])}>
              Marcar como lido
            </button>
          )}
        </div>
      </div>

    </li>
  )
}

// Aba Avisos: o que precisa de atenção, e as novidades do app.
function Avisos({ avisos, lidos, atualizacaoDisponivel, onAtualizar, onMarcar, onAbrir }) {

  const novos = avisos.filter((a) => !lidos.has(a.id))
  const jaLidos = avisos.filter((a) => lidos.has(a.id))

  return (
    <section className="avisos">

      <div className="secao-topo">
        <h2 className="titulo-secao">Avisos</h2>

        {novos.length > 0 && (
          <button type="button" className="link-ver-todas" onClick={() => onMarcar(novos.map((a) => a.id))}>
            Marcar todos como lidos
          </button>
        )}
      </div>

      {atualizacaoDisponivel && (
        <div className="aviso-card info atualizacao" role="status">
          <span className="aviso-icone"><Icone nome="subir" tamanho={20} /></span>

          <div className="aviso-corpo">
            <strong>Nova versão disponível</strong>
            <p>O app foi atualizado. Recarregue para usar a versão mais recente (seus dados não são afetados).</p>

            <div className="aviso-botoes">
              <button type="button" className="aviso-abrir primario" onClick={onAtualizar}>
                Atualizar agora
              </button>
            </div>
          </div>
        </div>
      )}

      {novos.length === 0 && !atualizacaoDisponivel && (
        <Vazio icone="sino">
          Tudo em dia. Quando algo estiver para vencer, aparece aqui.
        </Vazio>
      )}

      {novos.length > 0 && (
        <ul className="aviso-lista">
          {novos.map((a) => (
            <Cartao key={a.id} aviso={a} lido={false} onMarcar={onMarcar} onAbrir={onAbrir} />
          ))}
        </ul>
      )}

      {jaLidos.length > 0 && (
        <details className="avisos-lidos">
          <summary>Já lidos ({jaLidos.length})</summary>

          <ul className="aviso-lista">
            {jaLidos.map((a) => (
              <Cartao key={a.id} aviso={a} lido onMarcar={onMarcar} onAbrir={onAbrir} />
            ))}
          </ul>
        </details>
      )}

    </section>
  )
}

export default Avisos

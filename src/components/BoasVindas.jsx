import Icone from "./Icone"

const PASSOS = [
  { icone: "adicionar", titulo: "Lance suas transações", texto: "Entradas e saídas, com categoria. Marque \"Repetir todo mês\" para salário e contas fixas." },
  { icone: "alvo", titulo: "Defina orçamentos", texto: "Na aba Gráficos, escolha quanto quer gastar por categoria e receba avisos." },
  { icone: "caixinha", titulo: "Crie caixinhas", texto: "Guarde dinheiro para objetivos e veja quanto precisa juntar por mês." }
]

// Cartão de primeira vez, dispensável.
function BoasVindas({ onComecar, onDispensar }) {
  return (
    <section className="boas-vindas" aria-label="Boas-vindas">

      <h2>Bem-vindo ao Controle Financeiro</h2>
      <p>Três passos para organizar seu dinheiro:</p>

      <ol className="boas-passos">
        {PASSOS.map((passo) => (
          <li key={passo.titulo}>
            <span className="boas-icone">
              <Icone nome={passo.icone} tamanho={20} />
            </span>
            <div>
              <strong>{passo.titulo}</strong>
              <span>{passo.texto}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="boas-acoes">
        <button className="btn-salvar" onClick={onComecar}>Adicionar a primeira transação</button>
        <button className="btn-cancelar" onClick={onDispensar}>Agora não</button>
      </div>

    </section>
  )
}

export default BoasVindas

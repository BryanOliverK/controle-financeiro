import { useState } from "react"

// Menu lateral (no celular vira um botão que abre para cima).
function Sidebar({ abas, aba, onMudar }) {

  const [aberto, setAberto] = useState(false)

  const abaAtual = abas.find((item) => item.id === aba) ?? abas[0]

  return (
    <aside className={aberto ? "sidebar aberto" : "sidebar"}>

      <div
        className="menu-fundo"
        onClick={() => setAberto(false)}
      />

      <button
        className="menu-toggle"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
      >
        <span className="sidebar-icone" key={aba}>{abaAtual.icone}</span>
        <span className="menu-seta">⌄</span>
      </button>

      <nav className="menu-lista">
        <div className="menu-lista-interno">
          {abas.map((item) => (
            <button
              key={item.id}
              className={aba === item.id ? "sidebar-item ativo" : "sidebar-item"}
              onClick={() => {
                onMudar(item.id)
                setAberto(false)
              }}
              aria-current={aba === item.id ? "page" : undefined}
            >
              <span className="sidebar-icone">{item.icone}</span>
              <span className="sidebar-nome">{item.nome}</span>
            </button>
          ))}
        </div>
      </nav>

    </aside>
  )
}

export default Sidebar

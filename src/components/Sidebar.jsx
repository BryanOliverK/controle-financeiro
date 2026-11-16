import Icone from "./Icone"
import { useState } from "react"

// Menu lateral. Muda conforme a tela:
//  - computador largo: menu expandido (ícone ao lado do nome);
//  - computador/tablet: coluna estreita (nome embaixo do ícone);
//  - janela baixa: tudo encolhe, e o que não couber rola, com o Perfil sempre visível;
//  - celular: botão que abre a lista para cima.
// Cada item pode ter: grupo (itens do mesmo grupo ficam juntos), destaque (botão
// principal), rodape (fixo embaixo) e avatar (foto ou iniciais no lugar do ícone).
function Sidebar({ abas, aba, onMudar }) {

  const [aberto, setAberto] = useState(false)

  const abaAtual = abas.find((item) => item.id === aba) ?? abas[0]
  const totalSelos = abas.reduce((soma, item) => soma + (item.selo || 0), 0)

  function classes(item, i) {
    const lista = ["sidebar-item"]

    if (aba === item.id) lista.push("ativo")
    if (item.destaque) lista.push("destaque")
    if (item.rodape) lista.push("rodape")
    if (i > 0 && !item.rodape && !item.destaque && abas[i - 1].grupo !== item.grupo) lista.push("inicio-grupo")

    return lista.join(" ")
  }

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
        <span className="sidebar-icone" key={aba}><Icone nome={abaAtual.icone} tamanho={22} traco={1.6} /></span>
        {totalSelos > 0 && !aberto && <span className="menu-ponto" aria-label="Há avisos novos" />}
        <span className="menu-seta"><Icone nome="chevronBaixo" tamanho={16} /></span>
      </button>

      <nav className="menu-lista" aria-label="Menu principal">
        <div className="menu-lista-interno">
          {abas.map((item, i) => (
            <button
              key={item.id}
              className={classes(item, i)}
              onClick={() => {
                onMudar(item.id)
                setAberto(false)
              }}
              aria-current={aba === item.id ? "page" : undefined}
              title={item.nome}
            >
              <span className="sidebar-icone">
                {item.avatar ? (
                  <span className="sidebar-avatar" aria-hidden="true">
                    {item.avatar.foto ? (
                      <img src={item.avatar.foto} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      item.avatar.iniciais
                    )}
                  </span>
                ) : (
                  <Icone nome={item.icone} tamanho={22} traco={1.6} />
                )}

                {item.selo > 0 && (
                  <span className="sidebar-selo" aria-label={`${item.selo} não lidos`}>
                    {item.selo > 9 ? "9+" : item.selo}
                  </span>
                )}
              </span>
              <span className="sidebar-nome">{item.nome}</span>
            </button>
          ))}
        </div>
      </nav>

    </aside>
  )
}

export default Sidebar

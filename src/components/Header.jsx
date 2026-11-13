import Icone from "./Icone"


function Header({ children }) {
    return (
        <header className="header">
            <div className="header-marca">
                <span className="header-icone"><Icone nome="carteira" tamanho={26} /></span>
                <div>
                    <h1>Controle Financeiro</h1>
                    <p>Organize suas finanças de forma simples.</p>
                </div>
            </div>
            {children}
        </header>
    )
}

export default Header

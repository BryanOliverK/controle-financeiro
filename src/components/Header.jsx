function Header({ children }) {
    return (
        <header className="header">
            <div className="header-marca">
                <span className="header-icone">💰</span>
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

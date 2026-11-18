// Esqueleto mostrado por um instante enquanto uma aba (carregada sob demanda) chega.
function CarregandoAba() {
  return (
    <div className="aba-carregando" role="status" aria-label="Carregando">
      <span className="esq-bloco esq-titulo" />
      <span className="esq-bloco esq-card" />
      <span className="esq-bloco esq-linha" />
      <span className="esq-bloco esq-linha" />
    </div>
  )
}

export default CarregandoAba

// Relatório do mês para salvar como PDF: monta uma página HTML própria para
// impressão e abre a janela de impressão do navegador (opção "Salvar como PDF").

import { brl } from "./formatar"

// Tudo que vem do usuário passa por aqui antes de entrar no HTML
export function escaparHtml(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function dataCurta(iso) {
  return new Date(iso).toLocaleDateString("pt-BR")
}

const ESTILO = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px; font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif; color: #16211e; font-size: 13px; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  h2 { margin: 28px 0 10px; font-size: 15px; }
  .sub { color: #5f6f6a; margin: 0 0 24px; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .card { border: 1px solid #e3e8e6; border-radius: 10px; padding: 14px 16px; }
  .card span { display: block; color: #5f6f6a; font-size: 12px; margin-bottom: 6px; }
  .card strong { font-size: 20px; }
  .entrada { color: #178a5a; } .saida { color: #d1432f; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #e3e8e6; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #5f6f6a; }
  td.valor, th.valor { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  tr { break-inside: avoid; }
  .rodape { margin-top: 28px; color: #8a9893; font-size: 11px; }
  @page { size: A4; margin: 14mm; }
  @media print { body { padding: 0; } }
`

// categorias: [{ nome, valor, porcentagem }]
// transacoes: [{ data, descricao, categoriaNome, tipo, valor }]
export function montarRelatorioHtml({ titulo, geradoEm, resumo, categorias, transacoes }) {

  const linhasCategorias = categorias.map((c) => `
    <tr>
      <td>${escaparHtml(c.nome)}</td>
      <td class="valor">${brl(c.valor)}</td>
      <td class="valor">${c.porcentagem.toFixed(1)}%</td>
    </tr>`).join("")

  const linhasTransacoes = transacoes.map((t) => `
    <tr>
      <td>${escaparHtml(dataCurta(t.data))}</td>
      <td>${escaparHtml(t.descricao)}</td>
      <td>${escaparHtml(t.categoriaNome)}</td>
      <td class="valor ${t.tipo === "entrada" ? "entrada" : "saida"}">${t.tipo === "entrada" ? "+" : "-"}${brl(t.valor)}</td>
    </tr>`).join("")

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escaparHtml(`Relatório - ${titulo}`)}</title>
<style>${ESTILO}</style>
</head>
<body>
  <h1>Controle Financeiro</h1>
  <p class="sub">Relatório: ${escaparHtml(titulo)}</p>

  <div class="cards">
    <div class="card"><span>Saldo</span><strong>${brl(resumo.saldo)}</strong></div>
    <div class="card"><span>Entradas</span><strong class="entrada">${brl(resumo.entradas)}</strong></div>
    <div class="card"><span>Saídas</span><strong class="saida">${brl(resumo.saidas)}</strong></div>
  </div>

  ${categorias.length > 0 ? `
  <h2>Gastos por categoria</h2>
  <table>
    <thead><tr><th>Categoria</th><th class="valor">Total</th><th class="valor">%</th></tr></thead>
    <tbody>${linhasCategorias}</tbody>
  </table>` : ""}

  <h2>Transações (${transacoes.length})</h2>
  <table>
    <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th class="valor">Valor</th></tr></thead>
    <tbody>${linhasTransacoes}</tbody>
  </table>

  <p class="rodape">Gerado em ${escaparHtml(geradoEm)}</p>
</body>
</html>`
}

// Abre a impressão sem popup (iframe escondido). Retorna false se não deu.
export function imprimirRelatorio(html) {
  const quadro = document.createElement("iframe")

  quadro.setAttribute("aria-hidden", "true")
  quadro.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;"

  quadro.onload = () => {
    try {
      quadro.contentWindow.focus()
      quadro.contentWindow.print()
    } finally {
      // Dá tempo da janela de impressão abrir antes de limpar
      setTimeout(() => quadro.remove(), 60000)
    }
  }

  quadro.srcdoc = html
  document.body.appendChild(quadro)

  return true
}


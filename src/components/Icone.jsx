// Ícones do app, desenhados em SVG (traço de 1,8 px, cantos arredondados).
// Herdam a cor do texto (currentColor), então basta mudar o "color" no CSS.

const CAMINHOS = {
  // Navegação
  inicio: (
    <>
      <rect x="3" y="3" width="7.5" height="9.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="2" />
      <rect x="13.5" y="12" width="7.5" height="9" rx="2" />
      <rect x="3" y="16" width="7.5" height="5" rx="2" />
    </>
  ),
  transacoes: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="3" />
      <path d="M2.5 10h19" />
      <path d="M6.5 15h4" />
    </>
  ),
  graficos: (
    <>
      <path d="M5 20v-7" />
      <path d="M12 20V5" />
      <path d="M19 20v-10" />
    </>
  ),
  caixinha: (
    <>
      <path d="M4 13a7.5 5.5 0 1 0 15 0 7.5 5.5 0 1 0-15 0z" />
      <path d="M19 11.5h1.8a1 1 0 0 1 1 1v1.8a1 1 0 0 1-1 1H19" />
      <path d="M15.2 8.3 15.9 5l2.9 2.4" />
      <path d="M4.3 12.2c-1.3-.2-2-1.1-1.7-2.4" />
      <path d="M8.2 17.7v2.8M14.8 17.7v2.8" />
      <path d="M9 10.3h4" />
      <circle cx="16.4" cy="11.8" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  adicionar: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),

  // Ações
  olho: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  olhoOff: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 4l16 16" />
    </>
  ),
  editar: (
    <>
      <path d="M4 20v-4L16 4l4 4L8 20z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  lixeira: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </>
  ),
  baixar: (
    <>
      <path d="M12 4v11" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  subir: (
    <>
      <path d="M12 16V5" />
      <path d="M7 9l5-5 5 5" />
      <path d="M5 20h14" />
    </>
  ),
  chevronBaixo: <path d="M6 9l6 6 6-6" />,
  chevronDireita: <path d="M9 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  checkCirculo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  estrela: (
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  ),
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  lua: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />,

  // Marca e dinheiro
  carteira: (
    <>
      <path d="M3 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
      <path d="M3 6v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M3 8h16a2 2 0 0 1 2 2v2" />
      <path d="M21 12h-4a2 2 0 0 0 0 4h4z" />
    </>
  ),
  setaEntrada: (
    <>
      <path d="M17 7L7 17" />
      <path d="M7 8v9h9" />
    </>
  ),
  setaSaida: (
    <>
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  moeda: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.4c-.4-.9-1.4-1.4-2.8-1.4-1.6 0-2.7.8-2.7 2s1 1.7 2.7 2 2.7.8 2.7 2-1.1 2-2.7 2c-1.4 0-2.4-.5-2.8-1.4" />
      <path d="M12 6v2M12 16v2" />
    </>
  ),

  // Categorias
  alimentacao: (
    <>
      <path d="M4.5 3v5a2.5 2.5 0 0 0 5 0V3" />
      <path d="M7 3v18" />
      <path d="M17 21V3c-2.2 1.2-3.5 3.8-3.5 7v3H17" />
    </>
  ),
  lazer: (
    <>
      <path d="M6 8h12a4 4 0 0 1 4 4.2l-.6 4a2.6 2.6 0 0 1-4.3 1.5L15 16H9l-2.1 1.7a2.6 2.6 0 0 1-4.3-1.5l-.6-4A4 4 0 0 1 6 8z" />
      <path d="M7.5 11v3M6 12.5h3" />
      <circle cx="15.5" cy="11.5" r=".7" fill="currentColor" stroke="none" />
      <circle cx="17.7" cy="13.5" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  casa: (
    <>
      <path d="M3 11l9-7.5 9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  transporte: (
    <>
      <path d="M5 12l1.6-4.3A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.2L19 12" />
      <path d="M3 12h18v4a1 1 0 0 1-1 1h-1" />
      <path d="M15 17H9" />
      <path d="M5 17H4a1 1 0 0 1-1-1z" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  salario: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2.5" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  educacao: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
      <path d="M6.5 17a2.5 2.5 0 0 0 0 4.5H20V17" />
      <path d="M8.5 7.5h7M8.5 11h4" />
    </>
  ),
  compras: (
    <>
      <path d="M3 4h2.5l2 11h10.5l2-8H6.5" />
      <circle cx="9.5" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </>
  ),
  outros: (
    <>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </>
  ),

  // Extras das caixinhas
  aviao: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4z" />
    </>
  ),
  formatura: (
    <>
      <path d="M2 9l10-5 10 5-10 5z" />
      <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
      <path d="M22 9v6" />
    </>
  ),
  escudo: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  presente: (
    <>
      <rect x="3" y="9" width="18" height="4" rx="1" />
      <path d="M5 13v8h14v-8" />
      <path d="M12 9v12" />
      <path d="M12 9c-2 0-4-1-4-3s2-2.5 4 0c2-2.5 4-2 4 0s-2 3-4 3" />
    </>
  )
}

function Icone({ nome, tamanho = 20, className }) {
  const desenho = CAMINHOS[nome] ?? CAMINHOS.outros

  return (
    <svg
      className={className ? `icone ${className}` : "icone"}
      viewBox="0 0 24 24"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {desenho}
    </svg>
  )
}

// As caixinhas já salvas guardam um emoji; aqui ele vira o ícone equivalente.
// Os dados continuam iguais, só a exibição muda.
export const EMOJIS_CAIXINHA = ["🐷", "💰", "✈️", "🏠", "🚗", "🎓", "🛡️", "🎁"]

const ICONE_DO_EMOJI = {
  "🐷": "caixinha",
  "💰": "moeda",
  "✈": "aviao",
  "🏠": "casa",
  "🚗": "transporte",
  "🎓": "formatura",
  "🛡": "escudo",
  "🎁": "presente"
}

export function iconeDoEmoji(emoji) {
  return ICONE_DO_EMOJI[String(emoji ?? "").replace(/️/g, "")] ?? null
}

export function IconeCaixinha({ emoji, tamanho = 22 }) {
  const nome = iconeDoEmoji(emoji)

  // Emoji que não está na lista: mostra como veio
  if (!nome) {
    return <span aria-hidden="true">{emoji}</span>
  }

  return <Icone nome={nome} tamanho={tamanho} />
}

export default Icone

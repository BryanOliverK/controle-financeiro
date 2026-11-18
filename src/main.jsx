import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LimiteDeErro from './components/LimiteDeErro'

// Idioma da página (leitores de tela pronunciam certo)
document.documentElement.lang = 'pt-BR'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LimiteDeErro>
      <App />
    </LimiteDeErro>
  </StrictMode>,
)

// Instalável e rápido de abrir: registra o service worker (só no site publicado)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {})
  })
}

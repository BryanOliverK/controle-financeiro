// Bloqueio do app por PIN. É uma trava de privacidade neste aparelho (impede que
// alguém que pegue seu celular ou computador abra o app), não uma criptografia
// dos dados. O PIN nunca é guardado: só um "hash" (PBKDF2 + sal aleatório).

export const PIN_MIN = 4
export const PIN_MAX = 6

// Minutos sem mexer até bloquear (0 = nunca) e até sair da conta (0 = nunca)
export const OPCOES_BLOQUEIO = [0, 1, 5, 15]
export const OPCOES_SAIR = [0, 30, 60, 240]

export const CONFIG_PADRAO = { pin: null, bloquearApos: 5, sairApos: 0, bio: "" }

const ITERACOES = 150000

export function pinValido(pin) {
  return typeof pin === "string" && new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin)
}

// 0000, 1111, 1234, 4321... são fáceis demais de adivinhar
export function pinFraco(pin) {
  if (!pinValido(pin)) {
    return false
  }

  const d = [...pin].map(Number)

  const igual = d.every((n) => n === d[0])
  const sobe = d.every((n, i) => i === 0 || n === d[i - 1] + 1)
  const desce = d.every((n, i) => i === 0 || n === d[i - 1] - 1)

  return igual || sobe || desce
}

// Depois de 5 erros seguidos começa a esperar, e a espera cresce
export function esperaAposErros(erros) {
  if (erros < 5) return 0
  if (erros === 5) return 30 * 1000
  if (erros === 6) return 60 * 1000
  if (erros === 7) return 5 * 60 * 1000
  return 15 * 60 * 1000
}

export function tentativasAntesDaEspera(erros) {
  return Math.max(0, 5 - erros)
}

// ----- base64 (para guardar bytes como texto) -----

export function paraB64(bytes) {
  let texto = ""
  bytes.forEach((b) => { texto += String.fromCharCode(b) })
  return btoa(texto)
}

export function deB64(texto) {
  return Uint8Array.from(atob(texto), (c) => c.charCodeAt(0))
}

// ----- hash do PIN -----

export function pinDisponivel() {
  return typeof crypto !== "undefined" && Boolean(crypto.subtle) && typeof crypto.getRandomValues === "function"
}

async function derivar(pin, sal, iteracoes) {
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iteracoes }, chave, 256)
  return new Uint8Array(bits)
}

// Registro para guardar: { v, salt, hash, it, tam }
export async function criarPin(pin) {
  if (!pinValido(pin)) {
    throw new Error("PIN inválido")
  }

  const sal = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivar(pin, sal, ITERACOES)

  return { v: 1, salt: paraB64(sal), hash: paraB64(hash), it: ITERACOES, tam: pin.length }
}

export async function conferirPin(pin, registro) {
  if (!pinValido(pin) || !registro) {
    return false
  }

  try {
    const esperado = deB64(registro.hash)
    const calculado = await derivar(pin, deB64(registro.salt), registro.it)

    if (esperado.length !== calculado.length) {
      return false
    }

    // Compara tudo, sem parar no primeiro byte diferente
    let diferenca = 0

    for (let i = 0; i < esperado.length; i++) {
      diferenca |= esperado[i] ^ calculado[i]
    }

    return diferenca === 0
  } catch {
    return false
  }
}

// ----- Configuração guardada -----

const registroValido = (r) =>
  r && typeof r === "object" && r.v === 1 &&
  typeof r.salt === "string" && r.salt.length > 0 && r.salt.length <= 64 &&
  typeof r.hash === "string" && r.hash.length > 0 && r.hash.length <= 128 &&
  Number.isInteger(r.it) && r.it >= 1000 && r.it <= 1000000 &&
  Number.isInteger(r.tam) && r.tam >= PIN_MIN && r.tam <= PIN_MAX

export function limparBloqueio(bruto) {
  const b = bruto && typeof bruto === "object" ? bruto : {}
  const pin = registroValido(b.pin) ? { v: 1, salt: b.pin.salt, hash: b.pin.hash, it: b.pin.it, tam: b.pin.tam } : null

  return {
    pin,
    bloquearApos: OPCOES_BLOQUEIO.includes(b.bloquearApos) ? b.bloquearApos : CONFIG_PADRAO.bloquearApos,
    sairApos: OPCOES_SAIR.includes(b.sairApos) ? b.sairApos : CONFIG_PADRAO.sairApos,
    bio: pin && typeof b.bio === "string" && b.bio.length <= 1024 ? b.bio : ""
  }
}

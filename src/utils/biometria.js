// Biometria do aparelho (digital, rosto ou o PIN do próprio celular/computador),
// pelo WebAuthn do navegador. Serve só para destravar o app neste aparelho;
// se algo falhar, o PIN sempre continua valendo.

import { deB64, paraB64 } from "./pin"

const aleatorio = (n) => crypto.getRandomValues(new Uint8Array(n))

export async function biometriaDisponivel() {
  try {
    return Boolean(window.PublicKeyCredential) &&
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

// Cadastra a biometria deste aparelho. Devolve o identificador (texto) ou "" se não deu.
export async function registrarBiometria(uid, nome) {
  try {
    const credencial = await navigator.credentials.create({
      publicKey: {
        challenge: aleatorio(32),
        rp: { name: "Controle Financeiro" },
        user: {
          id: new TextEncoder().encode(String(uid)).slice(0, 64),
          name: nome || "usuario",
          displayName: nome || "usuario"
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
        timeout: 60000
      }
    })

    return credencial ? paraB64(new Uint8Array(credencial.rawId)) : ""
  } catch {
    return ""
  }
}

export async function conferirBiometria(identificador) {
  try {
    const resposta = await navigator.credentials.get({
      publicKey: {
        challenge: aleatorio(32),
        allowCredentials: [{ type: "public-key", id: deB64(identificador) }],
        userVerification: "required",
        timeout: 60000
      }
    })

    return Boolean(resposta)
  } catch {
    return false
  }
}

// Estado da sincronização com a nuvem, em palavras claras.

const MENSAGENS = {
  "permission-denied": "O Firebase recusou salvar seus dados. Confira as regras do Firestore.",
  unavailable: "Sem conexão com o servidor. Suas alterações ficam neste aparelho até a internet voltar.",
  "deadline-exceeded": "O servidor demorou demais para responder. Tente de novo.",
  "resource-exhausted": "O limite de uso do Firebase foi atingido por agora. Tente mais tarde.",
  "invalid-argument": "Seus dados ficaram grandes demais para a nuvem (limite de 1 MB). Apague o que não usa mais.",
  "failed-precondition": "O servidor não aceitou a gravação agora. Tente de novo.",
  unauthenticated: "Sua sessão expirou. Saia e entre de novo.",
  cancelled: "O envio foi interrompido. Tente de novo."
}

export function mensagemErroNuvem(codigo) {
  const limpo = String(codigo ?? "").replace(/^firestore\//, "")

  return MENSAGENS[limpo] ?? "Não foi possível salvar na nuvem. Tente de novo."
}

// Junta tudo num único estado para mostrar na tela.
// estado: "erro" | "offline" | "enviando" | "ok"
export function estadoNuvem({ online = true, enviando = false, erroEnvio = "", erroEscuta = "" } = {}) {
  if (erroEnvio) {
    return { estado: "erro", texto: "Não salvou", detalhe: erroEnvio, podeTentar: true }
  }

  if (erroEscuta) {
    return { estado: "erro", texto: "Sem atualizações", detalhe: erroEscuta, podeTentar: true }
  }

  if (!online) {
    return {
      estado: "offline",
      texto: "Sem conexão",
      detalhe: "Suas alterações ficam neste aparelho e sobem quando a internet voltar. Não feche o app antes disso.",
      podeTentar: false
    }
  }

  if (enviando) {
    return { estado: "enviando", texto: "Salvando…", detalhe: "Enviando suas alterações para a nuvem.", podeTentar: false }
  }

  return { estado: "ok", texto: "Sincronizado", detalhe: "Seus dados estão salvos na nuvem.", podeTentar: false }
}

// Traduz os códigos de erro do Firebase Auth para mensagens claras.
// Devolve null para os casos em que não se deve avisar nada.

const MENSAGENS = {
  "auth/invalid-email": "Esse e-mail não parece válido.",
  "auth/missing-email": "Digite seu e-mail.",
  "auth/missing-password": "Digite sua senha.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/user-disabled": "Essa conta foi desativada.",
  "auth/email-already-in-use": "Já existe uma conta com esse e-mail. Entre, ou use \"Esqueci minha senha\".",
  "auth/weak-password": "Escolha uma senha mais forte (mínimo de 6 caracteres).",
  "auth/too-many-requests": "Muitas tentativas. Espere um pouco e tente de novo.",
  "auth/network-request-failed": "Sem conexão com a internet. Confira e tente de novo.",
  "auth/operation-not-allowed": "Esse tipo de login não está ativado no Firebase."
}

export function mensagemErroAuth(codigo) {
  return MENSAGENS[codigo] ?? "Não foi possível concluir. Tente novamente."
}

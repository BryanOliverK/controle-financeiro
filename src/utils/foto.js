// Foto de perfil guardada no próprio documento do usuário (sem Firebase Storage).
// A imagem é reduzida no aparelho para um quadrado pequeno em JPEG, então ocupa
// poucos KB e sincroniza junto com o resto dos dados.

export const TAMANHO_FOTO = 256 // lado, em pixels
export const LIMITE_FOTO = 70000 // caracteres do texto da imagem (~50 KB)
export const TAMANHO_MAXIMO_ORIGINAL = 10 * 1024 * 1024 // 10 MB

const PREFIXO = "data:image/jpeg;base64,"

// Só aceita uma imagem JPEG pequena em texto base64 (vale também para a nuvem)
export function fotoValida(valor) {
  return (
    typeof valor === "string" &&
    valor.startsWith(PREFIXO) &&
    valor.length > PREFIXO.length &&
    valor.length <= LIMITE_FOTO &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(valor.slice(PREFIXO.length))
  )
}

export function limparFoto(bruto) {
  return fotoValida(bruto) ? bruto : ""
}

// Mensagem de erro ou "" se o arquivo pode ser usado como foto
export function validarArquivoFoto(arquivo) {
  if (!arquivo || typeof arquivo.type !== "string" || !arquivo.type.startsWith("image/")) {
    return "Escolha um arquivo de imagem (JPG, PNG ou WebP)."
  }

  if (arquivo.type === "image/svg+xml") {
    return "Esse tipo de imagem não é aceito. Use JPG, PNG ou WebP."
  }

  if (arquivo.size > TAMANHO_MAXIMO_ORIGINAL) {
    return "Essa imagem é grande demais (máximo 10 MB)."
  }

  return ""
}

// Lê a imagem, recorta o centro em quadrado e reduz. Devolve o texto da imagem
// (data URL JPEG) ou joga Error com mensagem amigável.
export async function fotoDeArquivo(arquivo) {
  const erro = validarArquivoFoto(arquivo)

  if (erro) {
    throw new Error(erro)
  }

  const url = URL.createObjectURL(arquivo)

  try {
    const imagem = await new Promise((resolver, rejeitar) => {
      const img = new Image()
      img.onload = () => resolver(img)
      img.onerror = () => rejeitar(new Error("Não consegui abrir essa imagem."))
      img.src = url
    })

    const lado = Math.min(imagem.naturalWidth, imagem.naturalHeight)

    if (!lado) {
      throw new Error("Não consegui abrir essa imagem.")
    }

    // Tenta tamanhos e qualidades até caber no limite
    for (const [tamanho, qualidade] of [[TAMANHO_FOTO, 0.85], [TAMANHO_FOTO, 0.7], [192, 0.7], [128, 0.7]]) {
      const canvas = document.createElement("canvas")
      canvas.width = tamanho
      canvas.height = tamanho

      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, tamanho, tamanho)

      const sx = (imagem.naturalWidth - lado) / 2
      const sy = (imagem.naturalHeight - lado) / 2

      ctx.drawImage(imagem, sx, sy, lado, lado, 0, 0, tamanho, tamanho)

      const texto = canvas.toDataURL("image/jpeg", qualidade)

      if (fotoValida(texto)) {
        return texto
      }
    }

    throw new Error("Não consegui reduzir essa imagem o bastante. Tente outra.")
  } finally {
    URL.revokeObjectURL(url)
  }
}

import { describe, it, expect } from "vitest"
import { LIMITE_FOTO, fotoValida, limparFoto, validarArquivoFoto } from "./foto"

const ok = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=="

describe("fotoValida", () => {
  it("aceita um JPEG em base64", () => {
    expect(fotoValida(ok)).toBe(true)
  })

  it("recusa outros formatos, lixo e vazio", () => {
    expect(fotoValida("data:image/png;base64,AAAA")).toBe(false)
    expect(fotoValida("data:image/svg+xml;base64,AAAA")).toBe(false)
    expect(fotoValida("https://exemplo.com/a.jpg")).toBe(false)
    expect(fotoValida("javascript:alert(1)")).toBe(false)
    expect(fotoValida("data:image/jpeg;base64,")).toBe(false)
    expect(fotoValida("data:image/jpeg;base64,<script>")).toBe(false)
    expect(fotoValida("")).toBe(false)
    expect(fotoValida(null)).toBe(false)
    expect(fotoValida(123)).toBe(false)
  })

  it("recusa imagem grande demais", () => {
    expect(fotoValida("data:image/jpeg;base64," + "A".repeat(LIMITE_FOTO))).toBe(false)
    expect(fotoValida("data:image/jpeg;base64," + "A".repeat(LIMITE_FOTO - 30))).toBe(true)
  })
})

describe("limparFoto", () => {
  it("devolve a foto boa ou vazio", () => {
    expect(limparFoto(ok)).toBe(ok)
    expect(limparFoto("lixo")).toBe("")
    expect(limparFoto(undefined)).toBe("")
  })
})

describe("validarArquivoFoto", () => {
  it("só imagens de até 10 MB, sem SVG", () => {
    expect(validarArquivoFoto({ type: "image/png", size: 1000 })).toBe("")
    expect(validarArquivoFoto({ type: "image/jpeg", size: 1000 })).toBe("")
    expect(validarArquivoFoto({ type: "application/pdf", size: 1000 })).not.toBe("")
    expect(validarArquivoFoto({ type: "image/svg+xml", size: 1000 })).not.toBe("")
    expect(validarArquivoFoto({ type: "image/png", size: 11 * 1024 * 1024 })).not.toBe("")
    expect(validarArquivoFoto(null)).not.toBe("")
  })
})

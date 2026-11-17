import { describe, it, expect } from "vitest"
import { interpolar, suavizar } from "./animacao"

describe("suavizar", () => {
  it("vai de 0 a 1 e nunca passa disso", () => {
    expect(suavizar(0)).toBe(0)
    expect(suavizar(1)).toBe(1)
    expect(suavizar(-5)).toBe(0)
    expect(suavizar(7)).toBe(1)
    expect(suavizar(NaN)).toBe(0)
  })

  it("começa rápido: na metade do tempo já passou da metade do caminho", () => {
    expect(suavizar(0.5) > 0.5).toBe(true)
  })
})

describe("interpolar", () => {
  it("termina exatamente no alvo", () => {
    expect(interpolar(0, 1234.56, 1)).toBe(1234.56)
    expect(interpolar(10, 0, 2)).toBe(0)
  })

  it("começa no valor de partida e funciona para baixo", () => {
    expect(interpolar(50, 100, 0)).toBe(50)
    const meio = interpolar(100, 0, 0.5)
    expect(meio < 50).toBe(true)
    expect(meio > 0).toBe(true)
  })
})

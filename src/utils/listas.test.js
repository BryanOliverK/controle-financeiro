import { describe, it, expect } from "vitest"
import { unirPorId } from "./listas"

describe("unirPorId", () => {
  it("mantém tudo da base e só entra o que falta", () => {
    const base = [{ id: 1, v: "base" }]
    const extras = [{ id: 1, v: "extra" }, { id: 2, v: "novo" }]
    expect(unirPorId(base, extras)).toEqual([{ id: 1, v: "base" }, { id: 2, v: "novo" }])
  })

  it("não altera as listas originais", () => {
    const base = [{ id: 1 }]
    unirPorId(base, [{ id: 2 }])
    expect(base).toEqual([{ id: 1 }])
  })
})

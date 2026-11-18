import { describe, it, expect } from "vitest"
import {
  CONFIG_PADRAO, conferirPin, criarPin, deB64, esperaAposErros, limparBloqueio,
  paraB64, pinFraco, pinValido, tentativasAntesDaEspera
} from "./pin"

describe("pinValido / pinFraco", () => {
  it("aceita só 4 a 6 dígitos", () => {
    expect(pinValido("4821")).toBe(true)
    expect(pinValido("482193")).toBe(true)
    expect(pinValido("482")).toBe(false)
    expect(pinValido("4821935")).toBe(false)
    expect(pinValido("48a1")).toBe(false)
    expect(pinValido(4821)).toBe(false)
  })

  it("recusa sequências e repetições", () => {
    expect(pinFraco("0000")).toBe(true)
    expect(pinFraco("1234")).toBe(true)
    expect(pinFraco("4321")).toBe(true)
    expect(pinFraco("123456")).toBe(true)
    expect(pinFraco("4821")).toBe(false)
    expect(pinFraco("1243")).toBe(false)
  })
})

describe("esperaAposErros", () => {
  it("5 tentativas livres, depois a espera cresce", () => {
    expect(esperaAposErros(4)).toBe(0)
    expect(esperaAposErros(5)).toBe(30000)
    expect(esperaAposErros(6)).toBe(60000)
    expect(esperaAposErros(7)).toBe(300000)
    expect(esperaAposErros(20)).toBe(900000)
    expect(tentativasAntesDaEspera(2)).toBe(3)
    expect(tentativasAntesDaEspera(9)).toBe(0)
  })
})

describe("base64", () => {
  it("ida e volta", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255])
    expect(Array.from(deB64(paraB64(bytes)))).toEqual([0, 1, 2, 250, 255])
  })
})

describe("criarPin / conferirPin", () => {
  it("o registro não contém o PIN e só o PIN certo confere", async () => {
    const reg = await criarPin("4821")
    expect(JSON.stringify(reg).includes("4821")).toBe(false)
    expect(reg.tam).toBe(4)
    expect(await conferirPin("4821", reg)).toBe(true)
    expect(await conferirPin("4822", reg)).toBe(false)
    expect(await conferirPin("482", reg)).toBe(false)
    expect(await conferirPin("4821", null)).toBe(false)
  })

  it("o mesmo PIN gera registros diferentes (sal aleatório)", async () => {
    const a = await criarPin("4821")
    const b = await criarPin("4821")
    expect(a.salt === b.salt).toBe(false)
    expect(a.hash === b.hash).toBe(false)
  })

  it("registro adulterado não confere", async () => {
    const reg = await criarPin("4821")
    expect(await conferirPin("4821", { ...reg, hash: "AAAA" })).toBe(false)
    expect(await conferirPin("4821", { ...reg, salt: "@@@" })).toBe(false)
  })
})

describe("limparBloqueio", () => {
  it("lixo vira o padrão", () => {
    expect(limparBloqueio(null)).toEqual(CONFIG_PADRAO)
    expect(limparBloqueio("x")).toEqual(CONFIG_PADRAO)
    expect(limparBloqueio({ pin: { v: 2 }, bloquearApos: 7, sairApos: 3 })).toEqual(CONFIG_PADRAO)
  })

  it("mantém valores válidos e descarta biometria sem PIN", async () => {
    const pin = await criarPin("4821")
    const ok = limparBloqueio({ pin, bloquearApos: 15, sairApos: 60, bio: "abc" })
    expect(ok.bloquearApos).toBe(15)
    expect(ok.sairApos).toBe(60)
    expect(ok.bio).toBe("abc")
    expect(limparBloqueio({ bio: "abc" }).bio).toBe("")
  })
})

// Junta duas listas pelo id: fica tudo de "base" e entra só o que ainda não
// existe nela (usado no primeiro acesso de um aparelho e ao importar backup)
export function unirPorId(base, extras) {
  const ids = new Set(base.map((item) => item.id))
  return [...base, ...extras.filter((item) => !ids.has(item.id))]
}

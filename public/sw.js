// Service worker do Controle Financeiro.
//
// Objetivo: o app abrir rápido e abrir mesmo sem internet (a tela e os
// arquivos). Os DADOS continuam vindo do Firebase: este arquivo nunca mexe
// em pedidos de outros endereços (Firebase, Google, fontes).
//
// Ao publicar uma versão nova do app, não é preciso mexer aqui: a página
// principal é sempre buscada na rede primeiro. Só aumente VERSAO se quiser
// forçar a limpeza do cache.

const VERSAO = "v1"
const CACHE = `controle-financeiro-${VERSAO}`

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(nomes.filter((nome) => nome !== CACHE).map((nome) => caches.delete(nome)))
      )
      .then(() => self.clients.claim())
  )
})

async function guardar(pedido, resposta) {
  if (resposta && resposta.ok) {
    const cache = await caches.open(CACHE)
    await cache.put(pedido, resposta.clone())
  }
  return resposta
}

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request

  if (pedido.method !== "GET") {
    return
  }

  const url = new URL(pedido.url)

  // Só arquivos do próprio site. Login do Google e Firebase (/__/auth) ficam de fora.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/__/")) {
    return
  }

  // Abrir o app: rede primeiro (versão nova sempre que houver internet),
  // cache se estiver offline
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((resposta) => guardar(self.registration.scope, resposta))
        .catch(() => caches.match(self.registration.scope))
    )
    return
  }

  // Arquivos com hash no nome (/assets/...) nunca mudam: cache primeiro
  if (url.pathname.includes("/assets/")) {
    evento.respondWith(
      caches.match(pedido).then((guardado) => guardado || fetch(pedido).then((r) => guardar(pedido, r)))
    )
    return
  }

  // Ícones, manifest e o resto: rede primeiro, cache como reserva
  evento.respondWith(
    fetch(pedido)
      .then((resposta) => guardar(pedido, resposta))
      .catch(() => caches.match(pedido))
  )
})

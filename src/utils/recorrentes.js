// Transações que se repetem todo mês (salário, aluguel, assinaturas...).
//
// Como funciona: ao salvar uma transação com "repetir todo mês", ela é
// lançada normalmente e vira também um modelo (recorrente) com o dia do mês
// e o "proximoMes" a gerar. Sempre que o app abre, os meses que já chegaram
// são lançados sozinhos.

import { chaveMes, novoId } from "./formatar"

const LIMITE_MESES_POR_VEZ = 120

function somarMes(chave) {
  const [ano, mes] = chave.split("-").map(Number)

  return mes === 12
    ? `${ano + 1}-01`
    : `${ano}-${String(mes + 1).padStart(2, "0")}`
}

// Dia 31 em fevereiro vira dia 28 (ou 29), o último dia do mês
function dataDoMes(chave, dia) {
  const [ano, mes] = chave.split("-").map(Number)
  const ultimoDia = new Date(ano, mes, 0).getDate()

  return new Date(ano, mes - 1, Math.min(dia, ultimoDia), 12, 0, 0)
}

// Cria o modelo a partir da transação recém-salva (a primeira já foi lançada,
// então a próxima é no mês seguinte).
export function criarRecorrente({ descricao, valor, tipo, categoria, cartaoId }, dataIso) {
  return {
    ...(cartaoId ? { cartaoId } : {}),
    id: novoId(),
    descricao,
    valor,
    tipo,
    categoria,
    dia: new Date(dataIso).getDate(),
    proximoMes: somarMes(chaveMes(dataIso))
  }
}

// Devolve { transacoes, recorrentes } com o que falta lançar até hoje,
// ou null se não há nada a fazer. Os ids são fixos (rec-<id>-<mês>), então
// dois aparelhos gerando ao mesmo tempo não duplicam nada.
export function gerarPendentes(recorrentes, hoje = new Date()) {
  const fimDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)

  const novas = []
  let mudou = false

  const atualizadas = recorrentes.map((r) => {
    let mes = r.proximoMes
    let gerou = false

    for (let i = 0; i < LIMITE_MESES_POR_VEZ; i++) {
      const data = dataDoMes(mes, r.dia)

      if (data > fimDeHoje) {
        break
      }

      novas.push({
        id: `rec-${r.id}-${mes}`,
        descricao: r.descricao,
        valor: r.valor,
        tipo: r.tipo,
        categoria: r.categoria,
        ...(r.cartaoId ? { cartaoId: r.cartaoId } : {}),
        data: data.toISOString()
      })

      mes = somarMes(mes)
      gerou = true
    }

    if (!gerou) {
      return r
    }

    mudou = true
    return { ...r, proximoMes: mes }
  })

  return mudou ? { transacoes: novas, recorrentes: atualizadas } : null
}

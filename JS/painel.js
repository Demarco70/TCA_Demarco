const MAX_ITENS = 10

/* ---------- Datas ---------- */

function pad(n) {
  return String(n).padStart(2, '0')
}

function isoLocal(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const agora = new Date()
const HOJE = isoLocal(agora)
const LIMITE_7_DIAS = isoLocal(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 7))
const INICIO_JANELA = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
const FIM_JANELA = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 8)

// Datas "YYYY-MM-DD" são tratadas na mão para o fuso horário não mudar o dia
function formatarData(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

function formatarDataHora(timestamp) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function diasAte(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  const alvo = Date.UTC(a, m - 1, d)
  const base = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate())
  return Math.round((alvo - base) / 86400000)
}

function textoDias(dias) {
  if (dias < 0) return `${-dias} dia${dias === -1 ? '' : 's'} de atraso`
  if (dias === 0) return 'vence hoje'
  if (dias === 1) return 'vence amanhã'
  return `em ${dias} dias`
}

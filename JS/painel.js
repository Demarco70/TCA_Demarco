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

function el(tag, texto, classe) {
  const e = document.createElement(tag)
  if (texto !== null && texto !== undefined) e.textContent = texto
  if (classe) e.className = classe
  return e
}

function limpar(id) {
  const lista = document.getElementById(id)
  lista.replaceChildren()
  return lista
}

function mostrarVazio(lista, texto) {
  const li = el('li', texto, 'vazio')
  lista.appendChild(li)
}

function preencher(lista, itens, criar, textoVazio) {
  if (!itens.length) return mostrarVazio(lista, textoVazio)
  itens.slice(0, MAX_ITENS).forEach(i => lista.appendChild(criar(i)))
  if (itens.length > MAX_ITENS) {
    lista.appendChild(el('li', `… e mais ${itens.length - MAX_ITENS}`, 'mais'))
  }
}

function rotuloProcesso(p) {
  return p ? [p.codigo, p.titulo].filter(Boolean).join(' · ') : ''
}

function nomeResponsavel(r) {
  return r?.usuario?.nome_exibicao ?? ''
}

const PRIORIDADES = ['alta', 'media', 'baixa']

async function secao(idErro, funcao) {
  try {
    await funcao()
  } catch (error) {
    console.error(error?.message || error)
    document.getElementById(idErro).textContent = 'Não foi possível carregar esta seção.'
  }
}

/* ---------- Resumo ---------- */

async function carregarResumo() {
  const [clientes, processos] = await Promise.all([
    supabaseClient.from('cliente').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabaseClient.from('processo').select('*', { count: 'exact', head: true }).in('status', ['ativo', 'em_andamento']),
  ])
  if (clientes.error || processos.error) throw clientes.error || processos.error
  document.getElementById('n-clientes').textContent = clientes.count
  document.getElementById('n-processos').textContent = processos.count
}

/* ---------- Prazos e tarefas ---------- */

function itemTarefa(t) {
  const prioridade = PRIORIDADES.includes(t.prioridade) ? t.prioridade : 'media'
  const li = el('li', null, `item prioridade-${prioridade}`)

  const topo = el('div', null, 'item-topo')
  topo.appendChild(el('strong', t.titulo))
  if (t.tipo === 'prazo') topo.appendChild(el('span', 'Prazo', 'selo selo-prazo'))
  topo.appendChild(el('span', prioridade, `selo selo-${prioridade}`))
  li.appendChild(topo)

  const processo = rotuloProcesso(t.processo)
  if (processo) li.appendChild(el('div', processo, 'sub'))

  const dias = diasAte(t.data_limite)
  const responsavel = nomeResponsavel(t.responsavel)
  const linha = el('div', null, 'sub')
  linha.appendChild(el('span', `${formatarData(t.data_limite)} · ${textoDias(dias)}`, dias < 0 ? 'atrasado' : ''))
  if (responsavel) linha.appendChild(document.createTextNode(` · ${responsavel}`))
  li.appendChild(linha)

  return li
}

async function carregarPrazos() {
  const { data, error } = await supabaseClient
    .from('tarefa')
    .select(`
      id, titulo, tipo, prioridade, status, data_limite,
      processo:processo_id ( codigo, titulo ),
      responsavel:responsavel_id ( usuario:usuario_id ( nome_exibicao ) )
    `)
    .in('status', ['pendente', 'em_andamento'])
    .not('data_limite', 'is', null)
    .order('data_limite')
  if (error) throw error

  const atrasadas = data.filter(t => t.data_limite < HOJE)
  const proximas = data.filter(t => t.data_limite >= HOJE && t.data_limite <= LIMITE_7_DIAS)

  document.getElementById('n-atrasadas').textContent = atrasadas.length
  document.getElementById('qtd-atrasadas').textContent = atrasadas.length || ''
  document.getElementById('qtd-proximas').textContent = proximas.length || ''

  preencher(limpar('lista-atrasadas'), atrasadas, itemTarefa, 'Nenhuma tarefa atrasada.')
  preencher(limpar('lista-proximas'), proximas, itemTarefa, 'Nenhum prazo nos próximos 7 dias.')
}

/* ---------- Agenda ---------- */

function itemCompromisso(c) {
  const li = el('li', null, 'item')
  const topo = el('div', null, 'item-topo')
  topo.appendChild(el('strong', c.titulo))
  topo.appendChild(el('span', formatarDataHora(c.inicio), 'selo'))
  li.appendChild(topo)

  const processo = rotuloProcesso(c.processo)
  if (processo) li.appendChild(el('div', processo, 'sub'))

  const detalhes = [c.local, nomeResponsavel(c.responsavel)].filter(Boolean).join(' · ')
  if (detalhes) li.appendChild(el('div', detalhes, 'sub'))
  return li
}

async function carregarAgenda() {
  const { data, error } = await supabaseClient
    .from('compromisso')
    .select(`
      id, titulo, inicio, local,
      processo:processo_id ( codigo, titulo ),
      responsavel:responsavel_id ( usuario:usuario_id ( nome_exibicao ) )
    `)
    .gte('inicio', INICIO_JANELA.toISOString())
    .lt('inicio', FIM_JANELA.toISOString())
    .order('inicio')
  if (error) throw error

  preencher(limpar('lista-agenda'), data, itemCompromisso, 'Nenhum compromisso nos próximos 7 dias.')
}
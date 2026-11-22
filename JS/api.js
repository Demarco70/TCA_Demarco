import { SUPABASE_URL, SUPABASE_KEY } from './config.js'

const REST = `${SUPABASE_URL}/rest/v1`
const AUTH = `${SUPABASE_URL}/auth/v1`

// A sessão é a mesma gravada pela página de login (localStorage, chave padrão do Supabase).
function chaveSessao() {
  return `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`
}

export function obterSessao() {
  try {
    const sessao = JSON.parse(localStorage.getItem(chaveSessao()))
    if (!sessao?.access_token) return null
    if (sessao.expires_at && sessao.expires_at * 1000 < Date.now()) return null
    return sessao
  } catch {
    return null
  }
}

// Só entra quem tem conta
export function exigirLogin() {
  if (obterSessao()) return true
  window.location.href = 'login.html'
  return false
}

export async function sair() {
  const sessao = obterSessao()
  try {
    if (sessao) {
      await fetch(`${AUTH}/logout`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${sessao.access_token}` }
      })
    }
  } finally {
    localStorage.removeItem(chaveSessao())
    window.location.href = 'login.html'
  }
}

/**
 * Chamada genérica à API RESTful (PostgREST) do Supabase.
 * @param {string} caminho  ex.: 'cliente?id=eq.1'
 * @param {object} opcoes   { metodo, corpo, retornar }  retornar=true devolve o registro gravado
 */
export async function requisicao(caminho, { metodo = 'GET', corpo, retornar = false } = {}) {
  const sessao = obterSessao()
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${sessao?.access_token ?? SUPABASE_KEY}`
  }
  if (corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (retornar) headers.Prefer = 'return=representation'

  const resposta = await fetch(`${REST}/${caminho}`, {
    method: metodo,
    headers,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined
  })

  const texto = await resposta.text()
  const dados = texto ? JSON.parse(texto) : null

  if (!resposta.ok) {
    const erro = new Error(dados?.message || `Erro HTTP ${resposta.status}`)
    erro.code = dados?.code
    erro.status = resposta.status
    throw erro
  }
  return dados
}

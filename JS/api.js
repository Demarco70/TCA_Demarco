// Faz as requisições HTTP e controla a sessão

import { SUPABASE_URL, SUPABASE_KEY } from './config.js'

const REST = `${SUPABASE_URL}/rest/v1` //acessar e manipular os dados das tabelas
const AUTH = `${SUPABASE_URL}/auth/v1` //operações relacionadas a autenticação

// A sessão é a mesma gravada pela página de login (localStorage, chave padrão do Supabase).
function chaveSessao() {
  return `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`
}

// Verifica se existe uma sessão válida armazenada no navegador
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

// Encerra a sessão do usuário
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

// Função para fazer o CRUD funcional, sem que seja necessária a repetição
export async function requisicao(caminho, { metodo = 'GET', corpo, retornar = false } = {}) {
  const sessao = obterSessao() // Recupera o token de autenticação
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${sessao?.access_token ?? SUPABASE_KEY}`
  } // Montados os cabeçalhos
  if (corpo !== undefined) headers['Content-Type'] = 'application/json' //Vê se precisa enviar dados
  if (retornar) headers.Prefer = 'return=representation' // Pede para o supabase devolver os registros cadastrados

  const resposta = await fetch(`${REST}/${caminho}`, {
    method: metodo,
    headers,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined
  }) // Método HTTP com todas as funções do CRUD

  const texto = await resposta.text()
  const dados = texto ? JSON.parse(texto) : null

  if (!resposta.ok) {
    const erro = new Error(dados?.message || `Erro HTTP ${resposta.status}`)
    erro.code = dados?.code
    erro.status = resposta.status
    throw erro
  } // Trata de possíveis erros
  return dados
}

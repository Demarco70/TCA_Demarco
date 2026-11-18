const lista = document.getElementById('lista-clientes')
const form = document.getElementById('form-cliente')
const msg = document.getElementById('msg')
const campoBusca = document.getElementById('busca')
 
let clientes = []
 
function mostrar(texto, ok = true) {
  msg.textContent = texto
  msg.classList.remove('erro', 'sucesso')
  msg.classList.add(ok ? 'sucesso' : 'erro')
}
 
// Vai entrar só quem tem conta

async function exigirLogin() {
  const { data: { session } } = await supabaseClient.auth.getSession()
  if (!session) window.location.href = 'login.html'
}
 
function valor(id) {
  return document.getElementById(id).value.trim()
}
 
function soDigitos(texto) {
  return (texto || '').replace(/\D/g, '')
}
const URL_NOVA_SENHA = new URL('nova_senha.html', window.location.href).href
 
const formRecuperar = document.getElementById('form-recuperar')
const campoEmail = document.getElementById('email')
const msgRecuperar = document.getElementById('msg')
 
async function recuperarSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: URL_NOVA_SENHA,
  })
 
  if (error) {
    console.error('Erro ao enviar e-mail:', error.message)
    return { ok: false, mensagem: 'Não foi possível enviar o e-mail. Tente novamente em instantes.' }
  }
 
  // Mensagem genérica de propósito, para não revelar se o e-mail existe
  return { ok: true, mensagem: 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.' }
}
 
formRecuperar.addEventListener('submit', async (e) => {
  e.preventDefault()
 
  const botao = formRecuperar.querySelector('button[type="submit"]')
  botao.disabled = true
 
  const resultado = await recuperarSenha(campoEmail.value.trim())
  msgRecuperar.textContent = resultado.mensagem
 
  botao.disabled = false
})
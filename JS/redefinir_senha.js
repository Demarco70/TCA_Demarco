const URL_LOGIN = 'login.html' 
const formNovaSenha = document.getElementById('form-nova-senha')
const msgSenha = document.getElementById('msg-senha')
const avisoLink = document.getElementById('aviso-link')
 
supabase.auth.onAuthStateChange((event) => {
  if (event === 'PASSWORD_RECOVERY') {
    avisoLink.style.display = 'none'
    formNovaSenha.style.display = 'block'
  }
})
 
const params = new URLSearchParams(window.location.hash.substring(1) || window.location.search)
if (params.get('error')) {
  avisoLink.textContent = 'Este link é inválido ou expirou. Solicite um novo link de recuperação.'
  avisoLink.style.display = 'block'
}
 
async function atualizarSenha(novaSenha) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha })
 
  if (error) {
    console.error('Erro ao atualizar senha:', error.message)
    return { ok: false, mensagem: error.message }
  }
 
  return { ok: true, mensagem: 'Senha atualizada com sucesso! Redirecionando para o login...' }
}
 
formNovaSenha.addEventListener('submit', async (e) => {
  e.preventDefault()
 
  const senha = document.getElementById('nova-senha').value
  const confirmar = document.getElementById('confirmar-senha').value
 
  if (senha !== confirmar) {
    msgSenha.textContent = 'As senhas não coincidem.'
    return
  }
 
  const botao = formNovaSenha.querySelector('button[type="submit"]')
  botao.disabled = true
 
  const resultado = await atualizarSenha(senha)
  msgSenha.textContent = resultado.mensagem
 
  if (resultado.ok) {
    await supabase.auth.signOut()
    setTimeout(() => (window.location.href = URL_LOGIN), 2000)
  } else {
    botao.disabled = false
  }
})

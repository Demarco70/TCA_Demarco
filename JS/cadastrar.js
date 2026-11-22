import { exigirLogin } from './api.js'
import { criarCliente } from './clientes.js'
import { lerFormulario, mostrar, mensagemErro } from './utils.js'
import './componentes.js'

const form = document.getElementById('form-cliente')

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const dados = lerFormulario()
  if (!dados) return

  const botaoSalvar = form.querySelector('button[type="submit"]')
  botaoSalvar.disabled = true

  try {
    await criarCliente(dados.pessoa, dados.status, dados.endereco)
    mostrar('Cliente cadastrado.')
    form.reset()
  } catch (error) {
    mostrar(mensagemErro(error, 'Não foi possível salvar o cliente.'), false)
  } finally {
    botaoSalvar.disabled = false
  }
})

exigirLogin()

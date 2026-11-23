//Controla o cadastro de clientes

import { exigirLogin } from './api.js'
import { criarCliente } from './clientes.js'
import { lerFormulario, mostrar, mensagemErro } from './utils.js'
import './componentes.js'

const form = document.getElementById('form-cliente')

// Detectar envio de formulário
form.addEventListener('submit', async (e) => {
  e.preventDefault() // Impede que a página recarregue

  const dados = lerFormulario()
  if (!dados) return

  // Botão pode ser apertado mais de uma vez, mas só funciona 1
  const botaoSalvar = form.querySelector('button[type="submit"]')
  botaoSalvar.disabled = true

  // Realiza o cadastro
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

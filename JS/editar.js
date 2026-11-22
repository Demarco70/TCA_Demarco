import { exigirLogin } from './api.js'
import { buscarCliente, atualizarCliente } from './clientes.js'
import { lerFormulario, preencherFormulario, valor, mostrar, mensagemErro } from './utils.js'
import './componentes.js'

const form = document.getElementById('form-cliente')

async function carregar() {
  const id = new URLSearchParams(location.search).get('id')
  if (!id) return mostrar('Cliente não informado. Volte à lista e escolha "Editar".', false)

  try {
    const cliente = await buscarCliente(id)
    if (!cliente) return mostrar('Cliente não encontrado.', false)
    preencherFormulario(cliente)
    form.style.display = ''
  } catch (error) {
    console.error(error.message)
    mostrar('Erro ao carregar o cliente.', false)
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const dados = lerFormulario()
  if (!dados) return

  const botaoSalvar = form.querySelector('button[type="submit"]')
  botaoSalvar.disabled = true

  try {
    await atualizarCliente(
      valor('cliente-id'), valor('pessoa-id'), valor('endereco-id'),
      dados.pessoa, dados.status, dados.endereco
    )
    mostrar('Cliente atualizado.')
    await carregar()   // recarrega para pegar o id do endereço, se foi criado agora
  } catch (error) {
    mostrar(mensagemErro(error, 'Não foi possível salvar o cliente.'), false)
  } finally {
    botaoSalvar.disabled = false
  }
})

if (exigirLogin()) carregar()

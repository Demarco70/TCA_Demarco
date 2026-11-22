import { exigirLogin } from './api.js'
import { buscarCliente, excluirCliente, primeiroEndereco } from './clientes.js'
import { mostrar, mensagemErro } from './utils.js'
import './componentes.js'

const painel = document.getElementById('confirmacao')
const botaoExcluir = document.getElementById('btn-excluir')
let cliente = null

function dados(c) {
  const p = c.pessoa
  const end = primeiroEndereco(c)
  const cidadeUf = [end?.cidade, end?.estado].filter(Boolean).join('/')
  return [
    ['Nome', p.nome], ['CPF/CNPJ', p.cpf || p.cnpj], ['E-mail', p.email],
    ['Telefone', p.telefone], ['Cidade/UF', cidadeUf], ['Status', c.status]
  ]
}

async function carregar() {
  const id = new URLSearchParams(location.search).get('id')
  if (!id) return mostrar('Cliente não informado. Volte à lista e escolha "Excluir".', false)

  try {
    cliente = await buscarCliente(id)
    if (!cliente) return mostrar('Cliente não encontrado.', false)

    const dl = document.getElementById('dados-cliente')
    dados(cliente).forEach(([rotulo, texto]) => {
      const dt = document.createElement('dt')
      dt.textContent = rotulo
      const dd = document.createElement('dd')
      dd.textContent = texto || '–'
      dl.append(dt, dd)
    })
    painel.style.display = ''
  } catch (error) {
    console.error(error.message)
    mostrar('Erro ao carregar o cliente.', false)
  }
}

botaoExcluir.addEventListener('click', async () => {
  if (!confirm(`Excluir o cliente "${cliente.pessoa.nome}"?`)) return
  botaoExcluir.disabled = true

  try {
    await excluirCliente(cliente)
    painel.style.display = 'none'
    mostrar('Cliente excluído.')
  } catch (error) {
    botaoExcluir.disabled = false
    if (error.code === '23503') {
      return mostrar('Este cliente tem processos vinculados e não pode ser excluído. Altere o status para "inativo".', false)
    }
    mostrar(mensagemErro(error, 'Não foi possível excluir o cliente.'), false)
  }
})

if (exigirLogin()) carregar()

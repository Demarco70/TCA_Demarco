//Controla a listagem e pesquisa de clientes

import { exigirLogin } from './api.js'
import { listarClientes, primeiroEndereco } from './clientes.js'
import { mostrar, soDigitos } from './utils.js'
import './componentes.js'

const lista = document.getElementById('lista-clientes')
const campoBusca = document.getElementById('busca')
let clientes = []

// Links de ação
function link(texto, href) {
  const a = document.createElement('a')
  a.href = href
  a.textContent = texto
  return a
}

// Para cada pessoa cria uma linha 
function criarLinha(c) {
  const p = c.pessoa
  const end = primeiroEndereco(c)
  const cidadeUf = [end?.cidade, end?.estado].filter(Boolean).join('/')

  const tr = document.createElement('tr')
  ;[p.nome, p.cpf || p.cnpj, p.email, p.telefone, cidadeUf, c.status].forEach(texto => {
    const td = document.createElement('td')
    td.textContent = texto ?? ''   // textContent evita que texto digitado vire código na página
    tr.appendChild(td)
  })
  
  // Link de edição e exclusão são criados 
  const acoes = document.createElement('td')
  acoes.append(
    link('Editar', `cliente_editar.html?id=${encodeURIComponent(c.id)}`),
    ' ',
    link('Excluir', `cliente_excluir.html?id=${encodeURIComponent(c.id)}`)
  )
  tr.appendChild(acoes)
  return tr
}

function desenharLista() {
  const termo = campoBusca.value.trim().toLowerCase()
  const termoDigitos = soDigitos(termo)

  const filtrados = clientes.filter(c => {
    if (!termo) return true
    const p = c.pessoa
    const texto = [p.nome, p.email, p.cpf, p.cnpj].filter(Boolean).join(' ').toLowerCase()
    const documento = soDigitos(p.cpf || p.cnpj)
    return texto.includes(termo) || (termoDigitos && documento.includes(termoDigitos))
  })

  lista.replaceChildren()

  if (!filtrados.length) {
    const tr = lista.insertRow()
    const td = tr.insertCell()
    td.colSpan = 7
    td.textContent = 'Nenhum cliente encontrado.'
    return
  }

  filtrados.forEach(c => lista.appendChild(criarLinha(c)))
}

async function carregar() {
  try {
    clientes = await listarClientes()
    desenharLista()
  } catch (error) {
    console.error(error.message)
    mostrar('Erro ao carregar os clientes.', false)
  }
}

campoBusca.addEventListener('input', desenharLista)

if (exigirLogin()) carregar()

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

// 11 dígitos = CPF, 14 dígitos = CNPJ. Grava com pontuação, como os dados já existentes.
function separarDocumento(texto) {
  const d = soDigitos(texto)
  if (!d) return { cpf: null, cnpj: null }
  if (d.length === 11) {
    return { cpf: d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'), cnpj: null }
  }
  if (d.length === 14) {
    return { cpf: null, cnpj: d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') }
  }
  return null
}
 
function mensagemErro(error, padrao) {
  console.error(error.message)
  if (error.code === '23505') return 'Já existe uma pessoa cadastrada com esse CPF/CNPJ.'
  return padrao
}
 
function primeiroEndereco(c) {
  return c.pessoa.pessoa_endereco?.[0]?.endereco ?? null
}

/* ---------- Listagem e busca ---------- */

async function carregar() {
  const { data, error } = await supabaseClient
    .from('cliente')
    .select(`
      id, status, data_cadastro,
      pessoa:pessoa_id (
        id, nome, email, telefone, cpf, cnpj, data_nascimento,
        pessoa_endereco (
          id, tipo,
          endereco:endereco_id ( id, cep, rua, numero, complemento, cidade, estado )
        )
      )
    `)
 
  if (error) {
    console.error(error.message)
    return mostrar('Erro ao carregar os clientes.', false)
  }
 
  clientes = data.sort((a, b) => a.pessoa.nome.localeCompare(b.pessoa.nome, 'pt-BR'))
  desenharLista()
}
 
function botao(texto, aoClicar) {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = texto
  b.addEventListener('click', aoClicar)
  return b
}
 
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
 
  const acoes = document.createElement('td')
  acoes.append(
    botao('Editar', () => abrirForm(c)),
    botao('Excluir', () => excluir(c))
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
 
campoBusca.addEventListener('input', desenharLista)
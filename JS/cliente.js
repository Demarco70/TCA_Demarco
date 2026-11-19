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

/* ---------- Formulário ---------- */
 
const camposEndereco = ['cep', 'rua', 'numero', 'complemento', 'cidade', 'estado']
 
function abrirForm(c = null) {
  form.reset()
  document.getElementById('cliente-id').value = c?.id ?? ''
  document.getElementById('pessoa-id').value = c?.pessoa.id ?? ''
  document.getElementById('titulo-form').textContent = c ? 'Editar cliente' : 'Novo cliente'
 
  if (c) {
    const p = c.pessoa
    const end = primeiroEndereco(c)
    document.getElementById('nome').value = p.nome ?? ''
    document.getElementById('documento').value = p.cpf || p.cnpj || ''
    document.getElementById('email').value = p.email ?? ''
    document.getElementById('telefone').value = p.telefone ?? ''
    document.getElementById('data_nascimento').value = p.data_nascimento ?? ''
    document.getElementById('status').value = c.status ?? 'ativo'
    document.getElementById('endereco-id').value = end?.id ?? ''
    camposEndereco.forEach(k => (document.getElementById(k).value = end?.[k] ?? ''))
  } else {
    document.getElementById('endereco-id').value = ''
  }
 
  form.style.display = ''
  document.getElementById('nome').focus()
}
 
function fecharForm() {
  form.reset()
  form.style.display = 'none'
}
 
document.getElementById('btn-novo').addEventListener('click', () => abrirForm())
document.getElementById('btn-cancelar').addEventListener('click', fecharForm)
 
/* ---------- Gravação ---------- */
 
// Cria o endereço e o vínculo com a pessoa, ou atualiza o endereço existente
async function salvarEndereco(pessoaId, enderecoId, dados) {
  if (enderecoId) {
    const { error } = await supabaseClient.from('endereco').update(dados).eq('id', enderecoId)
    if (error) throw error
    return
  }
 
  const { data: end, error: erroEnd } = await supabaseClient
    .from('endereco').insert(dados).select('id').single()
  if (erroEnd) throw erroEnd
 
  const { error: erroVinculo } = await supabaseClient
    .from('pessoa_endereco')
    .insert({ pessoa_id: pessoaId, endereco_id: end.id, tipo: 'residencial' })
  if (erroVinculo) {
    await supabaseClient.from('endereco').delete().eq('id', end.id)  // desfaz
    throw erroVinculo
  }
}
 
async function criarCliente(pessoa, status, endereco) {
  const { data: nova, error: erroPessoa } = await supabaseClient
    .from('pessoa').insert(pessoa).select('id').single()
  if (erroPessoa) throw erroPessoa
 
  const { error: erroCliente } = await supabaseClient
    .from('cliente').insert({ pessoa_id: nova.id, status })
  if (erroCliente) {
    await supabaseClient.from('pessoa').delete().eq('id', nova.id)  // desfaz
    throw erroCliente
  }
 
  if (endereco) await salvarEndereco(nova.id, null, endereco)
}
 
async function atualizarCliente(clienteId, pessoaId, enderecoId, pessoa, status, endereco) {
  const { error: erroPessoa } = await supabaseClient
    .from('pessoa').update({ ...pessoa, atualizado_em: new Date().toISOString() }).eq('id', pessoaId)
  if (erroPessoa) throw erroPessoa
 
  const { error: erroCliente } = await supabaseClient
    .from('cliente').update({ status }).eq('id', clienteId)
  if (erroCliente) throw erroCliente
 
  if (endereco) await salvarEndereco(pessoaId, enderecoId || null, endereco)
}
 
form.addEventListener('submit', async (e) => {
  e.preventDefault()
 
  const documento = separarDocumento(valor('documento'))
  if (!documento) return mostrar('CPF deve ter 11 dígitos e CNPJ deve ter 14.', false)
 
  const pessoa = {
    nome: valor('nome'),
    email: valor('email') || null,
    telefone: valor('telefone') || null,
    cpf: documento.cpf,
    cnpj: documento.cnpj,
    data_nascimento: valor('data_nascimento') || null,
  }
 
  const dadosEndereco = {}
  camposEndereco.forEach(k => (dadosEndereco[k] = valor(k) || null))
  if (dadosEndereco.estado) dadosEndereco.estado = dadosEndereco.estado.toUpperCase()
  const temEndereco = Object.values(dadosEndereco).some(Boolean)
  if (temEndereco && !dadosEndereco.cep) return mostrar('Informe o CEP para salvar o endereço.', false)
  const endereco = temEndereco ? dadosEndereco : null
 
  const status = valor('status')
  const clienteId = valor('cliente-id')
 
  const botaoSalvar = form.querySelector('button[type="submit"]')
  botaoSalvar.disabled = true
 
  try {
    if (clienteId) {
      await atualizarCliente(clienteId, valor('pessoa-id'), valor('endereco-id'), pessoa, status, endereco)
      mostrar('Cliente atualizado.')
    } else {
      await criarCliente(pessoa, status, endereco)
      mostrar('Cliente cadastrado.')
    }
    fecharForm()
    await carregar()
  } catch (error) {
    mostrar(mensagemErro(error, 'Não foi possível salvar o cliente.'), false)
  } finally {
    botaoSalvar.disabled = false
  }
})
 
/* ---------- Exclusão ---------- */
 
async function excluir(c) {
  if (!confirm(`Excluir o cliente "${c.pessoa.nome}"?`)) return
 
  const { error } = await supabaseClient.from('cliente').delete().eq('id', c.id)
  if (error) {
    if (error.code === '23503') {
      return mostrar('Este cliente tem processos vinculados e não pode ser excluído. Altere o status para "inativo".', false)
    }
    return mostrar(mensagemErro(error, 'Não foi possível excluir o cliente.'), false)
  }
 
  // Limpeza: remove o cadastro de pessoa e endereços que ficaram sem uso.
  // Se a pessoa ainda for usada em outro lugar (ex.: parte de um processo), ela é mantida.
  const pessoaId = c.pessoa.id
  const idsEnderecos = (c.pessoa.pessoa_endereco || []).map(pe => pe.endereco?.id).filter(Boolean)
 
  await supabaseClient.from('pessoa_endereco').delete().eq('pessoa_id', pessoaId)
  const { error: erroPessoa } = await supabaseClient.from('pessoa').delete().eq('id', pessoaId)
  if (!erroPessoa && idsEnderecos.length) {
    await supabaseClient.from('endereco').delete().in('id', idsEnderecos)
  }
 
  mostrar('Cliente excluído.')
  await carregar()
}
 
exigirLogin().then(carregar)
 
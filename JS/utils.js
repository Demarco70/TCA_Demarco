import { camposEndereco, primeiroEndereco } from './clientes.js'

export function valor(id) {
  return document.getElementById(id).value.trim()
}

export function soDigitos(texto) {
  return (texto || '').replace(/\D/g, '')
}

export function mostrar(texto, ok = true) {
  const msg = document.getElementById('msg')
  msg.textContent = texto
  msg.classList.remove('erro', 'sucesso')
  msg.classList.add(ok ? 'sucesso' : 'erro')
}

export function mensagemErro(error, padrao) {
  console.error(error.message)
  if (error.code === '23505') return 'Já existe uma pessoa cadastrada com esse CPF/CNPJ.'
  return padrao
}

// 11 dígitos = CPF, 14 dígitos = CNPJ. Grava com pontuação, como os dados já existentes.
export function separarDocumento(texto) {
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

// Lê o formulário e valida. Devolve { pessoa, status, endereco } ou null (já mostrando o erro).
export function lerFormulario() {
  const documento = separarDocumento(valor('documento'))
  if (!documento) {
    mostrar('CPF deve ter 11 dígitos e CNPJ deve ter 14.', false)
    return null
  }

  const pessoa = {
    nome: valor('nome'),
    email: valor('email') || null,
    telefone: valor('telefone') || null,
    cpf: documento.cpf,
    cnpj: documento.cnpj,
    data_nascimento: valor('data_nascimento') || null
  }

  const dadosEndereco = {}
  camposEndereco.forEach(k => (dadosEndereco[k] = valor(k) || null))
  if (dadosEndereco.estado) dadosEndereco.estado = dadosEndereco.estado.toUpperCase()
  const temEndereco = Object.values(dadosEndereco).some(Boolean)
  if (temEndereco && !dadosEndereco.cep) {
    mostrar('Informe o CEP para salvar o endereço.', false)
    return null
  }

  return { pessoa, status: valor('status'), endereco: temEndereco ? dadosEndereco : null }
}

export function preencherFormulario(c) {
  const p = c.pessoa
  const end = primeiroEndereco(c)
  document.getElementById('cliente-id').value = c.id
  document.getElementById('pessoa-id').value = p.id
  document.getElementById('nome').value = p.nome ?? ''
  document.getElementById('documento').value = p.cpf || p.cnpj || ''
  document.getElementById('email').value = p.email ?? ''
  document.getElementById('telefone').value = p.telefone ?? ''
  document.getElementById('data_nascimento').value = p.data_nascimento ?? ''
  document.getElementById('status').value = c.status ?? 'ativo'
  document.getElementById('endereco-id').value = end?.id ?? ''
  camposEndereco.forEach(k => (document.getElementById(k).value = end?.[k] ?? ''))
}

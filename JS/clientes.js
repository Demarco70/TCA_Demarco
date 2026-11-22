import { requisicao } from './api.js'

const SELECT = `id,status,data_cadastro,pessoa:pessoa_id(id,nome,email,telefone,cpf,cnpj,data_nascimento,pessoa_endereco(id,tipo,endereco:endereco_id(id,cep,rua,numero,complemento,cidade,estado)))`

export const camposEndereco = ['cep', 'rua', 'numero', 'complemento', 'cidade', 'estado']

/* ---------- Consulta (READ) ---------- */

export async function listarClientes() {
  const dados = await requisicao(`cliente?select=${encodeURIComponent(SELECT)}`)
  return dados.sort((a, b) => a.pessoa.nome.localeCompare(b.pessoa.nome, 'pt-BR'))
}

export async function buscarCliente(id) {
  const dados = await requisicao(`cliente?select=${encodeURIComponent(SELECT)}&id=eq.${encodeURIComponent(id)}`)
  return dados[0] ?? null
}

export function primeiroEndereco(c) {
  return c.pessoa.pessoa_endereco?.[0]?.endereco ?? null
}

/* ---------- Gravação (CREATE / UPDATE) ---------- */

// Cria o endereço e o vínculo com a pessoa, ou atualiza o endereço existente
async function salvarEndereco(pessoaId, enderecoId, dados) {
  if (enderecoId) {
    await requisicao(`endereco?id=eq.${enderecoId}`, { metodo: 'PATCH', corpo: dados })
    return
  }

  const [end] = await requisicao('endereco', { metodo: 'POST', corpo: dados, retornar: true })

  try {
    await requisicao('pessoa_endereco', {
      metodo: 'POST',
      corpo: { pessoa_id: pessoaId, endereco_id: end.id, tipo: 'residencial' }
    })
  } catch (erro) {
    await requisicao(`endereco?id=eq.${end.id}`, { metodo: 'DELETE' })  // desfaz
    throw erro
  }
}

export async function criarCliente(pessoa, status, endereco) {
  const [nova] = await requisicao('pessoa', { metodo: 'POST', corpo: pessoa, retornar: true })

  try {
    await requisicao('cliente', { metodo: 'POST', corpo: { pessoa_id: nova.id, status } })
  } catch (erro) {
    await requisicao(`pessoa?id=eq.${nova.id}`, { metodo: 'DELETE' })  // desfaz
    throw erro
  }

  if (endereco) await salvarEndereco(nova.id, null, endereco)
}

export async function atualizarCliente(clienteId, pessoaId, enderecoId, pessoa, status, endereco) {
  await requisicao(`pessoa?id=eq.${pessoaId}`, {
    metodo: 'PATCH',
    corpo: { ...pessoa, atualizado_em: new Date().toISOString() }
  })
  await requisicao(`cliente?id=eq.${clienteId}`, { metodo: 'PATCH', corpo: { status } })

  if (endereco) await salvarEndereco(pessoaId, enderecoId || null, endereco)
}

/* ---------- Exclusão (DELETE) ---------- */

export async function excluirCliente(c) {
  // Se houver processos vinculados, o banco recusa (erro 23503) e nada mais é apagado.
  await requisicao(`cliente?id=eq.${c.id}`, { metodo: 'DELETE' })

  // Limpeza: remove a pessoa e os endereços que ficaram sem uso.
  // Se a pessoa ainda for usada em outro lugar (ex.: parte de um processo), ela é mantida.
  const pessoaId = c.pessoa.id
  const idsEnderecos = (c.pessoa.pessoa_endereco || []).map(pe => pe.endereco?.id).filter(Boolean)

  await requisicao(`pessoa_endereco?pessoa_id=eq.${pessoaId}`, { metodo: 'DELETE' })
  try {
    await requisicao(`pessoa?id=eq.${pessoaId}`, { metodo: 'DELETE' })
    if (idsEnderecos.length) {
      await requisicao(`endereco?id=in.(${idsEnderecos.join(',')})`, { metodo: 'DELETE' })
    }
  } catch (erro) {
    console.error(erro.message)  // pessoa em uso em outro lugar: mantida
  }
}

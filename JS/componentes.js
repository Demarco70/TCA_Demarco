//Cria componentes compartilhados das páginas

import { sair } from './api.js'

// Mantém o cabeçalho padrão a todas as páginas
class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <div class="topo">
          <img alt="Logo ProHabeas" src="Img/Logo Corporativo ProHabeas em Azul Gradiente.png">
        </div>
      </header>`
  }
}

// Identifica a página aberta para criar os links necessários
class SiteNav extends HTMLElement {
  connectedCallback() {
    const paginaAtual = location.pathname.split('/').pop() || 'clientes.html'
    const links = [
      ['pagina_do_usuario.html', 'Painel'],
      ['clientes.html', 'Clientes'],
      ['cliente_cadastrar.html', 'Novo cliente']
    ]

    this.innerHTML = `
      <nav class="menu-painel" aria-label="Clientes">
        ${links.map(([href, texto]) =>
          `<a href="${href}"${href === paginaAtual ? ' aria-current="page"' : ''}>${texto}</a>`
        ).join('')}
        <button type="button" id="btn-sair">Sair</button>
      </nav>`

    this.querySelector('#btn-sair').addEventListener('click', sair)
  }
}
 
// Cria o rodapé compartilhado 
class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <p>Desenvolvido por: Gabriel da Silveira Garcia Demarco</p>
      </footer>`
  }
}

// Registram os elementos personalizados do navegador
customElements.define('site-header', SiteHeader)
customElements.define('site-nav', SiteNav)
customElements.define('site-footer', SiteFooter)

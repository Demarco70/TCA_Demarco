import { sair } from './api.js'

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

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <p>Desenvolvido por: Gabriel da Silveira Garcia Demarco</p>
      </footer>`
  }
}

customElements.define('site-header', SiteHeader)
customElements.define('site-nav', SiteNav)
customElements.define('site-footer', SiteFooter)

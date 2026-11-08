const formCadastro = document.getElementById("form-cadastro");
const mensagemCadastro = document.getElementById("mensagem");

function mostrarMensagem(texto, tipo) {
    mensagemCadastro.textContent = texto;
    mensagemCadastro.className = "mensagem " + tipo;
}

formCadastro.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmar = document.getElementById("confirmar-senha").value;
    const botao = formCadastro.querySelector("button[type='submit']");

    if (senha !== confirmar) {
        mostrarMensagem("As senhas não coincidem.", "erro");
        return;
    }

    botao.disabled = true;
    mostrarMensagem("Criando conta...", "");

    const { error } = await supabaseClient.auth.signUp({ email, password: senha });

    botao.disabled = false;

    if (error) {
        mostrarMensagem("Não foi possível cadastrar: " + error.message, "erro");
        return;
    }

    mostrarMensagem("Cadastro realizado! Verifique seu e-mail para confirmar a conta.", "sucesso");
    formCadastro.reset();
});

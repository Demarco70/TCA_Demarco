const formLogin = document.getElementById("form-login");
const mensagemLogin = document.getElementById("mensagem");

formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const botao = formLogin.querySelector("button[type='submit']");

    botao.disabled = true;
    mensagemLogin.textContent = "Entrando...";
    mensagemLogin.className = "mensagem";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });

    if (error) {
        botao.disabled = false;
        mensagemLogin.textContent = "Não foi possível entrar: " + error.message;
        mensagemLogin.className = "mensagem erro";
        return;
    }

    window.location.href = "pagina.html";
});
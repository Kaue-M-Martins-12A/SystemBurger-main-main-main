document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (password !== confirm) {
        window.UI.toast('As senhas não coincidem!', 'error');
        return;
    }

    const btn = document.getElementById('reg-btn');
    btn.disabled = true;
    btn.textContent = 'Carregando...';
    await Auth.register(name, email, password);
    btn.disabled = false;
    btn.textContent = 'Criar Conta';
});

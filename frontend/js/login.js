document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.textContent = 'Carregando...';
    await Auth.login(email, password);
    btn.disabled = false;
    btn.textContent = 'Entrar';
});

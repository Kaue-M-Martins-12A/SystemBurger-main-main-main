const path = require('path');

exports.getHome = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'index.html'));
};

exports.getLogin = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'login.html'));
};

exports.getCadastro = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'cadastro.html'));
};

exports.getCardapio = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'cardapio.html'));
};

exports.getPagamento = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'pagamento.html'));
};

exports.getPerfil = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'perfil.html'));
};

exports.getCarrinho = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'carrinho.html'));
};

exports.getContato = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'contato.html'));
};

exports.getAdmin = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'admin.html'));
};

exports.getAdminPedidos = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'admin-pedidos.html'));
};

exports.getAdminProdutos = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'admin-produtos.html'));
};

exports.getAdminUsuarios = (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'html', 'admin-usuarios.html'));
};

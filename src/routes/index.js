const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const apiController = require('../controllers/apiController');
const multer = require('multer');
const path = require('path');

// Configuração do Multer para Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'frontend/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 400 * 1024 * 1024 }, // Limite de 400MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Apenas imagens (jpeg, jpg, png, webp) são permitidas!'));
    }
});

// HTML Pages
router.get('/', pageController.getHome);
router.get('/login', pageController.getLogin);
router.get('/cadastro', pageController.getCadastro);
router.get('/cardapio', pageController.getCardapio);
router.get('/carrinho', pageController.getCarrinho);
router.get('/pagamento', pageController.getPagamento);
router.get('/perfil', pageController.getPerfil);
router.get('/contato', pageController.getContato);
router.get('/admin', apiController.adminMiddleware, pageController.getAdmin);
router.get('/admin/pedidos', apiController.adminMiddleware, pageController.getAdminPedidos);
router.get('/admin/produtos', apiController.adminMiddleware, pageController.getAdminProdutos);
router.get('/admin/usuarios', apiController.adminMiddleware, pageController.getAdminUsuarios);

// API Rotas (Autenticação)
router.post('/api/auth/register', apiController.register);
router.post('/api/auth/login', apiController.login);
router.post('/api/auth/logout', apiController.logout);
router.get('/api/auth/check', apiController.checkAuth);

// API Rotas (Produtos)
router.get('/api/products', apiController.getProducts);
router.post('/api/products', apiController.createProduct);
router.put('/api/products/:id', apiController.updateProduct);
router.delete('/api/products/:id', apiController.deleteProduct);

// API Rotas (Protegidas pelo Middleware de Auth)
router.get('/api/user/profile', apiController.authMiddleware, apiController.getProfile);
router.put('/api/user/profile', apiController.authMiddleware, apiController.updateProfile);
router.post('/api/user/profile-picture', apiController.authMiddleware, upload.single('avatar'), apiController.updateProfilePicture);
router.post('/api/orders', apiController.authMiddleware, apiController.saveOrder);
router.get('/api/orders', apiController.authMiddleware, apiController.getOrders);
router.get('/api/recommendations', apiController.authMiddleware, apiController.getRecommendations);

// API Rotas (Admin)
router.get('/api/admin/dashboard', apiController.adminMiddleware, apiController.getAdminDashboard);
router.get('/api/admin/orders', apiController.adminMiddleware, apiController.getAllOrders);
router.get('/api/admin/users', apiController.adminMiddleware, apiController.getAdminUsers);
router.get('/api/admin/users/:id', apiController.adminMiddleware, apiController.getAdminUserDetails);
router.post('/api/admin/users/:id/block', apiController.adminMiddleware, apiController.blockUser);
router.get('/api/admin/seed', apiController.adminMiddleware, apiController.seedDashboard);

module.exports = router;

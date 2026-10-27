import { Router } from 'express';
import { login, perfil, estado, registro } from '../controllers/auth.controller.js';
import { verificarToken, soloAdmin, permitirRegistro } from '../middlewares/auth.js';
import { limiteLogin } from '../middlewares/limiteLogin.js';

const router = Router();

router.post('/login', limiteLogin, login);
router.get('/perfil', verificarToken, soloAdmin, perfil);
router.get('/estado', estado);
router.post('/registro', permitirRegistro, registro);

export default router;

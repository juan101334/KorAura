import { Router } from 'express';
import { listar, cambiarEstado } from '../controllers/usuarios.controller.js';
import { verificarToken, soloAdmin } from '../middlewares/auth.js';

const router = Router();

router.use(verificarToken, soloAdmin);

router.get('/', listar);
router.patch('/:id/estado', cambiarEstado);

export default router;

import { Router } from 'express';
import {
  listarPublicos,
  listarTodos,
  obtener,
  crear,
  actualizar,
  eliminar,
  subirFoto,
} from '../controllers/productos.controller.js';
import { verificarToken, soloAdmin } from '../middlewares/auth.js';
import { subirImagen } from '../middlewares/subirImagen.js';

const router = Router();

router.get('/', listarPublicos);

router.get('/admin', verificarToken, soloAdmin, listarTodos);
router.post('/imagen', verificarToken, soloAdmin, subirImagen, subirFoto);
router.get('/:id', verificarToken, soloAdmin, obtener);
router.post('/', verificarToken, soloAdmin, crear);
router.put('/:id', verificarToken, soloAdmin, actualizar);
router.delete('/:id', verificarToken, soloAdmin, eliminar);

export default router;

import { Router } from 'express';
import { conversar } from '../controllers/chat.controller.js';
import { limiteMensajes } from '../middlewares/limiteMensajes.js';

const router = Router();

router.post('/', limiteMensajes, conversar);

export default router;

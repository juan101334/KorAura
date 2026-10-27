import { crearLimitador } from './limitador.js';

export const limiteMensajes = crearLimitador({
  maximo: 7,
  ventanaMs: 60 * 1000,
  mensaje: 'Estás enviando muchas preguntas. Espera un minuto e intenta de nuevo.',
});

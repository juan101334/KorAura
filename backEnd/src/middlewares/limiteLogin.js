import { crearLimitador } from './limitador.js';

export const limiteLogin = crearLimitador({
  maximo: 20,
  ventanaMs: 15 * 60 * 1000,
  mensaje: 'Demasiados intentos de inicio de sesión. Espera unos minutos e intenta de nuevo.',
});
